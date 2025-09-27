"""
Integration tests for the complete news ingestion pipeline.
"""
import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
from bson import ObjectId
from backend.database import get_database, setup_database
from workers.rss_poller import _poll_rss_feeds_async, _process_articles
from workers.ai_processor import _process_article_with_ai_async
from utils.scraper import scrape_article


class TestNewsIngestionPipeline:
    """Integration tests for the complete news ingestion pipeline."""
    
    @pytest.fixture
    async def mock_database(self):
        """Mock database for integration testing."""
        with patch('backend.database.get_database') as mock_db:
            mock_db_instance = AsyncMock()
            mock_db.return_value = mock_db_instance
            
            # Mock collections
            mock_db_instance.sources = AsyncMock()
            mock_db_instance.raw_articles = AsyncMock()
            mock_db_instance.ai_articles = AsyncMock()
            mock_db_instance.app_config = AsyncMock()
            
            yield mock_db_instance
    
    @pytest.mark.asyncio
    async def test_complete_ingestion_flow(self, mock_database):
        """Test complete RSS ingestion to AI processing flow."""
        # Mock RSS source
        mock_source = {
            "_id": ObjectId(),
            "name": "google_news_automotive_search",
            "industry": "automotive",
            "source_type": "google_rss",
            "url": "https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=automotive",
            "config": {"poll_interval_seconds": 120}
        }
        
        mock_database.sources.find.return_value.to_list = AsyncMock(return_value=[mock_source])
        
        # Mock RSS feed content
        mock_rss_articles = [
            {
                "title": "Tesla Announces New Model",
                "link": "https://example.com/tesla-news",
                "description": "Tesla has announced a new electric vehicle model.",
                "pub_date": "2023-01-01T00:00:00Z",
                "published_at": datetime.utcnow(),
                "publisher": "Tech News"
            }
        ]
        
        # Mock RSS fetching
        with patch('workers.rss_poller._fetch_rss_feed') as mock_fetch:
            mock_fetch.return_value = mock_rss_articles
            
            # Mock article scraping
            with patch('utils.scraper.scrape_article') as mock_scrape:
                mock_scrape.return_value = (
                    "<html>Mock HTML</html>",
                    "Tesla has announced a new electric vehicle model with advanced features and sustainable technology.",
                    True
                )
                
                # Mock raw article insertion
                mock_database.raw_articles.insert_one.return_value = Mock(inserted_id=ObjectId())
                
                # Mock AI processing
                with patch('workers.ai_processor.process_article_with_ai') as mock_ai:
                    mock_ai.return_value = {
                        "ai_title": "Tesla Unveils Revolutionary Electric Vehicle",
                        "category": "product_launch",
                        "short_summary": "Tesla announces new electric vehicle with advanced features.",
                        "long_summary": "Tesla has announced a revolutionary new electric vehicle model that represents a significant advancement in automotive technology. The new vehicle features cutting-edge battery technology, autonomous driving capabilities, and sustainable manufacturing processes. This announcement marks a major milestone in the electric vehicle industry and demonstrates Tesla's continued commitment to innovation and environmental sustainability. The vehicle is expected to be available in the coming year and is anticipated to set new standards for performance, efficiency, and user experience in the electric vehicle market.",
                        "sentiment_label": "positive",
                        "sentiment_score": 0.8,
                        "entities": [
                            {"type": "company", "name": "Tesla"},
                            {"type": "product", "name": "Electric Vehicle"}
                        ],
                        "tags": ["electric vehicles", "innovation", "sustainability"],
                        "ai_raw_response": {"model": "gpt-3.5-turbo", "timestamp": "2023-01-01T00:00:00Z"}
                    }
                    
                    # Mock AI article insertion
                    mock_database.ai_articles.insert_one.return_value = Mock(inserted_id=ObjectId())
                    
                    # Mock notification sending
                    with patch('workers.ai_processor.send_article_notification') as mock_notify:
                        mock_notify.return_value = {"success": True}
                        
                        # Run the complete flow
                        result = await _poll_rss_feeds_async()
                        
                        # Verify results
                        assert result["processed"] >= 0
                        assert "errors" in result
                        assert "timestamp" in result
                        
                        # Verify database calls were made
                        mock_database.sources.find.assert_called_once()
                        mock_database.raw_articles.insert_one.assert_called()
                        mock_database.ai_articles.insert_one.assert_called()
    
    @pytest.mark.asyncio
    async def test_article_deduplication(self, mock_database):
        """Test that duplicate articles are not processed."""
        # Mock existing article
        existing_article = {
            "_id": ObjectId(),
            "feed_item_id": "existing_id",
            "url": "https://example.com/existing-article"
        }
        
        mock_database.raw_articles.find_one.return_value = existing_article
        
        # Mock RSS articles with duplicate
        mock_rss_articles = [
            {
                "title": "Existing Article",
                "link": "https://example.com/existing-article",
                "description": "This article already exists.",
                "pub_date": "2023-01-01T00:00:00Z",
                "published_at": datetime.utcnow(),
                "publisher": "News Source"
            }
        ]
        
        with patch('workers.rss_poller._fetch_rss_feed') as mock_fetch:
            mock_fetch.return_value = mock_rss_articles
            
            # Mock source
            mock_source = {
                "_id": ObjectId(),
                "name": "test_source",
                "industry": "automotive"
            }
            
            mock_database.sources.find.return_value.to_list = AsyncMock(return_value=[mock_source])
            
            result = await _poll_rss_feeds_async()
            
            # Should not process duplicate
            assert result["processed"] == 0
            mock_database.raw_articles.insert_one.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_ai_processing_error_handling(self, mock_database):
        """Test AI processing error handling."""
        # Mock raw article
        mock_raw_article = {
            "_id": ObjectId(),
            "scraped_text": "Test article content",
            "url": "https://example.com/test-article"
        }
        
        mock_database.raw_articles.find_one.return_value = mock_raw_article
        mock_database.ai_articles.find_one.return_value = None  # No existing AI article
        
        # Mock AI processing failure
        with patch('workers.ai_processor.process_article_with_ai') as mock_ai:
            mock_ai.side_effect = Exception("OpenAI API Error")
            
            result = await _process_article_with_ai_async(
                raw_article_id=str(mock_raw_article["_id"]),
                title="Test Article",
                url="https://example.com/test-article",
                publisher="Test Publisher",
                published_at=datetime.utcnow().isoformat()
            )
            
            # Should handle error gracefully
            assert result["success"] is False
            assert "error" in result
    
    @pytest.mark.asyncio
    async def test_scraping_failure_handling(self, mock_database):
        """Test scraping failure handling."""
        # Mock RSS articles
        mock_rss_articles = [
            {
                "title": "Article with Scraping Issues",
                "link": "https://example.com/problematic-article",
                "description": "This article will fail to scrape.",
                "pub_date": "2023-01-01T00:00:00Z",
                "published_at": datetime.utcnow(),
                "publisher": "News Source"
            }
        ]
        
        # Mock scraping failure
        with patch('utils.scraper.scrape_article') as mock_scrape:
            mock_scrape.return_value = (None, None, False)  # Scraping failed
            
            # Mock source
            mock_source = {
                "_id": ObjectId(),
                "name": "test_source",
                "industry": "automotive"
            }
            
            mock_database.sources.find.return_value.to_list = AsyncMock(return_value=[mock_source])
            mock_database.raw_articles.find_one.return_value = None  # New article
            mock_database.raw_articles.insert_one.return_value = Mock(inserted_id=ObjectId())
            
            result = await _poll_rss_feeds_async()
            
            # Should still process the article but mark as failed
            assert result["processed"] >= 0
            mock_database.raw_articles.insert_one.assert_called()
    
    @pytest.mark.asyncio
    async def test_database_connection_handling(self):
        """Test database connection error handling."""
        with patch('backend.database.get_database') as mock_db:
            mock_db.side_effect = Exception("Database connection failed")
            
            with pytest.raises(Exception):
                await _poll_rss_feeds_async()
    
    @pytest.mark.asyncio
    async def test_concurrent_processing(self, mock_database):
        """Test concurrent article processing."""
        # Mock multiple articles
        mock_rss_articles = [
            {
                "title": f"Article {i}",
                "link": f"https://example.com/article-{i}",
                "description": f"Description for article {i}",
                "pub_date": "2023-01-01T00:00:00Z",
                "published_at": datetime.utcnow(),
                "publisher": "News Source"
            }
            for i in range(3)
        ]
        
        mock_database.sources.find.return_value.to_list = AsyncMock(return_value=[{
            "_id": ObjectId(),
            "name": "test_source",
            "industry": "automotive"
        }])
        
        mock_database.raw_articles.find_one.return_value = None  # New articles
        mock_database.raw_articles.insert_one.return_value = Mock(inserted_id=ObjectId())
        
        with patch('workers.rss_poller._fetch_rss_feed') as mock_fetch:
            mock_fetch.return_value = mock_rss_articles
            
            with patch('utils.scraper.scrape_article') as mock_scrape:
                mock_scrape.return_value = ("<html>Content</html>", "Article content", True)
                
                result = await _poll_rss_feeds_async()
                
                # Should process all articles
                assert result["processed"] == 3
                assert mock_database.raw_articles.insert_one.call_count == 3


