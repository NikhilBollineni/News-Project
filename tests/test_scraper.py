"""
Unit tests for article scraper functionality.
"""
import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from utils.scraper import ArticleScraper, generate_feed_item_id, normalize_url


class TestArticleScraper:
    """Test cases for ArticleScraper class."""
    
    def test_generate_feed_item_id(self):
        """Test feed item ID generation."""
        url = "https://example.com/article"
        pub_date = "2023-01-01T00:00:00Z"
        
        id1 = generate_feed_item_id(url, pub_date)
        id2 = generate_feed_item_id(url, pub_date)
        
        # Should be deterministic
        assert id1 == id2
        assert len(id1) == 64  # SHA256 hex length
        
        # Different inputs should produce different IDs
        id3 = generate_feed_item_id(url, "2023-01-02T00:00:00Z")
        assert id1 != id3
    
    def test_normalize_url(self):
        """Test URL normalization."""
        # Test removing query parameters
        url1 = "https://example.com/article?utm_source=test&ref=123"
        normalized1 = normalize_url(url1)
        assert normalized1 == "https://example.com/article"
        
        # Test removing fragments
        url2 = "https://example.com/article#section"
        normalized2 = normalize_url(url2)
        assert normalized2 == "https://example.com/article"
        
        # Test complex URL
        url3 = "https://example.com/path/to/article?param=value#fragment"
        normalized3 = normalize_url(url3)
        assert normalized3 == "https://example.com/path/to/article"
    
    @pytest.mark.asyncio
    async def test_fetch_article_success(self):
        """Test successful article fetching."""
        mock_html = """
        <html>
            <head><title>Test Article</title></head>
            <body>
                <article>
                    <h1>Test Article Title</h1>
                    <p>This is a test article with sufficient content to pass the minimum length requirement.</p>
                    <p>It contains multiple paragraphs to ensure the text extraction works correctly.</p>
                </article>
            </body>
        </html>
        """
        
        with patch('aiohttp.ClientSession') as mock_session:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.text = AsyncMock(return_value=mock_html)
            
            mock_session.return_value.__aenter__.return_value.get.return_value.__aenter__.return_value = mock_response
            
            async with ArticleScraper() as scraper:
                raw_html, scraped_text, success = await scraper.fetch_article("https://example.com/article")
            
            assert success is True
            assert raw_html == mock_html
            assert scraped_text is not None
            assert len(scraped_text) > 100
    
    @pytest.mark.asyncio
    async def test_fetch_article_failure(self):
        """Test article fetching failure."""
        with patch('aiohttp.ClientSession') as mock_session:
            mock_response = AsyncMock()
            mock_response.status = 404
            
            mock_session.return_value.__aenter__.return_value.get.return_value.__aenter__.return_value = mock_response
            
            async with ArticleScraper() as scraper:
                raw_html, scraped_text, success = await scraper.fetch_article("https://example.com/notfound")
            
            assert success is False
            assert raw_html is None
            assert scraped_text is None
    
    @pytest.mark.asyncio
    async def test_fetch_article_timeout(self):
        """Test article fetching timeout."""
        with patch('aiohttp.ClientSession') as mock_session:
            mock_session.return_value.__aenter__.return_value.get.side_effect = asyncio.TimeoutError()
            
            async with ArticleScraper() as scraper:
                raw_html, scraped_text, success = await scraper.fetch_article("https://example.com/slow")
            
            assert success is False
            assert raw_html is None
            assert scraped_text is None
    
    def test_clean_text(self):
        """Test text cleaning functionality."""
        scraper = ArticleScraper()
        
        # Test removing extra whitespace
        dirty_text = "This   has    extra    spaces"
        cleaned = scraper.clean_text(dirty_text)
        assert cleaned == "This has extra spaces"
        
        # Test removing advertisement text
        ad_text = "Advertisement This is real content Subscribe to newsletter"
        cleaned = scraper.clean_text(ad_text)
        assert "Advertisement" not in cleaned
        assert "Subscribe to newsletter" not in cleaned
        assert "This is real content" in cleaned
        
        # Test empty text
        assert scraper.clean_text("") == ""
        assert scraper.clean_text(None) == ""


class TestScraperIntegration:
    """Integration tests for scraper functionality."""
    
    @pytest.mark.asyncio
    async def test_scrape_article_function(self):
        """Test standalone scrape_article function."""
        from utils.scraper import scrape_article
        
        mock_html = """
        <html>
            <body>
                <article>
                    <h1>Integration Test Article</h1>
                    <p>This is a comprehensive test article that contains enough content to meet the minimum requirements for text extraction and processing.</p>
                    <p>The article should be processed successfully by the scraper and return valid results.</p>
                </article>
            </body>
        </html>
        """
        
        with patch('aiohttp.ClientSession') as mock_session:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.text = AsyncMock(return_value=mock_html)
            
            mock_session.return_value.__aenter__.return_value.get.return_value.__aenter__.return_value = mock_response
            
            raw_html, scraped_text, success = await scrape_article("https://example.com/integration-test")
            
            assert success is True
            assert raw_html == mock_html
            assert scraped_text is not None
            assert "Integration Test Article" in scraped_text
