const OpenAI = require('openai');
const AutomotiveArticle = require('../models/AutomotiveArticle');

class AutomotiveAIProcessor {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async processAutomotiveArticle(article) {
    try {
      console.log(`Processing automotive article with AI: ${article.originalTitle}`);
      
      const prompt = `You are an expert automotive industry analyst. Analyze this automotive news article and provide comprehensive insights.

Article Title: ${article.originalTitle}
Article Content: ${article.originalContent ? article.originalContent.substring(0, 3000) : article.originalSummary}

IMPORTANT: Respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or additional text.

Required JSON structure:
{
  "title": "Create an engaging, automotive industry-focused title (max 80 characters)",
  "summary": "Create a clear, informative summary highlighting key automotive industry insights (max 150 words)",
  "category": "Classify into one of these automotive categories: product-launches, ev-technology, manufacturing, m-and-a, financials, regulatory, market-trends, competitor-moves, supply-chain",
  "tags": ["Extract 3-5 relevant automotive tags (brands, technologies, markets)"],
  "sentiment": "Analyze sentiment for automotive industry impact: positive, negative, or neutral",
  "importance": "Rate importance 1-5 for automotive industry professionals (5 being most critical)",
  "automotive": {
    "vehicleType": "Identify vehicle type: sedan, suv, truck, motorcycle, commercial, luxury, sports, hatchback, coupe, convertible",
    "brand": "Identify automotive brand: Tesla, Ford, GM, Toyota, Honda, BMW, Mercedes-Benz, Audi, Volkswagen, Nissan, Hyundai, Kia, Subaru, Mazda, Lexus, Infiniti, Acura, Cadillac, Lincoln, Buick, Chevrolet, GMC, Ram, Jeep, Dodge, Chrysler, Porsche, Ferrari, Lamborghini, Bentley, Rolls-Royce, Aston Martin, McLaren, Jaguar, Land Rover, Volvo, Genesis, Rivian, Lucid, Polestar, Fisker, BYD, NIO, XPeng, Li Auto, Unknown",
    "market": "Identify market segment: luxury, mass-market, commercial, performance, economy",
    "technology": ["Identify technologies: EV, hybrid, autonomous, ICE, hydrogen, plug-in-hybrid, mild-hybrid"],
    "region": "Identify region: north-america, europe, asia, china, india, south-america, global",
    "priceRange": "Identify price range: budget, mid-range, luxury, ultra-luxury"
  }
}

Focus on automotive industry relevance, brand recognition, technology trends, and market impact.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert automotive industry analyst specializing in news categorization, brand recognition, and technology trends. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      let aiResponse;
      const responseContent = response.choices[0].message.content;
      
      // Clean up the response to ensure it's valid JSON
      let cleanedContent = responseContent.trim();
      
      // Remove markdown code blocks if present
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any trailing text after the JSON
      const jsonEndIndex = cleanedContent.lastIndexOf('}');
      if (jsonEndIndex !== -1) {
        cleanedContent = cleanedContent.substring(0, jsonEndIndex + 1);
      }
      
      try {
        aiResponse = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('JSON parse error, trying to fix:', parseError.message);
        console.error('Raw response:', responseContent);
        
        // Fallback: try to extract JSON from the response
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            aiResponse = JSON.parse(jsonMatch[0]);
          } catch (fallbackError) {
            throw new Error(`Failed to parse AI response as JSON: ${fallbackError.message}`);
          }
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      }
      
      // Update article with AI processing results
      article.aiTitle = aiResponse.title;
      article.aiSummary = aiResponse.summary;
      article.aiCategory = aiResponse.category;
      article.aiTags = aiResponse.tags;
      article.aiSentiment = aiResponse.sentiment;
      article.aiImportance = aiResponse.importance;
      article.automotive = aiResponse.automotive;
      article.processedByAI = true;
      article.processedAt = new Date();

      console.log(`Successfully processed automotive article: ${article.aiTitle}`);
      
      return article;
    } catch (error) {
      console.error(`Error processing automotive article with AI: ${error.message}`);
      
      // Fallback: mark as processed with basic categorization
      article.processedByAI = true;
      article.processedAt = new Date();
      article.aiCategory = 'market-trends';
      article.automotive = {
        vehicleType: 'sedan',
        brand: 'Unknown',
        market: 'mass-market',
        technology: ['ICE'],
        region: 'global',
        priceRange: 'mid-range'
      };
      return article;
    }
  }

  async processUnprocessedAutomotiveArticles() {
    try {
      console.log('Processing unprocessed automotive articles with AI...');
      
      const unprocessedArticles = await AutomotiveArticle.find({
        processedByAI: false
      }).limit(5); // Process 5 at a time to avoid rate limits

      for (const article of unprocessedArticles) {
        try {
          await this.processAutomotiveArticle(article);
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error processing automotive article ${article._id}:`, error.message);
        }
      }

      console.log(`Processed ${unprocessedArticles.length} automotive articles`);
    } catch (error) {
      console.error('Error in batch processing automotive articles:', error.message);
    }
  }

  async analyzeAutomotiveContent(content, title) {
    try {
      const prompt = `
Analyze this automotive content for industry relevance and key insights:

Title: ${title}
Content: ${content.substring(0, 1500)}

Respond with JSON:
{
  "automotiveRelevance": "Rate 1-10 how relevant this is to automotive industry",
  "keyBrands": ["List automotive brands mentioned"],
  "keyTechnologies": ["List automotive technologies mentioned"],
  "marketImpact": "Assess market impact: high, medium, low",
  "trendSignificance": "Assess trend significance: major, moderate, minor"
}
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an automotive industry expert. Analyze content for automotive relevance and provide structured insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing automotive content:', error.message);
      return {
        automotiveRelevance: 5,
        keyBrands: [],
        keyTechnologies: [],
        marketImpact: 'medium',
        trendSignificance: 'moderate'
      };
    }
  }

  async categorizeAutomotiveContent(content, title) {
    try {
      const prompt = `
Categorize this automotive content into the most appropriate category:

Title: ${title}
Content: ${content.substring(0, 1000)}

Categories: product-launches, ev-technology, manufacturing, m-and-a, financials, regulatory, market-trends, competitor-moves, supply-chain

Respond with only the category name.
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert at categorizing automotive industry news. Respond with only the category name."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      });

      return response.choices[0].message.content.trim().toLowerCase();
    } catch (error) {
      console.error('Error categorizing automotive content:', error.message);
      return 'market-trends';
    }
  }
}

module.exports = new AutomotiveAIProcessor();