class TestDataConsistency:
    """Test cases for data consistency and integrity."""
    
    @pytest.mark.asyncio
    async def test_foreign_key_relationships(self, mock_database):
        """Test that foreign key relationships are maintained."""
        # Mock raw article
        raw_article_id = ObjectId()
        mock_raw_article = {
            "_id": raw_article_id,
            "source_id": ObjectId(),
            "url": "https://example.com/test-article",
            "scraped_text": "Test content"
        }
        
        mock_database.raw_articles.find_one.return_value = mock_raw_article
        mock_database.ai_articles.find_one.return_value = None
        
        # Mock AI processing
        with patch('workers.ai_processor.process_article_with_ai') as mock_ai:
            mock_ai.return_value = {
                "ai_title": "Test Article",
                "category": "technology",
                "short_summary": "Test summary",
                "long_summary": "Test long summary with sufficient content to meet the minimum word count requirements for the long summary field. The article discusses various topics related to the automotive industry and provides comprehensive information about recent developments and trends. It covers multiple aspects of the industry including technological advancements, market dynamics, regulatory changes, and consumer preferences. The content is designed to be informative and engaging while maintaining a professional tone and providing valuable insights for readers interested in automotive news and analysis.",
                "sentiment_label": "neutral",
                "sentiment_score": 0.5,
                "entities": [],
                "tags": ["test"],
                "ai_raw_response": {}
            }
            
            mock_database.ai_articles.insert_one.return_value = Mock(inserted_id=ObjectId())
            
            result = await _process_article_with_ai_async(
                raw_article_id=str(raw_article_id),
                title="Test Article",
                url="https://example.com/test-article",
                publisher="Test Publisher",
                published_at=datetime.utcnow().isoformat()
            )
            
            # Verify the AI article was created with correct foreign key
            mock_database.ai_articles.insert_one.assert_called_once()
            call_args = mock_database.ai_articles.insert_one.call_args[0][0]
            assert call_args["raw_article_id"] == raw_article_id
    
    @pytest.mark.asyncio
    async def test_data_validation(self, mock_database):
        """Test data validation in the pipeline."""
        # Test with invalid AI response
        with patch('workers.ai_processor.process_article_with_ai') as mock_ai:
            mock_ai.return_value = {
                "ai_title": "",  # Invalid empty title
                "category": "invalid_category",  # Invalid category
                "short_summary": "Test summary",
                "long_summary": "Test long summary with sufficient content to meet the minimum word count requirements for the long summary field. The article discusses various topics related to the automotive industry and provides comprehensive information about recent developments and trends. It covers multiple aspects of the industry including technological advancements, market dynamics, regulatory changes, and consumer preferences. The content is designed to be informative and engaging while maintaining a professional tone and providing valuable insights for readers interested in automotive news and analysis.",
                "sentiment_label": "invalid_sentiment",  # Invalid sentiment
                "sentiment_score": 1.5,  # Invalid score
                "entities": "not_a_list",  # Invalid entities
                "tags": "not_a_list",  # Invalid tags
                "ai_raw_response": {}
            }
            
            mock_database.raw_articles.find_one.return_value = {
                "_id": ObjectId(),
                "scraped_text": "Test content"
            }
            mock_database.ai_articles.find_one.return_value = None
            
            # Should handle validation errors gracefully
            result = await _process_article_with_ai_async(
                raw_article_id=str(ObjectId()),
                title="Test Article",
                url="https://example.com/test-article",
                publisher="Test Publisher",
                published_at=datetime.utcnow().isoformat()
            )
            
            # Should still succeed but with corrected data
            assert result["success"] is True
