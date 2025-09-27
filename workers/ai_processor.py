"""
AI processing worker for enriching articles with OpenAI.
"""
import asyncio
from datetime import datetime
from typing import Dict, Any
from bson import ObjectId
import structlog
from backend.database import get_database
from backend.models import AIArticle, Entity, EntityTypeEnum
from utils.ai_processor import process_article_with_ai
from workers.celery_app import celery_app

logger = structlog.get_logger(__name__)


@celery_app.task(bind=True, max_retries=3)
def process_article_with_ai(self, raw_article_id: str, title: str, url: str, 
                           publisher: str, published_at: str):
    """Process article with AI enrichment."""
    try:
        logger.info("Starting AI processing", raw_article_id=raw_article_id)
        
        # Run async task
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_process_article_with_ai_async(
            raw_article_id, title, url, publisher, published_at
        ))
        loop.close()
        
        logger.info("AI processing completed", raw_article_id=raw_article_id)
        return result
        
    except Exception as e:
        logger.error("AI processing failed", raw_article_id=raw_article_id, error=str(e))
        raise self.retry(exc=e, countdown=120)


async def _process_article_with_ai_async(raw_article_id: str, title: str, url: str, 
                                        publisher: str, published_at: str) -> Dict[str, Any]:
    """Async AI processing logic."""
    db = await get_database()
    
    # Check if AI article already exists
    existing_ai_article = await db.ai_articles.find_one({
        "raw_article_id": ObjectId(raw_article_id)
    })
    
    if existing_ai_article:
        logger.info("AI article already exists", raw_article_id=raw_article_id)
        return {"success": True, "existing": True}
    
    # Get raw article to get scraped text
    raw_article = await db.raw_articles.find_one({"_id": ObjectId(raw_article_id)})
    
    if not raw_article:
        logger.error("Raw article not found", raw_article_id=raw_article_id)
        return {"success": False, "error": "Raw article not found"}
    
    if not raw_article.get('scraped_text'):
        logger.warning("No scraped text available", raw_article_id=raw_article_id)
        return {"success": False, "error": "No scraped text available"}
    
    try:
        # Process with AI
        ai_data = await process_article_with_ai(
            title=title,
            text=raw_article['scraped_text'],
            url=url,
            publisher=publisher
        )
        
        # Parse published date
        try:
            if isinstance(published_at, str):
                from dateutil import parser
                parsed_published_at = parser.parse(published_at)
            else:
                parsed_published_at = published_at
        except:
            parsed_published_at = datetime.utcnow()
        
        # Create AI article record
        ai_article_data = {
            "raw_article_id": ObjectId(raw_article_id),
            "ai_title": ai_data['ai_title'],
            "title_original": title,
            "publisher": publisher,
            "published_at": parsed_published_at,
            "industry": ai_data['industry'],
            "category": ai_data['category'],
            "short_summary": ai_data['short_summary'],
            "long_summary": ai_data['long_summary'],
            "sentiment_label": ai_data['sentiment_label'],
            "sentiment_score": ai_data['sentiment_score'],
            "entities": ai_data['entities'],
            "tags": ai_data['tags'],
            "ai_raw_response": ai_data['ai_raw_response'],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert AI article
        result = await db.ai_articles.insert_one(ai_article_data)
        ai_article_id = result.inserted_id
        
        logger.info("Created AI article", 
                   ai_article_id=str(ai_article_id),
                   category=ai_data['category'],
                   sentiment=ai_data['sentiment_label'])
        
        # Send real-time notification
        send_article_notification.delay(str(ai_article_id))
        
        return {
            "success": True,
            "ai_article_id": str(ai_article_id),
            "category": ai_data['category'],
            "sentiment": ai_data['sentiment_label']
        }
        
    except Exception as e:
        logger.error("Error in AI processing", raw_article_id=raw_article_id, error=str(e))
        return {"success": False, "error": str(e)}


@celery_app.task
def send_article_notification(ai_article_id: str):
    """Send real-time notification for new AI article."""
    try:
        logger.info("Sending article notification", ai_article_id=ai_article_id)
        
        # This will be handled by the WebSocket service
        from workers.notifications import broadcast_new_article
        broadcast_new_article(ai_article_id)
        
        return {"success": True}
        
    except Exception as e:
        logger.error("Error sending notification", ai_article_id=ai_article_id, error=str(e))
        return {"success": False, "error": str(e)}


@celery_app.task
def reprocess_article(raw_article_id: str):
    """Reprocess an existing raw article with AI."""
    try:
        logger.info("Reprocessing article", raw_article_id=raw_article_id)
        
        # Run async task
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_reprocess_article_async(raw_article_id))
        loop.close()
        
        logger.info("Article reprocessing completed", raw_article_id=raw_article_id)
        return result
        
    except Exception as e:
        logger.error("Article reprocessing failed", raw_article_id=raw_article_id, error=str(e))
        return {"success": False, "error": str(e)}


async def _reprocess_article_async(raw_article_id: str) -> Dict[str, Any]:
    """Async article reprocessing logic."""
    db = await get_database()
    
    # Get raw article
    raw_article = await db.raw_articles.find_one({"_id": ObjectId(raw_article_id)})
    
    if not raw_article:
        return {"success": False, "error": "Raw article not found"}
    
    # Delete existing AI article if it exists
    await db.ai_articles.delete_many({"raw_article_id": ObjectId(raw_article_id)})
    
    # Extract article metadata from raw data
    # This is a simplified version - in production, you'd parse the raw_xml_item
    title = "Reprocessed Article"  # Extract from raw_xml_item
    publisher = "Unknown"
    published_at = raw_article.get('created_at', datetime.utcnow())
    
    # Process with AI
    try:
        ai_data = await process_article_with_ai(
            title=title,
            text=raw_article.get('scraped_text', ''),
            url=raw_article['url'],
            publisher=publisher
        )
        
        # Create new AI article
        ai_article_data = {
            "raw_article_id": ObjectId(raw_article_id),
            "ai_title": ai_data['ai_title'],
            "title_original": title,
            "publisher": publisher,
            "published_at": published_at,
            "industry": ai_data['industry'],
            "category": ai_data['category'],
            "short_summary": ai_data['short_summary'],
            "long_summary": ai_data['long_summary'],
            "sentiment_label": ai_data['sentiment_label'],
            "sentiment_score": ai_data['sentiment_score'],
            "entities": ai_data['entities'],
            "tags": ai_data['tags'],
            "ai_raw_response": ai_data['ai_raw_response'],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.ai_articles.insert_one(ai_article_data)
        
        return {
            "success": True,
            "ai_article_id": str(result.inserted_id)
        }
        
    except Exception as e:
        logger.error("Error reprocessing article", raw_article_id=raw_article_id, error=str(e))
        return {"success": False, "error": str(e)}
