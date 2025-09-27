"""
Real-time notification system for new articles.
"""
import json
from datetime import datetime
from typing import Dict, Any, List
import structlog
from backend.database import get_database
from backend.models import ArticleResponse, WebSocketMessage
from workers.celery_app import celery_app

logger = structlog.get_logger(__name__)

# In-memory store for WebSocket connections
# In production, use Redis for distributed WebSocket management
websocket_connections: List[Dict[str, Any]] = []


@celery_app.task
def broadcast_new_article(ai_article_id: str):
    """Broadcast new article to all connected WebSocket clients."""
    try:
        logger.info("Broadcasting new article", ai_article_id=ai_article_id)
        
        # Run async task
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_broadcast_new_article_async(ai_article_id))
        loop.close()
        
        return result
        
    except Exception as e:
        logger.error("Error broadcasting article", ai_article_id=ai_article_id, error=str(e))
        return {"success": False, "error": str(e)}


async def _broadcast_new_article_async(ai_article_id: str) -> Dict[str, Any]:
    """Async broadcast logic."""
    db = await get_database()
    
    # Get the AI article
    ai_article = await db.ai_articles.find_one({"_id": ObjectId(ai_article_id)})
    
    if not ai_article:
        logger.error("AI article not found for broadcast", ai_article_id=ai_article_id)
        return {"success": False, "error": "Article not found"}
    
    # Get raw article for URL
    raw_article = await db.raw_articles.find_one({"_id": ai_article['raw_article_id']})
    url = raw_article['url'] if raw_article else ""
    
    # Create article response
    article_response = ArticleResponse(
        id=str(ai_article['_id']),
        ai_title=ai_article['ai_title'],
        title_original=ai_article['title_original'],
        publisher=ai_article['publisher'],
        published_at=ai_article['published_at'],
        industry=ai_article['industry'],
        category=ai_article['category'],
        short_summary=ai_article['short_summary'],
        long_summary=ai_article['long_summary'],
        sentiment_label=ai_article['sentiment_label'],
        sentiment_score=ai_article['sentiment_score'],
        entities=ai_article['entities'],
        tags=ai_article['tags'],
        url=url,
        created_at=ai_article['created_at']
    )
    
    # Create WebSocket message
    message = WebSocketMessage(
        type="new_article",
        data=article_response.dict()
    )
    
    # Broadcast to all connected clients
    message_json = json.dumps(message.dict(), default=str)
    
    # In production, use Redis pub/sub or WebSocket manager
    # For now, we'll store the message for the WebSocket handler to pick up
    await _store_notification(message_json)
    
    logger.info("Article broadcasted", 
               ai_article_id=ai_article_id,
               connections=len(websocket_connections))
    
    return {"success": True, "connections": len(websocket_connections)}


async def _store_notification(message: str):
    """Store notification for WebSocket clients."""
    # In production, use Redis pub/sub
    # For now, we'll use a simple in-memory store
    pass


def get_websocket_connections() -> List[Dict[str, Any]]:
    """Get list of active WebSocket connections."""
    return websocket_connections


def add_websocket_connection(connection: Dict[str, Any]):
    """Add a new WebSocket connection."""
    websocket_connections.append(connection)
    logger.info("WebSocket connection added", total=len(websocket_connections))


def remove_websocket_connection(connection_id: str):
    """Remove a WebSocket connection."""
    global websocket_connections
    websocket_connections = [conn for conn in websocket_connections if conn.get('id') != connection_id]
    logger.info("WebSocket connection removed", total=len(websocket_connections))


@celery_app.task
def send_bulk_notification(article_ids: List[str]):
    """Send bulk notification for multiple articles."""
    try:
        logger.info("Sending bulk notification", count=len(article_ids))
        
        # Run async task
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_send_bulk_notification_async(article_ids))
        loop.close()
        
        return result
        
    except Exception as e:
        logger.error("Error sending bulk notification", error=str(e))
        return {"success": False, "error": str(e)}


async def _send_bulk_notification_async(article_ids: List[str]) -> Dict[str, Any]:
    """Async bulk notification logic."""
    db = await get_database()
    
    # Get all articles
    articles = await db.ai_articles.find({
        "_id": {"$in": [ObjectId(aid) for aid in article_ids]}
    }).to_list(length=None)
    
    if not articles:
        return {"success": False, "error": "No articles found"}
    
    # Create bulk message
    message = WebSocketMessage(
        type="bulk_articles",
        data={"articles": [str(aid) for aid in article_ids], "count": len(articles)}
    )
    
    message_json = json.dumps(message.dict(), default=str)
    await _store_notification(message_json)
    
    logger.info("Bulk notification sent", count=len(articles))
    
    return {"success": True, "count": len(articles)}


# Import ObjectId here to avoid circular imports
from bson import ObjectId
