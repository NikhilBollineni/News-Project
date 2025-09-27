"""
Web scraping utilities for article content extraction.
"""
import hashlib
import re
import asyncio
import aiohttp
from typing import Optional, Tuple
from urllib.parse import urlparse, urljoin
import structlog
from newspaper import Article
from readability import Document
from bs4 import BeautifulSoup
from backend.config import settings

logger = structlog.get_logger(__name__)


class ArticleScraper:
    """Robust article content scraper with multiple extraction methods."""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
    
    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession(
            headers=self.headers,
            timeout=aiohttp.ClientTimeout(total=settings.request_timeout)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
    
    def generate_feed_item_id(self, url: str, pub_date: str) -> str:
        """Generate unique identifier for RSS item."""
        content = f"{url}|{pub_date}"
        return hashlib.sha256(content.encode()).hexdigest()
    
    def normalize_url(self, url: str) -> str:
        """Normalize URL by removing query parameters and fragments."""
        parsed = urlparse(url)
        # Remove query parameters and fragments
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        return normalized
    
    async def fetch_article(self, url: str) -> Tuple[Optional[str], Optional[str], bool]:
        """
        Fetch article content from URL.
        
        Returns:
            Tuple of (raw_html, cleaned_text, success_flag)
        """
        if not self.session:
            raise RuntimeError("Session not initialized. Use async context manager.")
        
        try:
            logger.info("Fetching article", url=url)
            
            async with self.session.get(url) as response:
                if response.status != 200:
                    logger.warning("Failed to fetch article", url=url, status=response.status)
                    return None, None, False
                
                raw_html = await response.text()
                
                # Extract cleaned text using multiple methods
                cleaned_text = await self._extract_text(raw_html, url)
                
                if not cleaned_text or len(cleaned_text.strip()) < settings.min_article_length:
                    logger.warning("Article too short or extraction failed", 
                                 url=url, length=len(cleaned_text) if cleaned_text else 0)
                    return raw_html, cleaned_text, False
                
                logger.info("Successfully scraped article", 
                          url=url, length=len(cleaned_text))
                return raw_html, cleaned_text, True
                
        except asyncio.TimeoutError:
            logger.error("Timeout fetching article", url=url)
            return None, None, False
        except Exception as e:
            logger.error("Error fetching article", url=url, error=str(e))
            return None, None, False
    
    async def _extract_text(self, html: str, url: str) -> Optional[str]:
        """Extract cleaned text using multiple methods."""
        try:
            # Method 1: Newspaper3k (most reliable for news articles)
            article = Article(url)
            article.set_html(html)
            article.parse()
            
            if article.text and len(article.text.strip()) > settings.min_article_length:
                logger.debug("Extracted text using newspaper3k", length=len(article.text))
                return article.text.strip()
            
            # Method 2: Readability-lxml
            doc = Document(html)
            readable_html = doc.summary()
            
            if readable_html:
                soup = BeautifulSoup(readable_html, 'html.parser')
                text = soup.get_text(separator=' ', strip=True)
                
                if text and len(text.strip()) > settings.min_article_length:
                    logger.debug("Extracted text using readability", length=len(text))
                    return text.strip()
            
            # Method 3: BeautifulSoup fallback
            soup = BeautifulSoup(html, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
                script.decompose()
            
            # Try to find main content areas
            main_content = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile(r'content|article|story|post'))
            
            if main_content:
                text = main_content.get_text(separator=' ', strip=True)
                if text and len(text.strip()) > settings.min_article_length:
                    logger.debug("Extracted text using BeautifulSoup main content", length=len(text))
                    return text.strip()
            
            # Fallback: get all text
            text = soup.get_text(separator=' ', strip=True)
            if text and len(text.strip()) > settings.min_article_length:
                logger.debug("Extracted text using BeautifulSoup fallback", length=len(text))
                return text.strip()
            
            logger.warning("All text extraction methods failed", url=url)
            return None
            
        except Exception as e:
            logger.error("Error in text extraction", url=url, error=str(e))
            return None
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common noise patterns
        text = re.sub(r'Advertisement\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Subscribe\s*to\s*.*?newsletter\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Follow\s+us\s+on\s+.*?$', '', text, flags=re.IGNORECASE)
        
        return text.strip()


# Standalone functions for use in workers
async def scrape_article(url: str) -> Tuple[Optional[str], Optional[str], bool]:
    """Standalone function to scrape an article."""
    async with ArticleScraper() as scraper:
        return await scraper.fetch_article(url)


def generate_feed_item_id(url: str, pub_date: str) -> str:
    """Standalone function to generate feed item ID."""
    content = f"{url}|{pub_date}"
    return hashlib.sha256(content.encode()).hexdigest()


def normalize_url(url: str) -> str:
    """Standalone function to normalize URL."""
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
