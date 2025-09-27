# Automotive News Platform - Database Architecture

## 🗄️ **Database Overview**
- **Database Type**: MongoDB Atlas (Cloud)
- **Database Name**: `automotive-news-platform`
- **Connection**: MongoDB Atlas Free Tier (M0 Sandbox)

## 📊 **Collections Structure**

### 1. **automotive_articles** (Main Articles Collection)
```javascript
{
  _id: ObjectId,
  originalTitle: String,
  originalUrl: String,
  originalContent: String,
  originalSummary: String,
  publisher: {
    name: String,
    website: String,
    rssFeed: String,
    credibility: Number (1-10),
    automotiveFocus: Number (1-10),
    specialties: [String],
    region: String,
    language: String
  },
  publishedAt: Date,
  scrapedAt: Date,
  processedByAI: Boolean,
  
  // AI-Enhanced Content
  aiTitle: String,
  aiSummary: String,
  aiCategory: String, // product-launches, ev-technology, manufacturing, etc.
  aiTags: [String],
  aiSentiment: String, // positive, negative, neutral
  aiImportance: Number (1-5),
  
  // Automotive-Specific Metadata
  automotive: {
    vehicleType: String, // sedan, suv, truck, motorcycle, etc.
    brand: String, // Tesla, BMW, Toyota, etc.
    market: String, // luxury, mass-market, commercial
    technology: [String], // EV, autonomous, hybrid, etc.
    region: String, // north-america, europe, asia, etc.
    priceRange: String, // budget, mid-range, luxury
    launchDate: Date,
    salesTarget: Number
  },
  
  // Copyright & Legal
  copyright: {
    holder: String,
    attribution: String,
    fairUse: Boolean,
    disclaimer: String
  },
  
  processedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **automotive_publishers** (Publisher Management)
```javascript
{
  _id: ObjectId,
  name: String,
  website: String,
  rssFeed: String,
  region: String,
  language: String,
  credibility: Number (1-10),
  automotiveFocus: Number (1-10),
  specialties: [String],
  isActive: Boolean,
  lastChecked: Date,
  stats: {
    totalArticles: Number,
    errorCount: Number,
    lastError: String,
    successRate: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **automotive_feeds** (RSS Feed Management)
```javascript
{
  _id: ObjectId,
  name: String,
  website: String,
  rssFeed: String,
  region: String,
  language: String,
  credibility: Number (1-10),
  automotiveFocus: Number (1-10),
  specialties: [String],
  isActive: Boolean,
  lastChecked: Date,
  stats: {
    totalArticles: Number,
    errorCount: Number,
    lastError: String,
    successRate: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **users** (User Management)
```javascript
{
  _id: ObjectId,
  email: String,
  name: String,
  password: String (hashed),
  selectedIndustries: [String],
  preferences: {
    categories: [String],
    updateFrequency: String,
    notifications: Boolean,
    language: String,
    region: String
  },
  subscription: {
    plan: String, // free, premium
    status: String, // active, inactive
    expiresAt: Date
  },
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

### 5. **system_stats** (Platform Analytics)
```javascript
{
  _id: ObjectId,
  date: Date,
  metrics: {
    totalArticles: Number,
    articlesProcessed: Number,
    feedsActive: Number,
    feedsFailed: Number,
    aiProcessingTime: Number,
    userSessions: Number,
    apiRequests: Number
  },
  createdAt: Date
}
```

## 🔍 **Indexes Strategy**

### **automotive_articles**
- `{ publishedAt: -1 }` - Latest articles first
- `{ aiCategory: 1, publishedAt: -1 }` - Category filtering
- `{ "automotive.brand": 1, publishedAt: -1 }` - Brand filtering
- `{ "automotive.technology": 1, publishedAt: -1 }` - Technology filtering
- `{ originalUrl: 1 }` - Unique constraint
- `{ "publisher.name": 1, publishedAt: -1 }` - Publisher filtering

### **automotive_publishers**
- `{ name: 1 }` - Unique constraint
- `{ isActive: 1, lastChecked: -1 }` - Active feeds
- `{ region: 1, isActive: 1 }` - Regional filtering

### **users**
- `{ email: 1 }` - Unique constraint
- `{ createdAt: -1 }` - User registration tracking

## 🚀 **Performance Optimization**

### **Connection Pooling**
- Max pool size: 10
- Min pool size: 2
- Max idle time: 30000ms

### **Query Optimization**
- Use projection to limit fields
- Implement pagination with skip/limit
- Use aggregation pipelines for complex queries
- Implement caching for frequently accessed data

### **Data Retention**
- Keep articles for 90 days (configurable)
- Archive old articles to separate collection
- Clean up failed feed attempts after 24 hours

## 🔒 **Security & Compliance**

### **Data Protection**
- Encrypt sensitive user data
- Implement proper access controls
- Regular backup strategy
- GDPR compliance for EU users

### **Rate Limiting**
- API rate limiting per user
- Feed scraping rate limiting
- AI processing rate limiting

## 📈 **Monitoring & Analytics**

### **Health Checks**
- Database connection monitoring
- Query performance tracking
- Error rate monitoring
- Resource usage tracking

### **Business Metrics**
- Article processing success rate
- User engagement metrics
- Feed reliability metrics
- AI processing accuracy
