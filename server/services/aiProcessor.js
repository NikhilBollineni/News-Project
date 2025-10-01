const OpenAI = require('openai');

class AIProcessor {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 2500;
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.3;
    
    console.log('🤖 AI Processor initialized');
  }
  
  async processArticle(article) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ OpenAI API key not configured, skipping AI processing');
        return null;
      }
      
      console.log(`🤖 Processing article with AI: ${article.title}`);
      
      const prompt = this.createPrompt(article);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert automotive industry analyst. Analyze automotive news articles and provide structured insights in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: "json_object" }
      });
      
      const aiResult = JSON.parse(response.choices[0].message.content);
      
      // Validate and clean the AI response
      const processedResult = this.validateAIResponse(aiResult);
      
      console.log(`✅ AI processing completed for article: ${article.title}`);
      return processedResult;
      
    } catch (error) {
      console.error(`❌ AI processing failed for article ${article._id}:`, error.message);
      
      // Return fallback data if AI processing fails
      return this.createFallbackResponse(article);
    }
  }
  
  createPrompt(article) {
    return `Analyze this automotive news article and provide insights in JSON format:

TITLE: ${article.title}
SUMMARY: ${article.summary}
CONTENT: ${article.content || 'No content available'}
URL: ${article.url}
SOURCE: ${article.source?.name || 'Unknown'}
PUBLISHED: ${article.publishedAt}

Please provide a JSON response with the following structure:
{
  "title": "Enhanced title (max 100 characters, more engaging than original)",
  "summary": "Comprehensive, detailed summary with deep analysis and strategic insights (300-500 words, covering key implications, market impact, and industry context)",
  "category": "One of: product-launch, financial, regulatory, market-trends, technology, safety, partnerships, other",
  "sentiment": "One of: positive, negative, neutral",
  "tags": ["3-5 relevant keywords or phrases"],
  "importance": "Number from 1-5 (1=low, 5=critical industry impact)",
  "keyInsights": ["2-3 key insights from the article"],
  "industryImpact": "Brief assessment of impact on automotive industry",
  "stakeholders": ["Who this affects: consumers, manufacturers, suppliers, regulators, etc."]
}

Focus on:
- Automotive industry relevance
- Market implications
- Technology trends
- Regulatory impact
- Consumer benefits
- Competitive landscape

Respond with valid JSON only.`;
  }
  
  validateAIResponse(aiResult) {
    const requiredFields = ['title', 'summary', 'category', 'sentiment', 'tags', 'importance'];
    const validCategories = ['product-launch', 'financial', 'regulatory', 'market-trends', 'technology', 'safety', 'partnerships', 'other'];
    const validSentiments = ['positive', 'negative', 'neutral'];
    
    // Validate required fields
    for (const field of requiredFields) {
      if (!aiResult[field]) {
        console.warn(`⚠️ Missing required field: ${field}`);
        aiResult[field] = this.getDefaultValue(field);
      }
    }
    
    // Validate category
    if (!validCategories.includes(aiResult.category)) {
      console.warn(`⚠️ Invalid category: ${aiResult.category}, using default`);
      aiResult.category = 'other';
    }
    
    // Validate sentiment
    if (!validSentiments.includes(aiResult.sentiment)) {
      console.warn(`⚠️ Invalid sentiment: ${aiResult.sentiment}, using default`);
      aiResult.sentiment = 'neutral';
    }
    
    // Validate importance (1-5)
    if (typeof aiResult.importance !== 'number' || aiResult.importance < 1 || aiResult.importance > 5) {
      console.warn(`⚠️ Invalid importance: ${aiResult.importance}, using default`);
      aiResult.importance = 3;
    }
    
    // Ensure tags is an array
    if (!Array.isArray(aiResult.tags)) {
      aiResult.tags = [];
    }
    
    // Limit tags to 5
    aiResult.tags = aiResult.tags.slice(0, 5);
    
    // Truncate title if too long
    if (aiResult.title && aiResult.title.length > 100) {
      aiResult.title = aiResult.title.substring(0, 97) + '...';
    }
    
    // Truncate summary if too long
    if (aiResult.summary && aiResult.summary.length > 500) {
      aiResult.summary = aiResult.summary.substring(0, 497) + '...';
    }
    
    return aiResult;
  }
  
  getDefaultValue(field) {
    const defaults = {
      title: 'Automotive News Article',
      summary: 'No summary available',
      category: 'other',
      sentiment: 'neutral',
      tags: ['automotive'],
      importance: 3
    };
    
    return defaults[field] || '';
  }
  
  createFallbackResponse(article) {
    console.log(`🔄 Creating fallback response for article: ${article.title}`);
    
    return {
      title: article.title,
      summary: article.summary || 'No summary available',
      category: 'other',
      sentiment: 'neutral',
      tags: ['automotive'],
      importance: 3,
      keyInsights: ['Article processed without AI enhancement'],
      industryImpact: 'Impact assessment not available',
      stakeholders: ['General automotive industry']
    };
  }
  
  async processBatch(articles) {
    try {
      console.log(`🤖 Processing batch of ${articles.length} articles with AI`);
      
      const results = [];
      
      for (const article of articles) {
        try {
          const result = await this.processArticle(article);
          results.push({
            articleId: article._id,
            success: true,
            result
          });
        } catch (error) {
          console.error(`❌ Error processing article ${article._id}:`, error.message);
          results.push({
            articleId: article._id,
            success: false,
            error: error.message
          });
        }
      }
      
      console.log(`✅ Batch processing completed: ${results.filter(r => r.success).length}/${results.length} successful`);
      return results;
      
    } catch (error) {
      console.error('❌ Batch processing failed:', error.message);
      throw error;
    }
  }
  
  async getArticleInsights(article) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return null;
      }
      
      const prompt = `Provide additional insights for this automotive article:

TITLE: ${article.title}
SUMMARY: ${article.summary}
CATEGORY: ${article.category}
SENTIMENT: ${article.sentiment}

Provide insights in JSON format:
{
  "marketTrends": ["Relevant market trends"],
  "competitiveAnalysis": "How this affects competitors",
  "consumerImpact": "Impact on consumers",
  "regulatoryImplications": "Regulatory considerations",
  "futureOutlook": "Future implications"
}`;
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert automotive industry analyst providing additional insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      
      return JSON.parse(response.choices[0].message.content);
      
    } catch (error) {
      console.error(`❌ Error getting insights for article ${article._id}:`, error.message);
      return null;
    }
  }
  
  async healthCheck() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          status: 'disabled',
          message: 'OpenAI API key not configured'
        };
      }
      
      // Test API with a simple request
      await this.openai.models.list();
      
      return {
        status: 'healthy',
        message: 'OpenAI API is accessible',
        model: this.model,
        maxTokens: this.maxTokens,
        temperature: this.temperature
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `OpenAI API error: ${error.message}`
      };
    }
  }
}

module.exports = AIProcessor;