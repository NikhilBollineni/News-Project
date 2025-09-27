"""
FastAPI application for news ingestion pipeline.
"""
from fastapi import FastAPI, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncio
import json
from typing import List, Optional, Dict, Any
from datetime import datetime
import structlog
from backend.config import settings
from backend.database import get_database, setup_database, close_mongo_connection
from backend.models import (
    ArticleResponse, PaginatedResponse, WebSocketMessage,
    CategoryEnum, SentimentEnum
)
from workers.celery_app import celery_app
from workers.notifications import get_websocket_connections, add_websocket_connection, remove_websocket_connection

logger = structlog.get_logger(__name__)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove dead connections
                self.active_connections.remove(connection)

manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting news ingestion API")
    await setup_database()
    
    # Start Celery beat scheduler
    celery_app.control.enable_events()
    
    yield
    
    # Shutdown
    logger.info("Shutting down news ingestion API")
    await close_mongo_connection()


# Create FastAPI app
app = FastAPI(
    title="News Ingestion API",
    description="Production-ready news ingestion pipeline for automotive industry",
    version="1.0.0",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "News Ingestion API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        db = await get_database()
        
        # Check database connection
        await db.command("ping")
        
        # Check Celery workers
        celery_stats = celery_app.control.stats()
        
        return {
            "status": "healthy",
            "database": "connected",
            "celery_workers": len(celery_stats),
            "websocket_connections": len(manager.active_connections),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")


@app.get("/articles", response_model=PaginatedResponse)
async def get_articles(
    industry: str = Query("automotive", description="Industry filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    sentiment: Optional[str] = Query(None, description="Sentiment filter"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    search: Optional[str] = Query(None, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    sort: str = Query("latest", description="Sort order: latest, oldest, sentiment")
):
    """Get articles with filtering and pagination."""
    try:
        db = await get_database()
        
        # Build query
        query = {"industry": industry}
        
        if category:
            query["category"] = category
        
        if sentiment:
            query["sentiment_label"] = sentiment
        
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            query["tags"] = {"$in": tag_list}
        
        if search:
            query["$or"] = [
                {"ai_title": {"$regex": search, "$options": "i"}},
                {"short_summary": {"$regex": search, "$options": "i"}},
                {"long_summary": {"$regex": search, "$options": "i"}}
            ]
        
        # Build sort
        sort_field = "created_at"
        sort_direction = -1
        
        if sort == "oldest":
            sort_direction = 1
        elif sort == "sentiment":
            sort_field = "sentiment_score"
            sort_direction = -1
        
        # Get total count
        total = await db.ai_articles.count_documents(query)
        
        # Calculate pagination
        skip = (page - 1) * per_page
        pages = (total + per_page - 1) // per_page
        
        # Get articles
        cursor = db.ai_articles.find(query).sort(sort_field, sort_direction).skip(skip).limit(per_page)
        articles = await cursor.to_list(length=per_page)
        
        # Get URLs from raw articles
        article_responses = []
        for article in articles:
            raw_article = await db.raw_articles.find_one({"_id": article["raw_article_id"]})
            url = raw_article["url"] if raw_article else ""
            
            article_response = ArticleResponse(
                id=str(article["_id"]),
                ai_title=article["ai_title"],
                title_original=article["title_original"],
                publisher=article["publisher"],
                published_at=article["published_at"],
                industry=article["industry"],
                category=article["category"],
                short_summary=article["short_summary"],
                long_summary=article["long_summary"],
                sentiment_label=article["sentiment_label"],
                sentiment_score=article["sentiment_score"],
                entities=article["entities"],
                tags=article["tags"],
                url=url,
                created_at=article["created_at"]
            )
            article_responses.append(article_response)
        
        return PaginatedResponse(
            items=article_responses,
            total=total,
            page=page,
            per_page=per_page,
            pages=pages
        )
        
    except Exception as e:
        logger.error("Error fetching articles", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/articles/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: str):
    """Get a specific article by ID."""
    try:
        from bson import ObjectId
        
        db = await get_database()
        
        article = await db.ai_articles.find_one({"_id": ObjectId(article_id)})
        
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        # Get URL from raw article
        raw_article = await db.raw_articles.find_one({"_id": article["raw_article_id"]})
        url = raw_article["url"] if raw_article else ""
        
        return ArticleResponse(
            id=str(article["_id"]),
            ai_title=article["ai_title"],
            title_original=article["title_original"],
            publisher=article["publisher"],
            published_at=article["published_at"],
            industry=article["industry"],
            category=article["category"],
            short_summary=article["short_summary"],
            long_summary=article["long_summary"],
            sentiment_label=article["sentiment_label"],
            sentiment_score=article["sentiment_score"],
            entities=article["entities"],
            tags=article["tags"],
            url=url,
            created_at=article["created_at"]
        )
        
    except Exception as e:
        logger.error("Error fetching article", article_id=article_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/categories")
async def get_categories():
    """Get available categories."""
    try:
        db = await get_database()
        
        config = await db.app_config.find_one({"config_name": "categories"})
        
        if not config:
            # Return default categories
            return {
                "categories": [
                    {"key": "product_launch", "display": "Product Launch"},
                    {"key": "regulation", "display": "Regulation"},
                    {"key": "corporate_financial", "display": "Corporate / Financial"},
                    {"key": "technology", "display": "Technology"},
                    {"key": "recall", "display": "Recall & Safety"},
                    {"key": "market_sales", "display": "Market & Sales"},
                    {"key": "opinion", "display": "Opinion / Analysis"}
                ]
            }
        
        return {"categories": config["payload"]}
        
    except Exception as e:
        logger.error("Error fetching categories", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/stats")
async def get_stats():
    """Get system statistics."""
    try:
        db = await get_database()
        
        # Article counts by category
        category_stats = await db.ai_articles.aggregate([
            {"$group": {"_id": "$category", "count": {"$sum": 1}}}
        ]).to_list(length=None)
        
        # Sentiment distribution
        sentiment_stats = await db.ai_articles.aggregate([
            {"$group": {"_id": "$sentiment_label", "count": {"$sum": 1}}}
        ]).to_list(length=None)
        
        # Recent articles (last 24 hours)
        from datetime import timedelta
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_count = await db.ai_articles.count_documents({
            "created_at": {"$gte": yesterday}
        })
        
        # Total articles
        total_articles = await db.ai_articles.count_documents({})
        
        return {
            "total_articles": total_articles,
            "recent_articles": recent_count,
            "category_distribution": {item["_id"]: item["count"] for item in category_stats},
            "sentiment_distribution": {item["_id"]: item["count"] for item in sentiment_stats},
            "websocket_connections": len(manager.active_connections),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Error fetching stats", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/admin/ingest/force")
async def force_ingest():
    """Force RSS ingestion (admin endpoint)."""
    try:
        # Trigger RSS polling task
        task = celery_app.send_task('workers.rss_poller.poll_rss_feeds')
        
        return {
            "message": "RSS ingestion triggered",
            "task_id": task.id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Error triggering ingestion", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/admin/reprocess/{raw_article_id}")
async def reprocess_article(raw_article_id: str):
    """Reprocess a specific raw article (admin endpoint)."""
    try:
        from workers.ai_processor import reprocess_article
        
        # Trigger reprocessing task
        task = reprocess_article.delay(raw_article_id)
        
        return {
            "message": "Article reprocessing triggered",
            "raw_article_id": raw_article_id,
            "task_id": task.id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Error reprocessing article", raw_article_id=raw_article_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@app.websocket("/ws/articles")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await manager.connect(websocket)
    
    try:
        # Send initial connection message
        welcome_message = WebSocketMessage(
            type="connection",
            data={"message": "Connected to news feed", "timestamp": datetime.utcnow().isoformat()}
        )
        await websocket.send_text(json.dumps(welcome_message.dict(), default=str))
        
        # Keep connection alive
        while True:
            try:
                # Wait for client messages (ping/pong)
                data = await websocket.receive_text()
                
                # Echo back for ping/pong
                pong_message = WebSocketMessage(
                    type="pong",
                    data={"timestamp": datetime.utcnow().isoformat()}
                )
                await websocket.send_text(json.dumps(pong_message.dict(), default=str))
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error("WebSocket error", error=str(e))
                break
                
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)
        logger.info("WebSocket connection closed")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.api_host,
        port=settings.api_port,
        workers=settings.api_workers,
        reload=True
    )
