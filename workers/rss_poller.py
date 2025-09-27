"""
RSS polling worker for fetching and processing news feeds.
"""
import asyncio
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import structlog
from motor.motor_asyncio import AsyncIOMotorClient
from backend.config import settings
from backend.database import get_database
from backend.models import Source, RawArticle
from utils.scraper import ArticleScraper, generate_feed_item_id, normalize_url
from workers.celery_app import celery_app
from workers.ai_processor import process_article_with_ai

logger = structlog.get_logger(__name__)


@celery_app.task(bind=True, max_retries=3)
def poll_rss_feeds(self):
    """Poll RSS feeds and process new articles."""
    try:
        logger.info("Starting RSS polling task")
        
        # Run async task
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_poll_rss_feeds_async())
        loop.close()
        
        logger.info("RSS polling task completed", articles_processed=result.get('processed', 0))
        return result
        
    except Exception as e:
        logger.error("RSS polling task failed", error=str(e))
        raise self.retry(exc=e, countdown=60)


async def _poll_rss_feeds_async() -> Dict[str, Any]:
    """Async RSS polling logic."""
    db = await get_database()
    
    # Get active sources
    sources = await db.sources.find({"source_type": "google_rss"}).to_list(length=None)
    
    if not sources:
        logger.warning("No RSS sources found")
        return {"processed": 0, "errors": 0}
    
    total_processed = 0
    total_errors = 0
    
    for source in sources:
        try:
            logger.info("Polling RSS source", source_name=source['name'])
            
            # Fetch and parse RSS feed
            articles = await _fetch_rss_feed(source['url'])
            
            if not articles:
                logger.warning("No articles found in RSS feed", source=source['name'])
                continue
            
            # Process each article
            processed_count = await _process_articles(articles, source, db)
            total_processed += processed_count
            
            # Update source last_polled timestamp
            await db.sources.update_one(
                {"_id": source['_id']},
                {"$set": {"last_polled": datetime.utcnow()}}
            )
            
            logger.info("Completed processing source", 
                       source=source['name'], 
                       articles=processed_count)
            
        except Exception as e:
            logger.error("Error processing RSS source", 
                        source=source.get('name', 'unknown'), 
                        error=str(e))
            total_errors += 1
    
    return {
        "processed": total_processed,
        "errors": total_errors,
        "timestamp": datetime.utcnow().isoformat()
    }


async def _fetch_rss_feed(url: str) -> List[Dict[str, Any]]:
    """Fetch and parse RSS feed."""
    import aiohttp
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, timeout=30) as response:
                if response.status != 200:
                    logger.error("Failed to fetch RSS feed", url=url, status=response.status)
                    return []
                
                content = await response.text()
                return _parse_rss_content(content)
                
        except Exception as e:
            logger.error("Error fetching RSS feed", url=url, error=str(e))
            return []


def _parse_rss_content(content: str) -> List[Dict[str, Any]]:
    """Parse RSS XML content."""
    try:
        root = ET.fromstring(content)
        
        # Handle different RSS namespaces
        items = []
        
        # Try different item selectors
        for item in root.findall('.//item'):
            try:
                title = _get_text(item, 'title')
                link = _get_text(item, 'link')
                description = _get_text(item, 'description')
                pub_date = _get_text(item, 'pubDate')
                
                if not title or not link:
                    continue
                
                # Parse publication date
                published_at = _parse_pub_date(pub_date) if pub_date else datetime.utcnow()
                
                # Extract publisher from description or link
                publisher = _extract_publisher(description, link)
                
                items.append({
                    'title': title,
                    'link': link,
                    'description': description or '',
                    'pub_date': pub_date or '',
                    'published_at': published_at,
                    'publisher': publisher
                })
                
            except Exception as e:
                logger.warning("Error parsing RSS item", error=str(e))
                continue
        
        logger.info("Parsed RSS feed", items_count=len(items))
        return items
        
    except Exception as e:
        logger.error("Error parsing RSS content", error=str(e))
        return []


def _get_text(element, tag_name: str) -> Optional[str]:
    """Get text content from XML element."""
    try:
        elem = element.find(tag_name)
        return elem.text.strip() if elem is not None and elem.text else None
    except:
        return None


def _parse_pub_date(pub_date: str) -> datetime:
    """Parse publication date from various formats."""
    from dateutil import parser
    
    try:
        return parser.parse(pub_date)
    except:
        return datetime.utcnow()


