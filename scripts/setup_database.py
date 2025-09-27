#!/usr/bin/env python3
"""
Database setup script for news ingestion pipeline.
Creates database, collections, and indexes.
"""
import asyncio
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.database import connect_to_mongo, create_indexes, setup_database
from backend.config import settings
import structlog

logger = structlog.get_logger(__name__)


async def main():
    """Setup database with collections and indexes."""
    try:
        logger.info("Starting database setup")
        
        # Connect to MongoDB
        await connect_to_mongo()
        logger.info("Connected to MongoDB")
        
        # Create indexes
        await create_indexes()
        logger.info("Created database indexes")
        
        # Setup default data
        await setup_database()
        logger.info("Setup default database data")
        
        logger.info("Database setup completed successfully")
        
    except Exception as e:
        logger.error("Database setup failed", error=str(e))
        sys.exit(1)
    finally:
        from backend.database import close_mongo_connection
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
