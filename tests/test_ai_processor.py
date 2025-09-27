"""
Unit tests for AI processor functionality.
"""
import pytest
import json
from unittest.mock import Mock, patch, AsyncMock
from utils.ai_processor import AIProcessor, process_article_with_ai


class TestAIProcessor:
    """Test cases for AIProcessor class."""
    
    def test_create_prompt(self):
        """Test prompt creation."""
        processor = AIProcessor()
        
        title = "Tesla Announces New Model"
        text = "Tesla has announced a new electric vehicle model with advanced features."
        url = "https://example.com/tesla-news"
        publisher = "Tech News"
        
        prompt = processor._create_prompt(title, text, url, publisher)
        
        assert title in prompt
        assert url in prompt
        assert publisher in prompt
        assert "JSON" in prompt
        assert "300-500 words" in prompt
        assert "max 120 words" in prompt
    
    def test_parse_ai_response_valid(self):
        """Test parsing valid AI response."""
        processor = AIProcessor()
        
        valid_response = {
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
            "tags": ["electric vehicles", "innovation", "sustainability"]
        }
        
        response_json = json.dumps(valid_response)
        
        result = processor._parse_ai_response(
            response_json,
            "Tesla Announces New Model",
            "Tesla has announced a new electric vehicle model.",
            "https://example.com/tesla-news",
            "Tech News"
        )
        
        assert result["ai_title"] == valid_response["ai_title"]
        assert result["category"] == valid_response["category"]
        assert result["sentiment_label"] == valid_response["sentiment_label"]
        assert result["sentiment_score"] == valid_response["sentiment_score"]
        assert len(result["entities"]) == 2
        assert len(result["tags"]) == 3
    
    def test_parse_ai_response_invalid_category(self):
        """Test parsing AI response with invalid category."""
        processor = AIProcessor()
        
        invalid_response = {
            "ai_title": "Test Article",
            "category": "invalid_category",
            "short_summary": "Test summary.",
            "long_summary": "This is a test article with sufficient content to meet the minimum word count requirements for the long summary field. The article discusses various topics related to the automotive industry and provides comprehensive information about recent developments and trends. It covers multiple aspects of the industry including technological advancements, market dynamics, regulatory changes, and consumer preferences. The content is designed to be informative and engaging while maintaining a professional tone and providing valuable insights for readers interested in automotive news and analysis.",
            "sentiment_label": "neutral",
            "sentiment_score": 0.5,
            "entities": [],
            "tags": ["test"]
        }
        
        response_json = json.dumps(invalid_response)
        
        result = processor._parse_ai_response(
            response_json,
            "Test Article",
            "Test content",
            "https://example.com/test",
            "Test Publisher"
        )
        
        # Should default to 'opinion' for invalid category
        assert result["category"] == "opinion"
    
    def test_parse_ai_response_invalid_sentiment_score(self):
        """Test parsing AI response with invalid sentiment score."""
        processor = AIProcessor()
        
        invalid_response = {
            "ai_title": "Test Article",
            "category": "technology",
            "short_summary": "Test summary.",
            "long_summary": "This is a test article with sufficient content to meet the minimum word count requirements for the long summary field. The article discusses various topics related to the automotive industry and provides comprehensive information about recent developments and trends. It covers multiple aspects of the industry including technological advancements, market dynamics, regulatory changes, and consumer preferences. The content is designed to be informative and engaging while maintaining a professional tone and providing valuable insights for readers interested in automotive news and analysis.",
            "sentiment_label": "positive",
            "sentiment_score": 1.5,  # Invalid score > 1.0
            "entities": [],
            "tags": ["test"]
        }
        
        response_json = json.dumps(invalid_response)
        
        result = processor._parse_ai_response(
            response_json,
            "Test Article",
            "Test content",
            "https://example.com/test",
            "Test Publisher"
        )
        
        # Should default to 0.5 for invalid score
        assert result["sentiment_score"] == 0.5
    
    def test_parse_ai_response_short_summary_too_long(self):
        """Test parsing AI response with overly long short summary."""
        processor = AIProcessor()
        
        long_short_summary = " ".join(["word"] * 150)  # 150 words
        
        invalid_response = {
            "ai_title": "Test Article",
            "category": "technology",
            "short_summary": long_short_summary,
            "long_summary": "This is a test article with sufficient content to meet the minimum word count requirements for the long summary field. The article discusses various topics related to the automotive industry and provides comprehensive information about recent developments and trends. It covers multiple aspects of the industry including technological advancements, market dynamics, regulatory changes, and consumer preferences. The content is designed to be informative and engaging while maintaining a professional tone and providing valuable insights for readers interested in automotive news and analysis.",
            "sentiment_label": "neutral",
            "sentiment_score": 0.5,
            "entities": [],
            "tags": ["test"]
        }
        
        response_json = json.dumps(invalid_response)
        
        result = processor._parse_ai_response(
            response_json,
            "Test Article",
            "Test content",
            "https://example.com/test",
            "Test Publisher"
        )
        
        # Should be truncated to 120 words
        assert len(result["short_summary"].split()) <= 120
    
    def test_parse_ai_response_invalid_json(self):
        """Test parsing invalid JSON response."""
        processor = AIProcessor()
        
        invalid_json = "This is not valid JSON"
        
        with pytest.raises(ValueError, match="Invalid JSON response"):
            processor._parse_ai_response(
                invalid_json,
                "Test Article",
                "Test content",
                "https://example.com/test",
                "Test Publisher"
            )
    
    def test_count_words(self):
        """Test word counting functionality."""
        processor = AIProcessor()
        
        assert processor._count_words("") == 0
        assert processor._count_words("word") == 1
        assert processor._count_words("two words") == 2
        assert processor._count_words("This is a sentence with multiple words.") == 8
    
    def test_validate_entities(self):
        """Test entity validation."""
        processor = AIProcessor()
        
        valid_entities = [
            {"type": "company", "name": "Tesla"},
            {"type": "product", "name": "Model S"},
            {"type": "person", "name": "Elon Musk"}
        ]
        
        invalid_entities = [
            {"type": "invalid_type", "name": "Invalid"},
            {"name": "Missing Type"},
            {"type": "company"},  # Missing name
            "Not a dict"
        ]
        
        validated = processor._validate_entities(valid_entities + invalid_entities)
        
        # Should only include valid entities
        assert len(validated) == 3
        assert {"type": "company", "name": "Tesla"} in validated
        assert {"type": "product", "name": "Model S"} in validated
        assert {"type": "person", "name": "Elon Musk"} in validated


