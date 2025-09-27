# 🚗 Production Automotive News Aggregation Application

A production-ready automotive news aggregation platform with real-time updates, AI processing, and comprehensive filtering capabilities.

## 🎯 Features

### Core Functionality
- **Real-time News Aggregation**: Fetches automotive news from Google News RSS feed
- **AI-Powered Analysis**: OpenAI GPT-3.5-turbo integration for article enhancement
- **Live Updates**: WebSocket-based real-time article updates
- **Advanced Filtering**: Multi-dimensional filtering by category, sentiment, brand, etc.
- **Responsive Dashboard**: Modern, mobile-friendly interface
- **Bookmark System**: Save and organize favorite articles
- **Search Functionality**: Full-text search across all articles

### Technical Features
- **MongoDB Atlas Integration**: Cloud database with connection pooling
- **RSS Processing**: Automated RSS feed parsing and content extraction
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: API protection with configurable rate limits
- **Caching**: Intelligent caching for improved performance
- **Security**: Helmet.js security headers and CORS protection

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (MongoDB)     │
│   Port: 1001    │    │   Port: 1000    │    │   (Atlas)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │   WebSocket     │
         └──────────────►│   (Socket.IO)   │
                        │   Real-time     │
                        └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- OpenAI API key

### 1. Environment Setup
Create a `.env` file in the root directory:

```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://nikhilbollineni30_db_user:UFpGMGVv53gi3qpi@cluster0-azure.2bfte3e.mongodb.net/automotive-news?retryWrites=true&w=majority&appName=Clustero-Azure

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here

# Server Configuration
PORT=1000
NODE_ENV=development
CLIENT_URL=http://localhost:1001
NEXT_PUBLIC_API_URL=http://localhost:1000/api

# RSS Configuration
RSS_URL=https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=automotive
POLL_INTERVAL_SECONDS=120

# OpenAI Configuration
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.3
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install
```

### 3. Seed Database
```bash
# Seed the Google News RSS feed
node server/scripts/seedGoogleNewsFeed.js
```

### 4. Start Application
```bash
# Start both backend and frontend
node start-production.js
```

Or start individually:
```bash
# Backend only
node server/production-server.js

# Frontend only (in another terminal)
cd client && npm run dev
```

## 📡 API Endpoints

### Articles
- `GET /api/articles` - Get all articles with pagination and filtering
- `GET /api/articles/stats` - Get article statistics
- `GET /api/articles/:id` - Get single article
- `GET /api/articles/category/:category` - Get articles by category
- `GET /api/articles/trending/now` - Get trending articles
- `GET /api/articles/search/:query` - Search articles

### News Ingestion
- `POST /api/admin/refresh-news` - Manual news refresh
- `GET /api/admin/status` - Get ingestion status
- `POST /api/admin/test-feed` - Test RSS feed
- `POST /api/admin/add-feed` - Add new RSS feed
- `PUT /api/admin/feed/:id` - Update RSS feed
- `DELETE /api/admin/feed/:id` - Delete RSS feed

### System
- `GET /api/health` - Health check
- `GET /api/feeds` - Get all RSS feeds

## 🔧 Configuration

### RSS Polling
- **Interval**: 120 seconds (configurable)
- **Source**: Google News automotive RSS feed
- **Processing**: AI enhancement for all new articles

### AI Processing
- **Model**: GPT-3.5-turbo
- **Features**: Title enhancement, summary generation, categorization, sentiment analysis
- **Fallback**: Graceful degradation if AI processing fails

### Database
- **Connection**: MongoDB Atlas with connection pooling
- **Indexes**: Optimized for queries by industry, category, and date
- **Collections**: Articles, RSSFeeds

## 🎨 Frontend Features

### Dashboard
- **Industry Selection**: Switch between different industries
- **Real-time Updates**: Live article updates via WebSocket
- **Advanced Filtering**: Multi-dimensional filtering system
- **Search**: Full-text search with instant results
- **Bookmarks**: Save and organize favorite articles

### Navigation
- **Dashboard**: Main news feed
- **AI Analysis**: Coming soon - advanced AI insights
- **Bookmarks**: Saved articles
- **Category Views**: Product launches, regulatory, market trends, etc.

### Responsive Design
- **Mobile-first**: Optimized for all screen sizes
- **Modern UI**: Clean, professional interface
- **Accessibility**: WCAG compliant design

## 🔒 Security

### Backend Security
- **Helmet.js**: Security headers
- **CORS**: Configured for specific origins
- **Rate Limiting**: 100 requests per minute per IP
- **Input Validation**: Comprehensive request validation

### Data Protection
- **Environment Variables**: Sensitive data in environment
- **Connection Security**: MongoDB Atlas with SSL
- **API Keys**: Secure OpenAI API key management

## 📊 Monitoring

### Health Checks
- **Database**: Connection status and responsiveness
- **API**: Endpoint availability
- **WebSocket**: Real-time connection status
- **Services**: RSS scraper and AI processor health

### Logging
- **Structured Logging**: Winston-based logging system
- **Error Tracking**: Comprehensive error logging
- **Performance**: Request timing and response metrics

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Set all required environment variables
2. **Database**: Ensure MongoDB Atlas cluster is accessible
3. **API Keys**: Configure OpenAI API key
4. **Rate Limiting**: Adjust rate limits for production traffic
5. **Monitoring**: Set up application monitoring

### Scaling
- **Horizontal Scaling**: Multiple server instances
- **Database**: MongoDB Atlas auto-scaling
- **Caching**: Redis for improved performance
- **CDN**: Static asset delivery

## 🧪 Testing

### Manual Testing
1. **Health Check**: `GET http://localhost:1000/api/health`
2. **Articles**: `GET http://localhost:1000/api/articles`
3. **Refresh**: `POST http://localhost:1000/api/admin/refresh-news`
4. **WebSocket**: Connect to `ws://localhost:1000`

### Automated Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MongoDB connection
curl http://localhost:1000/api/health
```

#### RSS Feed Issues
```bash
# Test RSS feed
curl -X POST http://localhost:1000/api/admin/test-feed \
  -H "Content-Type: application/json" \
  -d '{"url": "https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=automotive"}'
```

#### AI Processing
- Check OpenAI API key configuration
- Verify API key has sufficient credits
- Check rate limits and quotas

### Logs
- **Server Logs**: Check console output for errors
- **Database Logs**: MongoDB Atlas logs
- **Client Logs**: Browser developer console

## 📈 Performance

### Optimization
- **Database Indexes**: Optimized for common queries
- **Connection Pooling**: Efficient database connections
- **Caching**: Intelligent caching strategies
- **Compression**: Gzip compression for responses

### Metrics
- **Response Time**: < 200ms for most endpoints
- **Throughput**: 100+ requests per minute
- **Uptime**: 99.9% availability target

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### Code Standards
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **TypeScript**: Type safety for frontend
- **JSDoc**: Documentation for functions

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs
3. Check API health endpoints
4. Verify environment configuration

---

**Built with ❤️ for the automotive industry**
