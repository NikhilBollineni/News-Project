const express = require('express');
const Article = require('../models/Article');
const cacheService = require('../services/cacheService');
const { cacheMiddleware, articleCacheKey, statsCacheKey, trendingCacheKey, invalidateCache } = require('../middleware/cacheMiddleware');

const router = express.Router();

// Helper function to get filter options
async function getFilterOptions(query) {
  try {
    // Get unique values for each filter field
    const [categories, brands, technologies, sentiments, regions, sources] = await Promise.all([
      Article.distinct('category', query),
      Article.distinct('brand', query),
      Article.distinct('technology', query),
      Article.distinct('sentiment', query),
      Article.distinct('region', query),
      Article.distinct('source.name', query)
    ]);

    return {
      categories: categories.filter(Boolean).sort(),
      brands: brands.filter(Boolean).sort(),
      technologies: technologies.filter(Boolean).sort(),
      sentiments: sentiments.filter(Boolean).sort(),
      regions: regions.filter(Boolean).sort(),
      sources: sources.filter(Boolean).sort()
    };
  } catch (error) {
    console.error('Error getting filter options:', error);
    return {
      categories: [],
      brands: [],
      technologies: [],
      sentiments: [],
      regions: [],
      sources: []
    };
  }
}

// Production mode - mock data removed

// Test endpoint removed for production

// Get articles
router.get('/', async (req, res) => {
  try {
    // Production mode - always use database
    console.log('Fetching articles from database');

    const { 
      industry, 
      category, 
      page = 1, 
      limit = 50, 
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      // Advanced filtering parameters
      brand,
      technology,
      sentiment,
      region,
      source,
      dateFrom,
      dateTo,
      importance,
      search
    } = req.query;

    // Build query - include both processed and unprocessed articles for now
    const query = {};
    
    if (industry) {
      query.industry = industry;
    }

    if (category) {
      query.category = category;
    }

    // Advanced filtering
    if (brand) {
      query.brand = Array.isArray(brand) ? { $in: brand } : brand;
    }
    
    if (technology) {
      query.technology = Array.isArray(technology) ? { $in: technology } : technology;
    }
    
    if (sentiment) {
      query.sentiment = Array.isArray(sentiment) ? { $in: sentiment } : sentiment;
    }
    
    if (region) {
      query.region = Array.isArray(region) ? { $in: region } : region;
    }
    
    if (source) {
      query['source.name'] = Array.isArray(source) ? { $in: source } : source;
    }
    
    if (dateFrom || dateTo) {
      query.publishedAt = {};
      if (dateFrom) {
        query.publishedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.publishedAt.$lte = new Date(dateTo);
      }
    }
    
    if (importance) {
      query.importance = { $gte: parseInt(importance) };
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const articles = await Article.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content'); // Exclude full content for performance

    const total = await Article.countDocuments(query);

    // Get filter options for the current query
    const filterOptions = await getFilterOptions(query);

    res.json({
      articles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      filters: filterOptions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get articles statistics
router.get('/stats', cacheMiddleware(1800, statsCacheKey), async (req, res) => {
  try {
    const { industry } = req.query;
    const query = industry ? { industry } : {};
    
    const totalArticles = await Article.countDocuments(query);
    
    const articlesByCategory = await Article.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const articlesByIndustry = await Article.aggregate([
      { $match: query },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const recentArticles = await Article.find(query)
      .sort({ publishedAt: -1 })
      .limit(5)
      .select('title publishedAt source');
    
    res.json({
      totalArticles,
      articlesByCategory: articlesByCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      articlesByIndustry: articlesByIndustry.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentArticles,
      lastFetchTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single article
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment view count
    article.engagement.views += 1;
    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get articles by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 50, industry } = req.query;

    const query = { category };
    if (industry) {
      query.industry = industry;
    }

    const articles = await Article.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content');

    const total = await Article.countDocuments(query);

    res.json({
      articles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trending articles (most viewed in last 24 hours)
router.get('/trending/now', async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { industry } = req.query;
    
    const query = { publishedAt: { $gte: oneDayAgo } };
    if (industry) {
      query.industry = industry;
    }
    
    const articles = await Article.find(query)
    .sort({ 'engagement.views': -1, publishedAt: -1 })
    .limit(10)
    .select('-content');

    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search articles
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 50, industry } = req.query;

    const searchQuery = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { summary: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    };
    
    if (industry) {
      searchQuery.industry = industry;
    }

    const articles = await Article.find(searchQuery)
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content');

    const total = await Article.countDocuments(searchQuery);

    res.json({
      articles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