class TestAIProcessorIntegration:
    """Integration tests for AI processor functionality."""
    
    @pytest.mark.asyncio
    async def test_process_article_with_ai_success(self):
        """Test successful article processing with AI."""
        mock_ai_response = {
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
            "tags": ["electric vehicles", "innovation", "sustainability"]
        }
        
        with patch('openai.AsyncOpenAI') as mock_openai:
            mock_client = AsyncMock()
            mock_openai.return_value = mock_client
            
            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message.content = json.dumps(mock_ai_response)
            
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
            
            result = await process_article_with_ai(
                title="Tesla Announces New Model",
                text="Tesla has announced a new electric vehicle model with advanced features.",
                url="https://example.com/tesla-news",
                publisher="Tech News"
            )
            
            assert result["ai_title"] == mock_ai_response["ai_title"]
            assert result["category"] == mock_ai_response["category"]
            assert result["sentiment_label"] == mock_ai_response["sentiment_label"]
            assert "ai_raw_response" in result
    
    @pytest.mark.asyncio
    async def test_process_article_with_ai_failure(self):
        """Test article processing failure."""
        with patch('openai.AsyncOpenAI') as mock_openai:
            mock_client = AsyncMock()
            mock_openai.return_value = mock_client
            
            mock_client.chat.completions.create = AsyncMock(side_effect=Exception("API Error"))
            
            with pytest.raises(Exception):
                await process_article_with_ai(
                    title="Test Article",
                    text="Test content",
                    url="https://example.com/test",
                    publisher="Test Publisher"
                )
