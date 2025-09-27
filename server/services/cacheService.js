const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour default TTL
  }

  async connect() {
    // Completely disable Redis for now
    logger.warn('⚠️ Redis disabled - running without caching');
    this.isConnected = false;
    this.redis = null;
    return false;
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      logger.info('🔌 Redis disconnected');
    }
  }

  // Generic cache methods
  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`❌ Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) return false;
    
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      logger.error(`❌ Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error(`❌ Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`❌ Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // Article-specific caching
  async getArticles(industry, page = 1, limit = 10) {
    const key = `articles:${industry}:page:${page}:limit:${limit}`;
    return await this.get(key);
  }

  async setArticles(industry, articles, page = 1, limit = 10, ttl = 1800) {
    const key = `articles:${industry}:page:${page}:limit:${limit}`;
    return await this.set(key, articles, ttl);
  }

  async getArticleById(id) {
    const key = `article:${id}`;
    return await this.get(key);
  }

  async setArticle(article, ttl = 3600) {
    const key = `article:${article._id}`;
    return await this.set(key, article, ttl);
  }

  async invalidateArticle(id) {
    const key = `article:${id}`;
    return await this.del(key);
  }

  // User-specific caching
  async getUserArticles(userId, industry, page = 1, limit = 10) {
    const key = `user:${userId}:articles:${industry}:page:${page}:limit:${limit}`;
    return await this.get(key);
  }

  async setUserArticles(userId, industry, articles, page = 1, limit = 10, ttl = 900) {
    const key = `user:${userId}:articles:${industry}:page:${page}:limit:${limit}`;
    return await this.set(key, articles, ttl);
  }

  async invalidateUserCache(userId) {
    const pattern = `user:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Statistics caching
  async getStats(industry) {
    const key = `stats:${industry}`;
    return await this.get(key);
  }

  async setStats(industry, stats, ttl = 1800) {
    const key = `stats:${industry}`;
    return await this.set(key, stats, ttl);
  }

  // Trending articles caching
  async getTrendingArticles(industry, timeframe = '24h') {
    const key = `trending:${industry}:${timeframe}`;
    return await this.get(key);
  }

  async setTrendingArticles(industry, articles, timeframe = '24h', ttl = 3600) {
    const key = `trending:${industry}:${timeframe}`;
    return await this.set(key, articles, ttl);
  }

  // Search results caching
  async getSearchResults(query, industry, page = 1, limit = 10) {
    const key = `search:${industry}:${Buffer.from(query).toString('base64')}:page:${page}:limit:${limit}`;
    return await this.get(key);
  }

  async setSearchResults(query, industry, results, page = 1, limit = 10, ttl = 1800) {
    const key = `search:${industry}:${Buffer.from(query).toString('base64')}:page:${page}:limit:${limit}`;
    return await this.set(key, results, ttl);
  }

  // Category-based caching
  async getArticlesByCategory(industry, category, page = 1, limit = 10) {
    const key = `articles:${industry}:category:${category}:page:${page}:limit:${limit}`;
    return await this.get(key);
  }

  async setArticlesByCategory(industry, category, articles, page = 1, limit = 10, ttl = 1800) {
    const key = `articles:${industry}:category:${category}:page:${page}:limit:${limit}`;
    return await this.set(key, articles, ttl);
  }

  // Cache invalidation patterns
  async invalidateIndustryCache(industry) {
    const patterns = [
      `articles:${industry}:*`,
      `stats:${industry}`,
      `trending:${industry}:*`,
      `search:${industry}:*`
    ];

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info(`🗑️ Invalidated ${keys.length} cache keys for pattern: ${pattern}`);
      }
    }
  }

  async invalidateAllCache() {
    try {
      await this.redis.flushdb();
      logger.info('🗑️ All cache invalidated');
    } catch (error) {
      logger.error('❌ Error invalidating all cache:', error);
    }
  }

  // Cache warming
  async warmCache(industry) {
    try {
      logger.info(`🔥 Warming cache for industry: ${industry}`);
      
      // Pre-load common queries
      const commonQueries = [
        { page: 1, limit: 10 },
        { page: 1, limit: 20 },
        { page: 1, limit: 50 }
      ];

      // This would be called with actual data from the database
      // For now, we'll just log the warming process
      logger.info(`🔥 Cache warming initiated for ${industry}`);
      
    } catch (error) {
      logger.error('❌ Cache warming error:', error);
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) return { status: 'disconnected', error: 'Redis not connected' };
      
      const pong = await this.redis.ping();
      const info = await this.redis.info('memory');
      
      return {
        status: 'connected',
        ping: pong,
        memory: info,
        isConnected: this.isConnected
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // Cache statistics
  async getCacheStats() {
    try {
      const info = await this.redis.info();
      const keyspace = await this.redis.info('keyspace');
      
      return {
        connected: this.isConnected,
        info: info,
        keyspace: keyspace
      };
    } catch (error) {
      logger.error('❌ Error getting cache stats:', error);
      return { connected: false, error: error.message };
    }
  }
}

module.exports = new CacheService();