def _extract_publisher(description: str, link: str) -> str:
    """Extract publisher name from description or link."""
    if not description and not link:
        return "Unknown"
    
    # Try to extract from description
    if description:
        # Look for common publisher patterns
        import re
        patterns = [
            r'via\s+([A-Za-z\s]+)',
            r'from\s+([A-Za-z\s]+)',
            r'by\s+([A-Za-z\s]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                return match.group(1).strip()
    
    # Try to extract from domain
    if link:
        from urllib.parse import urlparse
        domain = urlparse(link).netloc
        if domain:
            # Remove www. and common TLDs
            domain = domain.replace('www.', '')
            domain = domain.split('.')[0]
            return domain.title()
    
    return "Unknown"


async def _process_articles(articles: List[Dict[str, Any]], source: Dict[str, Any], db) -> int:
    """Process articles from RSS feed."""
    processed_count = 0
    
    for article_data in articles:
        try:
            # Generate unique ID for this feed item
            feed_item_id = generate_feed_item_id(article_data['link'], article_data['pub_date'])
            
            # Check if article already exists
            existing = await db.raw_articles.find_one({"feed_item_id": feed_item_id})
            
            if existing:
                # Update last_seen timestamp
                await db.raw_articles.update_one(
                    {"_id": existing['_id']},
                    {"$set": {"last_seen": datetime.utcnow()}}
                )
                continue
            
            # Normalize URL
            normalized_url = normalize_url(article_data['link'])
            
            # Create raw article record
            raw_article = {
                "source_id": source['_id'],
                "feed_item_id": feed_item_id,
                "url": normalized_url,
                "raw_xml_item": str(article_data),  # Store as string for now
                "created_at": datetime.utcnow(),
                "last_seen": datetime.utcnow(),
                "fetch_status": "fetched"
            }
            
            # Insert raw article
            result = await db.raw_articles.insert_one(raw_article)
            raw_article_id = result.inserted_id
            
            logger.info("Created raw article record", 
                       raw_article_id=str(raw_article_id),
                       url=normalized_url)
            
            # Queue AI processing task
            process_article_with_ai.delay(
                raw_article_id=str(raw_article_id),
                title=article_data['title'],
                url=normalized_url,
                publisher=article_data['publisher'],
                published_at=article_data['published_at'].isoformat()
            )
            
            processed_count += 1
            
        except Exception as e:
            logger.error("Error processing article", 
                        title=article_data.get('title', 'unknown'),
                        error=str(e))
            continue
    
    return processed_count


@celery_app.task(bind=True, max_retries=3)
def scrape_article_content(self, raw_article_id: str):
    """Scrape content for a raw article."""
    try:
        logger.info("Starting article scraping", raw_article_id=raw_article_id)
        
        # Run async task
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_scrape_article_content_async(raw_article_id))
        loop.close()
        
        logger.info("Article scraping completed", raw_article_id=raw_article_id)
        return result
        
    except Exception as e:
        logger.error("Article scraping failed", raw_article_id=raw_article_id, error=str(e))
        raise self.retry(exc=e, countdown=60)


async def _scrape_article_content_async(raw_article_id: str) -> Dict[str, Any]:
    """Async article scraping logic."""
    from bson import ObjectId
    
    db = await get_database()
    
    # Get raw article
    raw_article = await db.raw_articles.find_one({"_id": ObjectId(raw_article_id)})
    
    if not raw_article:
        logger.error("Raw article not found", raw_article_id=raw_article_id)
        return {"success": False, "error": "Article not found"}
    
    try:
        # Scrape article content
        async with ArticleScraper() as scraper:
            raw_html, scraped_text, success = await scraper.fetch_article(raw_article['url'])
        
        # Update raw article with scraped content
        update_data = {
            "raw_html": raw_html,
            "scraped_text": scraped_text,
            "scraped_at": datetime.utcnow(),
            "fetch_status": "fetched" if success else "failed"
        }
        
        if not success:
            update_data["fetch_error"] = "Failed to extract content"
        
        await db.raw_articles.update_one(
            {"_id": ObjectId(raw_article_id)},
            {"$set": update_data}
        )
        
        if success and scraped_text:
            # Queue AI processing
            process_article_with_ai.delay(
                raw_article_id=raw_article_id,
                title=raw_article.get('title', ''),
                url=raw_article['url'],
                publisher=raw_article.get('publisher', 'Unknown'),
                published_at=raw_article.get('published_at', datetime.utcnow()).isoformat()
            )
        
        return {"success": success, "scraped": bool(scraped_text)}
        
    except Exception as e:
        logger.error("Error scraping article", raw_article_id=raw_article_id, error=str(e))
        
        # Update with error status
        await db.raw_articles.update_one(
            {"_id": ObjectId(raw_article_id)},
            {"$set": {
                "fetch_status": "failed",
                "fetch_error": str(e)
            }}
        )
        
        return {"success": False, "error": str(e)}
