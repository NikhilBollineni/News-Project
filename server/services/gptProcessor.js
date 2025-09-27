const OpenAI = require('openai');
const ProcessedArticle = require('../models/ProcessedArticle');
const IngestionLog = require('../models/IngestionLog');
const costOptimizationService = require('./costOptimizationService');
const logger = require('../utils/logger');

class GPTProcessor {
  constructor() {
    // Only initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else {
      this.openai = null;
      console.warn('⚠️  OpenAI API key not configured. GPT processing will be disabled.');
    }
    
    this.config = {
      model: process.env.GPT_MODEL || 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.3,
      batchSize: parseInt(process.env.GPT_BATCH_SIZE) || 5,
      maxRetries: 3,
      retryDelay: 2000,
      confidenceThreshold: parseFloat(process.env.GPT_CONFIDENCE_THRESHOLD) || 0.6,
      maxConcurrency: parseInt(process.env.GPT_MAX_CONCURRENCY) || 2
    };
    
    this.industries = ['Automotive', 'HVAC', 'Finance', 'Healthcare', 'Energy', 'Tech', 'Unknown'];
    this.categories = ['Launch', 'Financials', 'Competitor', 'Regulation', 'Research', 'Opinion', 'Other'];
  }

  /**
   * Create the GPT prompt for classification and summarization
   */
  createPrompt(articles) {
    const articlesText = articles.map((article, index) => {
      return `
Article ${index + 1}:
URL: ${article.link}
Title: ${article.title}
Content: ${(article.cleanText || article.snippet || '').substring(0, 2000)}
Published: ${article.publishedAt}
`.trim();
    }).join('\n\n');

    const enhancedPrompt = `
You are an expert industry news analyst. 
Your task is to classify and summarize news articles.

### INDUSTRIES (choose exactly ONE)
- Automotive → cars, trucks, motorcycles, EVs, batteries, auto manufacturers, suppliers, dealerships, auto parts, vehicle launches, driving, transportation
- Tech → software, hardware, AI, chips, computers, mobile devices, social media, internet companies, gaming
- Finance → banks, investments, stocks, insurance, financial services, economic policy
- Healthcare → medical devices, pharmaceuticals, hospitals, health insurance, medical research
- Energy → oil, gas, renewables, utilities, power generation, energy policy
- HVAC → heating, ventilation, air conditioning, building systems
- Unknown → use only if classification is unclear or mixed

### CATEGORIES (choose exactly ONE)
- Launch → new product, vehicle unveiling, new model, new service, market entry
- Financials → earnings, revenue, profits, funding, acquisitions, financial results
- Competitor → competition, market share battles, competitor strategies
- Regulation → government policies, safety rules, compliance, legal changes
- Research → studies, R&D, technological breakthroughs
- Opinion → editorials, reviews, expert analysis, commentary
- Other → general business news, partnerships, announcements

### EXAMPLES
- "Tesla launches new Model 3 in Europe" → industry: Automotive, category: Launch  
- "Toyota reports Q2 earnings beating estimates" → industry: Automotive, category: Financials  
- "BMW faces competition from Mercedes in EV market" → industry: Automotive, category: Competitor  
- "Apple unveils iPhone 16" → industry: Tech, category: Launch  
- "JPMorgan profits rise in Q3" → industry: Finance, category: Financials  
- "Pfizer announces results of new vaccine trial" → industry: Healthcare, category: Research  
- "Siemens introduces new HVAC control system" → industry: HVAC, category: Launch  

### OUTPUT RULES
- Always return ONLY valid JSON (array of objects).  
- Do not add explanations or text outside JSON.  
- Confidence is a float 0.0–1.0. If unsure, lower confidence.  
- Summaries must be concise (2–4 sentences).  

### JSON SCHEMA
[
  {
    "url": "https://...",
    "title": "string",
    "industry": "Automotive | Tech | Finance | Healthcare | Energy | HVAC | Unknown",
    "category": "Launch | Financials | Competitor | Regulation | Research | Opinion | Other",
    "summary": "string (2-4 sentences)",
    "confidence": 0.00,
    "key_entities": ["Company A", "Product B"],
    "language": "en"
  }
]

ARTICLES TO ANALYZE:
${articlesText}`;

    return enhancedPrompt;
  }

  /**
   * Process a batch of articles with GPT
   */
  async processBatch(articles, retryCount = 0) {
    try {
      // Check if OpenAI is available
      if (!this.openai) {
        logger.warn('OpenAI not available, skipping GPT processing');
        return {
          success: false,
          results: articles.map(article => ({
            articleId: article._id,
            success: false,
            error: 'OpenAI API key not configured',
            gptStatus: 'failed'
          })),
          error: 'OpenAI API key not configured'
        };
      }

      logger.info(`Processing batch of ${articles.length} articles with GPT`);
      
      const prompt = this.createPrompt(articles);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: "You are an expert news analyst. Always respond with valid JSON only. No explanations or additional text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        timeout: 30000
      });

      const content = response.choices[0].message.content.trim();
      
      // Parse JSON response
      let gptResults;
      try {
        gptResults = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }

      // Validate response format
      if (!Array.isArray(gptResults)) {
        throw new Error('Response is not an array');
      }

      if (gptResults.length !== articles.length) {
        throw new Error(`Expected ${articles.length} results, got ${gptResults.length}`);
      }

      // Process each result
      const processedResults = [];
      for (let i = 0; i < gptResults.length; i++) {
        const gptResult = gptResults[i];
        const article = articles[i];
        
        try {
          const processedResult = this.validateAndProcessResult(gptResult, article);
          processedResults.push(processedResult);
        } catch (validationError) {
          logger.error(`Validation error for article ${article._id}:`, validationError.message);
          processedResults.push({
            articleId: article._id,
            success: false,
            error: validationError.message,
            gptStatus: 'failed'
          });
        }
      }

      // Calculate token usage and cost
      const tokenUsage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const estimatedCost = this.calculateCost(tokenUsage);

      // Track cost optimization
      costOptimizationService.trackGPTUsage(tokenUsage, estimatedCost);

      logger.info(`Successfully processed batch: ${processedResults.filter(r => r.success).length}/${articles.length} successful, ${tokenUsage.total_tokens} tokens, ~$${estimatedCost.toFixed(4)}`);

      return {
        success: true,
        results: processedResults,
        tokenUsage,
        estimatedCost
      };

    } catch (error) {
      logger.error(`Error processing GPT batch:`, error.message);
      
      if (retryCount < this.config.maxRetries && this.shouldRetry(error)) {
        logger.info(`Retrying GPT batch processing (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.processBatch(articles, retryCount + 1);
      }

      // Return failed results for all articles
      const failedResults = articles.map(article => ({
        articleId: article._id,
        success: false,
        error: error.message,
        gptStatus: 'failed'
      }));

      return {
        success: false,
        results: failedResults,
        error: error.message
      };
    }
  }

  /**
   * Validate and process individual GPT result
   */
  validateAndProcessResult(gptResult, article) {
    // Validate required fields
    const requiredFields = ['url', 'title', 'industry', 'category', 'summary', 'confidence', 'key_entities', 'language'];
    for (const field of requiredFields) {
      if (!(field in gptResult)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate industry
    if (!this.industries.includes(gptResult.industry)) {
      throw new Error(`Invalid industry: ${gptResult.industry}`);
    }

    // Validate category
    if (!this.categories.includes(gptResult.category)) {
      throw new Error(`Invalid category: ${gptResult.category}`);
    }

    // Validate confidence
    const confidence = parseFloat(gptResult.confidence);
    if (isNaN(confidence) || confidence < 0 || confidence > 1) {
      throw new Error(`Invalid confidence value: ${gptResult.confidence}`);
    }

    // Validate key_entities
    if (!Array.isArray(gptResult.key_entities)) {
      throw new Error('key_entities must be an array');
    }

    // Validate language
    if (typeof gptResult.language !== 'string' || gptResult.language.length !== 2) {
      throw new Error(`Invalid language code: ${gptResult.language}`);
    }

    // Apply confidence filtering for automotive articles
    let finalIndustry = gptResult.industry;
    let isAutomotiveFiltered = false;
    
    // If industry is not Automotive OR confidence is below 0.7, mark as Unknown for automotive dashboard filtering
    if (gptResult.industry !== 'Automotive' || confidence < 0.7) {
      if (gptResult.industry === 'Automotive' && confidence < 0.7) {
        // Keep original industry but mark for filtering
        isAutomotiveFiltered = true;
      } else if (gptResult.industry !== 'Automotive') {
        // Non-automotive content - keep original classification
        finalIndustry = gptResult.industry;
      }
    }

    return {
      articleId: article._id,
      success: true,
      industry: finalIndustry,
      category: gptResult.category,
      summary: gptResult.summary.trim(),
      confidence: confidence,
      keyEntities: gptResult.key_entities.filter(entity => entity && entity.trim()),
      language: gptResult.language,
      notes: gptResult.notes || '',
      requiresReview: confidence < this.config.confidenceThreshold,
      isAutomotiveFiltered: isAutomotiveFiltered,
      originalIndustry: gptResult.industry // Keep original for auditing
    };
  }

  /**
   * Check if error is retryable
   */
  shouldRetry(error) {
    if (error.response) {
      const status = error.response.status;
      return status >= 500 || status === 429; // Server errors or rate limiting
    }
    
    const retryableErrors = [
      'timeout',
      'ECONNRESET',
      'ETIMEDOUT',
      'Invalid JSON response'
    ];
    
    return retryableErrors.some(retryableError => 
      error.message.includes(retryableError)
    );
  }

  /**
   * Calculate estimated cost based on token usage
   */
  calculateCost(tokenUsage) {
    // GPT-3.5-turbo pricing (as of 2023)
    const promptCostPer1k = 0.0015; // $0.0015 per 1K prompt tokens
    const completionCostPer1k = 0.002; // $0.002 per 1K completion tokens
    
    const promptCost = (tokenUsage.prompt_tokens / 1000) * promptCostPer1k;
    const completionCost = (tokenUsage.completion_tokens / 1000) * completionCostPer1k;
    
    return promptCost + completionCost;
  }

  /**
   * Process unprocessed articles in batches
   */
  async processUnprocessedArticles(limit = 50) {
    try {
      logger.info(`Processing unprocessed articles (limit: ${limit})`);
      
      const unprocessedArticles = await ProcessedArticle.find({
        gptStatus: 'pending',
        isDuplicate: { $ne: true }
      })
      .sort({ fetchedAt: 1 }) // Process oldest first
      .limit(limit);

      // Apply cost optimization
      const optimizedArticles = costOptimizationService.optimizeGPTBatch(unprocessedArticles);

      if (optimizedArticles.length === 0) {
        logger.info('No articles to process after optimization');
        return { success: true, processedCount: 0 };
      }

      logger.info(`Found ${optimizedArticles.length} optimized articles to process (from ${unprocessedArticles.length} total)`);

      // Process in batches
      const results = [];
      const batches = [];
      
      for (let i = 0; i < optimizedArticles.length; i += this.config.batchSize) {
        batches.push(optimizedArticles.slice(i, i + this.config.batchSize));
      }

      let totalProcessed = 0;
      let totalCost = 0;
      let totalTokens = 0;

      for (const batch of batches) {
        const batchResult = await this.processBatch(batch);
        results.push(batchResult);
        
        if (batchResult.success) {
          totalProcessed += batchResult.results.filter(r => r.success).length;
          totalCost += batchResult.estimatedCost || 0;
          totalTokens += batchResult.tokenUsage?.total_tokens || 0;
        }

        // Update articles in database
        for (const result of batchResult.results) {
          await this.updateArticle(result);
        }

        // Add delay between batches to avoid rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info(`GPT processing completed: ${totalProcessed} articles processed, ${totalTokens} tokens, ~$${totalCost.toFixed(4)} total cost`);

      return {
        success: true,
        processedCount: totalProcessed,
        totalBatches: batches.length,
        totalCost,
        totalTokens,
        results
      };

    } catch (error) {
      logger.error('Error in processUnprocessedArticles:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update article with GPT processing results
   */
  async updateArticle(result) {
    try {
      const updateData = {
        gptStatus: result.success ? 'processed' : 'failed',
        gptProcessedAt: new Date()
      };

      if (result.success) {
        updateData.industry = result.industry;
        updateData.category = result.category;
        updateData.summary = result.summary;
        updateData.confidence = result.confidence;
        updateData.keyEntities = result.keyEntities;
        updateData.language = result.language;
        updateData.requiresReview = result.requiresReview;
        updateData.reviewReason = result.requiresReview ? 'low_confidence' : null;
        updateData.isAutomotiveFiltered = result.isAutomotiveFiltered || false;
        updateData.originalIndustry = result.originalIndustry;
      } else {
        updateData.gptError = result.error;
      }

      await ProcessedArticle.findByIdAndUpdate(result.articleId, updateData);
      
      logger.info(`Updated article ${result.articleId} with GPT results`);

    } catch (error) {
      logger.error(`Error updating article ${result.articleId}:`, error.message);
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats() {
    try {
      const stats = await ProcessedArticle.aggregate([
        {
          $group: {
            _id: '$gptStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalArticles = await ProcessedArticle.countDocuments();
      const processedArticles = await ProcessedArticle.countDocuments({ gptStatus: 'processed' });
      const pendingArticles = await ProcessedArticle.countDocuments({ gptStatus: 'pending' });
      const failedArticles = await ProcessedArticle.countDocuments({ gptStatus: 'failed' });
      const reviewRequired = await ProcessedArticle.countDocuments({ requiresReview: true });

      return {
        total: totalArticles,
        processed: processedArticles,
        pending: pendingArticles,
        failed: failedArticles,
        reviewRequired,
        processingRate: totalArticles > 0 ? (processedArticles / totalArticles) * 100 : 0,
        statusBreakdown: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };

    } catch (error) {
      logger.error('Error getting processing stats:', error.message);
      return null;
    }
  }
}

module.exports = new GPTProcessor();
