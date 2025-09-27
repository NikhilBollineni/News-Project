# News Ingestion Pipeline

A production-ready news ingestion pipeline that fetches, processes, and classifies news articles from RSS feeds using AI. Built with Node.js, MongoDB, and OpenAI GPT.

## Features

- **RSS Feed Ingestion**: Fetches articles from Google News RSS and other reliable sources
- **Content Extraction**: Robust article content extraction with fallback to snippets
- **AI Classification**: GPT-powered industry and category classification
- **Deduplication**: Advanced duplicate detection using URL canonicalization and content fingerprinting
- **Cost Optimization**: Budget controls and cost tracking for GPT usage
- **Real-time Monitoring**: Health checks, metrics, and alerting
- **Scalable Architecture**: Background job processing with scheduling
- **Web Dashboard**: React-based monitoring and management interface

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RSS Feeds     │───▶│   News Fetcher  │───▶│  Deduplication  │
│ (Google News,   │    │                 │    │    Service      │
│  Motor1, etc.)  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Dashboard │    │   Content       │    │   Metadata      │
│                 │◀───│   Extractor     │◀───│   Enricher      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Monitoring    │    │   GPT           │    │   MongoDB       │
│   Service       │◀───│   Processor     │◀───│   Database      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd news-ingestion-pipeline
npm install
cd client && npm install && cd ..
```

2. **Environment setup:**
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/news-ingestion
TEST_MONGODB_URI=mongodb://localhost:27017/news-ingestion-test

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
GPT_MODEL=gpt-3.5-turbo

# Cost Controls
DAILY_BUDGET=50.0
MONTHLY_BUDGET=1000.0
GPT_BATCH_SIZE=5

# Performance
MAX_CONCURRENT_FETCHES=3
MAX_CONCURRENT_CONTENT_EXTRACTION=5
REQUEST_TIMEOUT=10000

# Scheduling (Cron format)
FULL_PIPELINE_SCHEDULE=0 */6 * * *
QUICK_INGESTION_SCHEDULE=*/15 * * * *
GPT_PROCESSING_SCHEDULE=0 */2 * * *
```

3. **Database setup:**
```bash
npm run migrate
```

4. **Start the application:**
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

5. **Access the dashboard:**
- Frontend: http://localhost:3001/news-ingestion
- API: http://localhost:5000/api/news-ingestion

## API Endpoints

### Articles
- `GET /api/news-ingestion/articles` - List articles with filtering
- `GET /api/news-ingestion/articles/:id` - Get single article
- `GET /api/news-ingestion/articles/:id/full` - Get full article content

### Sources
- `GET /api/news-ingestion/sources` - List news sources
- `POST /api/news-ingestion/sources` - Create new source (admin)

### Processing
- `POST /api/news-ingestion/ingest/run` - Trigger manual ingestion
- `POST /api/news-ingestion/gpt/process` - Trigger GPT processing

### Monitoring
- `GET /api/news-ingestion/stats` - Get system statistics
- `GET /api/news-ingestion/health` - Health check
- `GET /api/news-ingestion/logs` - Get ingestion logs

### Cost Management
- `GET /api/news-ingestion/cost-stats` - Get cost statistics
- `POST /api/news-ingestion/cost-settings` - Update cost settings
- `POST /api/news-ingestion/cost-reset` - Reset cost tracking

## Configuration

### News Sources

Sources are configured in `server/config/sources.json`:

```json
{
  "sources": [
    {
      "id": "google_news_automotive",
      "name": "Google News - Automotive",
      "type": "RSS_SEARCH",
      "url": "https://news.google.com/rss/search?q=automotive&hl=en-US&gl=US&ceid=US:en",
      "country": "US",
      "language": "en",
      "tags": ["automotive", "news"],
      "isActive": true,
      "priority": 1,
      "refreshInterval": 900
    }
  ]
}
```

### Cost Controls

Set daily and monthly budgets to control GPT costs:

```env
DAILY_BUDGET=50.0      # Daily spending limit in USD
MONTHLY_BUDGET=1000.0  # Monthly spending limit in USD
```

### Scheduling

Configure job schedules using cron format:

```env
FULL_PIPELINE_SCHEDULE=0 */6 * * *     # Every 6 hours
QUICK_INGESTION_SCHEDULE=*/15 * * * *  # Every 15 minutes
GPT_PROCESSING_SCHEDULE=0 */2 * * *    # Every 2 hours
```

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- Unit tests for individual services
- Integration tests for database operations
- End-to-end pipeline tests
- Error handling tests

## Monitoring

### Health Checks
The system provides comprehensive health monitoring:

- **Database Health**: Connection and query performance
- **Ingestion Health**: Feed processing status and success rates
- **Source Health**: Individual source status and error rates
- **Processing Health**: GPT processing rates and failures
- **Resource Health**: Memory and CPU usage

### Metrics Dashboard
Access the web dashboard at `/news-ingestion` to view:

- Real-time processing statistics
- Cost tracking and budget status
- Source health and performance
- Article classification results
- System alerts and recommendations

### Alerts
The system generates alerts for:

- Budget threshold breaches
- Source failures
- Processing errors
- Resource constraints
- Scheduler issues

## Cost Optimization

### Features
- **Budget Controls**: Daily and monthly spending limits
- **Batch Processing**: Optimized GPT API usage
- **Content Filtering**: Skip low-quality or paywalled content
- **Caching**: Reduce redundant processing
- **Rate Limiting**: Prevent API overuse

### Recommendations
The system provides cost optimization recommendations:

- Reduce processing frequency when budget is high
- Use cheaper models for certain content types
- Optimize prompts to reduce token usage
- Monitor monthly spending trends

## Production Deployment

### Environment Variables
Ensure all required environment variables are set:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
DAILY_BUDGET=100.0
MONTHLY_BUDGET=2000.0
```

### Scaling Considerations
- Use MongoDB Atlas for database scaling
- Implement Redis for caching in production
- Use PM2 for process management
- Set up proper logging and monitoring
- Configure reverse proxy (nginx)

### Security
- Secure API endpoints with authentication
- Validate all input data
- Use HTTPS in production
- Implement rate limiting
- Regular security updates

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check MongoDB URI and credentials
   - Ensure MongoDB is running
   - Verify network connectivity

2. **OpenAI API Errors**
   - Verify API key is valid
   - Check rate limits and quotas
   - Monitor token usage

3. **Feed Fetching Issues**
   - Check source URLs are accessible
   - Verify RSS feed format
   - Monitor source health in dashboard

4. **High Costs**
   - Review cost optimization settings
   - Adjust batch sizes
   - Implement content filtering

### Logs
Check logs for detailed error information:

```bash
# Application logs
tail -f logs/combined.log

# Error logs
tail -f logs/error.log
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the test suite for examples
- Create an issue with detailed logs
