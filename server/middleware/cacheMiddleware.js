const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

// Cache middleware for GET requests
const cacheMiddleware = (ttl = 1800, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Check if cache service is available
      if (!cacheService.isConnected) {
        logger.debug('📦 Cache not available, skipping cache middleware');
        return next();
      }

      // Generate cache key
      const cacheKey = keyGenerator ? keyGenerator(req) : generateDefaultKey(req);
      
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.info(`📦 Cache hit for key: ${cacheKey}`);
        return res.json({
          ...cachedData,
          _cached: true,
          _cacheTimestamp: new Date().toISOString()
        });
      }

      // Cache miss - store original send method
      const originalSend = res.json;
      
      // Override res.json to cache the response
      res.json = function(data) {
        // Cache the response (non-blocking)
        if (cacheService.isConnected) {
          cacheService.set(cacheKey, data, ttl).catch(error => {
            logger.debug('⚠️ Cache set failed (non-critical):', error.message);
          });
          logger.debug(`📦 Storing in cache: ${cacheKey}`);
        }
        
        // Call original send method
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.debug('⚠️ Cache middleware error (non-critical):', error.message);
      next();
    }
  };
};

// Generate default cache key based on request
const generateDefaultKey = (req) => {
  const { path, query, user } = req;
  const userId = user?.id || 'anonymous';
  const queryString = Object.keys(query).length > 0 ? 
    `?${new URLSearchParams(query).toString()}` : '';
  
  return `${path}${queryString}:user:${userId}`;
};

// Article-specific cache key generators
const articleCacheKey = (req) => {
  const { industry, page, limit, category, search } = req.query;
  const userId = req.user?.id || 'anonymous';
  
  if (search) {
    return `search:${industry}:${Buffer.from(search).toString('base64')}:page:${page || 1}:limit:${limit || 10}:user:${userId}`;
  }
  
  if (category) {
    return `articles:${industry}:category:${category}:page:${page || 1}:limit:${limit || 10}:user:${userId}`;
  }
  
  return `articles:${industry}:page:${page || 1}:limit:${limit || 10}:user:${userId}`;
};

const statsCacheKey = (req) => {
  const { industry } = req.query;
  return `stats:${industry}`;
};

const trendingCacheKey = (req) => {
  const { industry, timeframe } = req.query;
  return `trending:${industry}:${timeframe || '24h'}`;
};

// Cache invalidation middleware
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    try {
      if (pattern === 'user') {
        await cacheService.invalidateUserCache(req.user.id);
      } else if (pattern === 'industry') {
        await cacheService.invalidateIndustryCache(req.query.industry);
      } else if (pattern === 'all') {
        await cacheService.invalidateAllCache();
      }
      
      logger.info(`🗑️ Cache invalidated for pattern: ${pattern}`);
      next();
    } catch (error) {
      logger.error('❌ Cache invalidation error:', error);
      next();
    }
  };
};

// Cache warming middleware
const warmCache = async (req, res, next) => {
  try {
    const { industry } = req.query;
    if (industry) {
      await cacheService.warmCache(industry);
    }
    next();
  } catch (error) {
    logger.error('❌ Cache warming error:', error);
    next();
  }
};

module.exports = {
  cacheMiddleware,
  articleCacheKey,
  statsCacheKey,
  trendingCacheKey,
  invalidateCache,
  warmCache
};
