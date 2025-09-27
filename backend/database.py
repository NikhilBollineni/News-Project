"""
Database connection and setup for MongoDB.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from backend.config import settings
import asyncio
from typing import Optional


class Database:
    """Database connection manager."""
    
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None


async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance."""
    if Database.database is None:
        await connect_to_mongo()
    return Database.database


async def connect_to_mongo():
    """Create database connection."""
    Database.client = AsyncIOMotorClient(
        settings.mongodb_url,
        maxPoolSize=50,
        minPoolSize=10,
        maxIdleTimeMS=30000,
        serverSelectionTimeoutMS=5000,
        socketTimeoutMS=20000,
        connectTimeoutMS=20000,
        retryWrites=True,
        retryReads=True
    )
    Database.database = Database.client[settings.database_name]
    
    # Create indexes
    await create_indexes()


async def close_mongo_connection():
    """Close database connection."""
    if Database.client:
        Database.client.close()


async def create_indexes():
    """Create database indexes for optimal query performance."""
    db = Database.database
    
    # Raw articles indexes
    await db.raw_articles.create_index("feed_item_id", unique=True)
    await db.raw_articles.create_index("source_id")
    await db.raw_articles.create_index("created_at")
    await db.raw_articles.create_index("fetch_status")
    
    # AI articles indexes
    await db.ai_articles.create_index("raw_article_id", unique=True)
    await db.ai_articles.create_index("industry")
    await db.ai_articles.create_index("category")
    await db.ai_articles.create_index("published_at")
    await db.ai_articles.create_index("created_at")
    await db.ai_articles.create_index("sentiment_label")
    await db.ai_articles.create_index("tags")
    await db.ai_articles.create_index([("industry", 1), ("category", 1), ("published_at", -1)])
    
    # Sources indexes
    await db.sources.create_index("name", unique=True)
    await db.sources.create_index("industry")
    
    # App config indexes
    await db.app_config.create_index("config_name", unique=True)


async def setup_database():
    """Initialize database with default data."""
    db = await get_database()
    
    # Insert default source
    source_collection = db.sources
    existing_source = await source_collection.find_one({"name": "google_news_automotive_search"})
    
    if not existing_source:
        default_source = {
            "name": "google_news_automotive_search",
            "industry": "automotive",
            "source_type": "google_rss",
            "url": settings.rss_url,
            "config": {"poll_interval_seconds": settings.poll_interval_seconds},
            "created_at": datetime.utcnow()
        }
        await source_collection.insert_one(default_source)
    
    # Insert default categories config
    config_collection = db.app_config
    existing_config = await config_collection.find_one({"config_name": "categories"})
    
    if not existing_config:
        categories_config = {
            "config_name": "categories",
            "payload": [
                {"key": "product_launch", "display": "Product Launch"},
                {"key": "regulation", "display": "Regulation"},
                {"key": "corporate_financial", "display": "Corporate / Financial"},
                {"key": "technology", "display": "Technology"},
                {"key": "recall", "display": "Recall & Safety"},
                {"key": "market_sales", "display": "Market & Sales"},
                {"key": "opinion", "display": "Opinion / Analysis"}
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await config_collection.insert_one(categories_config)


# Import datetime here to avoid circular imports
from datetime import datetime
