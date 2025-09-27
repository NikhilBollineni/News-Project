"""
Integration tests for FastAPI endpoints.
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from backend.main import app
from backend.database import get_database


class TestAPIEndpoints:
    """Test cases for API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    @pytest.fixture
    def mock_database(self):
        """Mock database for testing."""
        with patch('backend.main.get_database') as mock_db:
            mock_db.return_value = AsyncMock()
            yield mock_db
    
    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "News Ingestion API"
        assert data["version"] == "1.0.0"
        assert "timestamp" in data
    
    def test_health_check_success(self, client, mock_database):
        """Test successful health check."""
        mock_db = mock_database.return_value
        mock_db.command = AsyncMock(return_value={"ok": 1})
        
        with patch('backend.main.celery_app.control.stats') as mock_stats:
            mock_stats.return_value = {"worker1": {}}
            
            response = client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["database"] == "connected"
            assert "celery_workers" in data
            assert "websocket_connections" in data
    
    def test_health_check_database_failure(self, client, mock_database):
        """Test health check with database failure."""
        mock_db = mock_database.return_value
        mock_db.command = AsyncMock(side_effect=Exception("Database error"))
        
        response = client.get("/health")
        
        assert response.status_code == 503
        data = response.json()
        assert data["detail"] == "Service unhealthy"
    
    def test_get_articles_success(self, client, mock_database):
        """Test successful article retrieval."""
        mock_db = mock_database.return_value
        
        # Mock articles data
        mock_articles = [
            {
                "_id": "article1",
                "ai_title": "Test Article 1",
                "title_original": "Original Title 1",
                "publisher": "Test Publisher",
                "published_at": "2023-01-01T00:00:00Z",
                "industry": "automotive",
                "category": "technology",
                "short_summary": "Test summary 1",
                "long_summary": "Test long summary 1",
                "sentiment_label": "positive",
                "sentiment_score": 0.8,
                "entities": [],
                "tags": ["test"],
                "created_at": "2023-01-01T00:00:00Z",
                "raw_article_id": "raw1"
            }
        ]
        
        mock_db.ai_articles.count_documents = AsyncMock(return_value=1)
        mock_db.ai_articles.find.return_value.to_list = AsyncMock(return_value=mock_articles)
        mock_db.raw_articles.find_one = AsyncMock(return_value={"url": "https://example.com/article1"})
        
        response = client.get("/articles")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["ai_title"] == "Test Article 1"
    
    def test_get_articles_with_filters(self, client, mock_database):
        """Test article retrieval with filters."""
        mock_db = mock_database.return_value
        mock_db.ai_articles.count_documents = AsyncMock(return_value=0)
        mock_db.ai_articles.find.return_value.to_list = AsyncMock(return_value=[])
        
        response = client.get("/articles?category=technology&sentiment=positive")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["items"]) == 0
    
    def test_get_article_by_id_success(self, client, mock_database):
        """Test successful single article retrieval."""
        mock_db = mock_database.return_value
        
        mock_article = {
            "_id": "article1",
            "ai_title": "Test Article",
            "title_original": "Original Title",
            "publisher": "Test Publisher",
            "published_at": "2023-01-01T00:00:00Z",
            "industry": "automotive",
            "category": "technology",
            "short_summary": "Test summary",
            "long_summary": "Test long summary",
            "sentiment_label": "positive",
            "sentiment_score": 0.8,
            "entities": [],
            "tags": ["test"],
            "created_at": "2023-01-01T00:00:00Z",
            "raw_article_id": "raw1"
        }
        
        mock_db.ai_articles.find_one = AsyncMock(return_value=mock_article)
        mock_db.raw_articles.find_one = AsyncMock(return_value={"url": "https://example.com/article"})
        
        response = client.get("/articles/article1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["ai_title"] == "Test Article"
        assert data["url"] == "https://example.com/article"
    
    def test_get_article_by_id_not_found(self, client, mock_database):
        """Test article retrieval for non-existent ID."""
        mock_db = mock_database.return_value
        mock_db.ai_articles.find_one = AsyncMock(return_value=None)
        
        response = client.get("/articles/nonexistent")
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Article not found"
    
    def test_get_categories_success(self, client, mock_database):
        """Test successful categories retrieval."""
        mock_db = mock_database.return_value
        
        mock_config = {
            "config_name": "categories",
            "payload": [
                {"key": "product_launch", "display": "Product Launch"},
                {"key": "technology", "display": "Technology"}
            ]
        }
        
        mock_db.app_config.find_one = AsyncMock(return_value=mock_config)
        
        response = client.get("/categories")
        
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) == 2
    
    def test_get_categories_default(self, client, mock_database):
        """Test categories retrieval with default fallback."""
        mock_db = mock_database.return_value
        mock_db.app_config.find_one = AsyncMock(return_value=None)
        
        response = client.get("/categories")
        
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
    
    def test_get_stats_success(self, client, mock_database):
        """Test successful stats retrieval."""
        mock_db = mock_database.return_value
        
        # Mock aggregation results
        mock_db.ai_articles.aggregate.return_value.to_list = AsyncMock(return_value=[
            {"_id": "technology", "count": 10},
            {"_id": "product_launch", "count": 5}
        ])
        mock_db.ai_articles.count_documents = AsyncMock(return_value=15)
        
        response = client.get("/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_articles" in data
        assert "category_distribution" in data
        assert "sentiment_distribution" in data
    
    def test_force_ingest_success(self, client):
        """Test successful force ingestion."""
        with patch('backend.main.celery_app.send_task') as mock_task:
            mock_task.return_value.id = "task123"
            
            response = client.post("/admin/ingest/force")
            
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "RSS ingestion triggered"
            assert data["task_id"] == "task123"
    
    def test_reprocess_article_success(self, client):
        """Test successful article reprocessing."""
        with patch('backend.main.reprocess_article') as mock_reprocess:
            mock_reprocess.return_value.id = "task456"
            
            response = client.post("/admin/reprocess/raw123")
            
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Article reprocessing triggered"
            assert data["raw_article_id"] == "raw123"
            assert data["task_id"] == "task456"


class TestAPIErrorHandling:
    """Test cases for API error handling."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    def test_invalid_article_id_format(self, client):
        """Test invalid article ID format."""
        response = client.get("/articles/invalid-id")
        
        # Should return 500 due to invalid ObjectId
        assert response.status_code == 500
    
    def test_pagination_validation(self, client):
        """Test pagination parameter validation."""
        # Test negative page
        response = client.get("/articles?page=-1")
        assert response.status_code == 422
        
        # Test page too large
        response = client.get("/articles?per_page=200")
        assert response.status_code == 422
    
    def test_malformed_query_parameters(self, client):
        """Test malformed query parameters."""
        # This should not cause errors, just return empty results
        response = client.get("/articles?invalid_param=value")
        assert response.status_code == 200
