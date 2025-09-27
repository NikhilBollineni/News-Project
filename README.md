# News Ingestion Pipeline

A production-ready, highly-scalable news ingestion pipeline and API that uses Google News RSS feeds as the source for automotive industry news. The system processes articles through AI enrichment and provides real-time updates via WebSocket connections.

## 🚀 Features

- **RSS Polling**: Automated polling of Google News RSS feeds every 2 minutes
- **AI Enrichment**: OpenAI-powered article analysis with sentiment, categorization, and summarization
- **Real-time Updates**: WebSocket-based live updates without page refresh
- **Scalable Architecture**: Horizontal scaling support with Celery workers and Redis
- **Production Ready**: Comprehensive testing, monitoring, and deployment configuration
- **Modern UI**: React frontend with Tailwind CSS and real-time notifications

## 🏗️ Architecture

### Backend Stack
- **FastAPI**: High-performance async API framework
- **MongoDB**: Document database with connection pooling
- **Redis**: Caching and message broker
- **Celery**: Distributed task queue for background processing
- **OpenAI**: AI-powered article enrichment
- **WebSocket**: Real-time communication

### Frontend Stack
- **React**: Modern UI framework with TypeScript
- **Tailwind CSS**: Utility-first CSS framework
- **Socket.IO**: Real-time WebSocket communication
- **Axios**: HTTP client for API communication

## 📊 Database Schema

### Collections

1. **sources**: RSS feed configurations
2. **raw_articles**: Raw scraped article data
3. **ai_articles**: AI-enriched article data
4. **app_config**: Application configuration

### Key Relationships
- `ai_articles.raw_article_id` → `raw_articles._id`
- `raw_articles.source_id` → `sources._id`

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 7.0+
- Redis 7.0+
- OpenAI API key

### Local Development

1. **Clone and setup**:
```bash
git clone <repository-url>
cd news-ingestion-pipeline
```

2. **Install dependencies**:
```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

3. **Configure environment**:
```bash
cp env.example .env
# Edit .env with your OpenAI API key and other settings
```

4. **Start services**:
```bash
# Start MongoDB and Redis
docker-compose up mongodb redis -d

# Start backend
python -m uvicorn backend.main:app --reload

# Start Celery worker (in another terminal)
celery -A workers.celery_app worker --loglevel=info

# Start Celery beat (in another terminal)
celery -A workers.celery_app beat --loglevel=info

# Start frontend (in another terminal)
cd frontend
npm start
```

### Docker Deployment

1. **Build and start all services**:
```bash
docker-compose up --build
```

2. **Access the application**:
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Flower (Celery monitoring): http://localhost:5555

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (required) | - |
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `RSS_URL` | Google News RSS URL | Google News automotive feed |
| `POLL_INTERVAL_SECONDS` | RSS polling interval | `120` |
| `API_PORT` | API server port | `8000` |

### RSS Source Configuration

The system uses only the Google News RSS feed:
```
https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=automotive
```

## 📈 Scaling

### Horizontal Scaling

1. **API Servers**: Scale FastAPI instances behind a load balancer
2. **Workers**: Scale Celery workers across multiple machines
3. **Database**: Use MongoDB replica sets for read scaling
4. **Cache**: Use Redis Cluster for distributed caching

### Kubernetes Deployment

```yaml
# Example Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: news-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: news-api
  template:
    metadata:
      labels:
        app: news-api
    spec:
      containers:
      - name: api
        image: news-ingestion:latest
        ports:
        - containerPort: 8000
        env:
        - name: MONGODB_URL
          value: "mongodb://mongodb:27017/news_app_autos_v1"
        - name: REDIS_URL
          value: "redis://redis:6379/0"
```

## 🧪 Testing

### Run Tests

```bash
# Backend tests
pytest tests/ -v

# Frontend tests
cd frontend
npm test

# Integration tests
pytest tests/test_integration.py -v
```

### Test Coverage

```bash
# Generate coverage report
pytest --cov=backend --cov=utils --cov=workers tests/
```

## 📊 Monitoring

### Health Checks

- **API Health**: `GET /health`
- **Database**: MongoDB connection status
- **Redis**: Redis connection status
- **Celery**: Worker status and queue length

### Metrics

- Ingestion rate (articles per hour)
- AI processing latency
- Error rates by component
- WebSocket connection count

### Logging

Structured JSON logging with:
- Request/response tracking
- Error correlation IDs
- Performance metrics
- Security events

## 🔒 Security

### API Security
- Rate limiting (100 requests/minute)
- CORS configuration
- Input validation with Pydantic
- SQL injection prevention (NoSQL)

### Data Security
- Environment variable encryption
- Secure database connections
- API key protection
- HTTPS enforcement in production

## 🚀 Production Deployment

### Docker Compose (Recommended)

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. **Database Setup**:
```bash
# Create MongoDB database and indexes
python scripts/setup_database.py
```

2. **Start Services**:
```bash
# Start API server
gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Start Celery worker
celery -A workers.celery_app worker --loglevel=info --concurrency=4

# Start Celery beat
celery -A workers.celery_app beat --loglevel=info
```

### Environment-Specific Configuration

#### Development
```bash
LOG_LEVEL=DEBUG
API_WORKERS=1
POLL_INTERVAL_SECONDS=60
```

#### Production
```bash
LOG_LEVEL=INFO
API_WORKERS=4
POLL_INTERVAL_SECONDS=120
```

## 📚 API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API information |
| `GET` | `/health` | Health check |
| `GET` | `/articles` | Get articles with filtering |
| `GET` | `/articles/{id}` | Get specific article |
| `GET` | `/categories` | Get available categories |
| `GET` | `/stats` | Get system statistics |
| `POST` | `/admin/ingest/force` | Force RSS ingestion |
| `POST` | `/admin/reprocess/{id}` | Reprocess article |
| `WebSocket` | `/ws/articles` | Real-time updates |

### WebSocket Events

- `new_article`: New article published
- `bulk_articles`: Multiple articles updated
- `connection`: Connection established
- `pong`: Ping/pong for connection health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test cases for usage examples

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete RSS ingestion pipeline
- AI-powered article enrichment
- Real-time WebSocket updates
- Production-ready deployment configuration
- Comprehensive test suite