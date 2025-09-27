"""
AI processing utilities for article enrichment using OpenAI.
"""
import json
import re
from typing import Dict, Any, List, Optional
import structlog
from openai import AsyncOpenAI
from backend.config import settings
from backend.models import CategoryEnum, SentimentEnum, Entity, EntityTypeEnum

logger = structlog.get_logger(__name__)


class AIProcessor:
    """AI processor for article enrichment using OpenAI."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
        self.max_tokens = settings.openai_max_tokens
        self.temperature = settings.openai_temperature
    
    async def process_article(self, title: str, text: str, url: str, publisher: str) -> Dict[str, Any]:
        """
        Process article through OpenAI for enrichment.
        
        Args:
            title: Article title
            text: Cleaned article text
            url: Article URL
            publisher: Publisher name
            
        Returns:
            Dict containing AI-enriched data
        """
        try:
            logger.info("Processing article with AI", title=title[:100], url=url)
            
            prompt = self._create_prompt(title, text, url, publisher)
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert news analyst specializing in automotive industry content. You must respond ONLY with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                response_format={"type": "json_object"}
            )
            
            ai_response = response.choices[0].message.content
            logger.debug("Received AI response", length=len(ai_response))
            
            # Parse and validate response
            enriched_data = self._parse_ai_response(ai_response, title, text, url, publisher)
            
            logger.info("Successfully processed article with AI", 
                       title=title[:100], category=enriched_data.get('category'))
            
            return enriched_data
            
        except Exception as e:
            logger.error("Error processing article with AI", 
                        title=title[:100], error=str(e))
            raise
    
    def _create_prompt(self, title: str, text: str, url: str, publisher: str) -> str:
        """Create structured prompt for OpenAI."""
        
        # Truncate text if too long (keep first 4000 characters)
        truncated_text = text[:4000] if len(text) > 4000 else text
        
        prompt = f"""
Analyze this automotive industry article and provide structured JSON output with the following fields:

Article Details:
- Title: {title}
- Publisher: {publisher}
- URL: {url}
- Text: {truncated_text}

Required JSON Response Format:
{{
    "ai_title": "Create a concise, engaging title (max 15 words)",
    "title_original": "{title}",
    "publisher": "{publisher}",
    "published_at": "YYYY-MM-DDTHH:MM:SSZ (estimate if not provided)",
    "industry": "automotive",
    "category": "one of: product_launch, regulation, corporate_financial, technology, recall, market_sales, opinion",
    "short_summary": "Brief summary (max 120 words)",
    "long_summary": "Detailed summary (300-500 words exactly - count words carefully)",
    "sentiment_label": "positive, neutral, or negative",
    "sentiment_score": 0.0-1.0,
    "entities": [
        {{"type": "company|product|person", "name": "entity_name"}}
    ],
    "tags": ["tag1", "tag2", "tag3"]
}}

IMPORTANT REQUIREMENTS:
1. long_summary must be EXACTLY 300-500 words (count words)
2. short_summary must be max 120 words
3. ai_title must be max 15 words
4. category must be one of the specified values
5. sentiment_score must be 0.0-1.0
6. Respond ONLY with valid JSON, no additional text
7. Base analysis on the provided text, don't hallucinate facts
8. If information is unclear, use "unknown" or reasonable defaults
"""
        return prompt
    
    def _parse_ai_response(self, ai_response: str, title: str, text: str, url: str, publisher: str) -> Dict[str, Any]:
        """Parse and validate AI response."""
        try:
            # Clean the response
            ai_response = ai_response.strip()
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:]
            if ai_response.endswith('```'):
                ai_response = ai_response[:-3]
            
            # Parse JSON
            data = json.loads(ai_response)
            
            # Validate required fields
            required_fields = [
                'ai_title', 'category', 'short_summary', 'long_summary',
                'sentiment_label', 'sentiment_score', 'entities', 'tags'
            ]
            
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate category
            if data['category'] not in [cat.value for cat in CategoryEnum]:
                logger.warning("Invalid category from AI", category=data['category'])
                data['category'] = 'opinion'  # Default fallback
            
            # Validate sentiment
            if data['sentiment_label'] not in [sent.value for sent in SentimentEnum]:
                logger.warning("Invalid sentiment from AI", sentiment=data['sentiment_label'])
                data['sentiment_label'] = 'neutral'
            
            # Validate sentiment score
            try:
                data['sentiment_score'] = float(data['sentiment_score'])
                if not 0.0 <= data['sentiment_score'] <= 1.0:
                    data['sentiment_score'] = 0.5
            except (ValueError, TypeError):
                data['sentiment_score'] = 0.5
            
            # Validate word counts
            long_summary_words = len(data['long_summary'].split())
            if not 300 <= long_summary_words <= 500:
                logger.warning("Long summary word count invalid", 
                             words=long_summary_words, text=data['long_summary'][:100])
                # Truncate or pad as needed
                if long_summary_words < 300:
                    data['long_summary'] += " " * (300 - long_summary_words)
                elif long_summary_words > 500:
                    words = data['long_summary'].split()[:500]
                    data['long_summary'] = " ".join(words)
            
            short_summary_words = len(data['short_summary'].split())
            if short_summary_words > 120:
                logger.warning("Short summary too long", words=short_summary_words)
                words = data['short_summary'].split()[:120]
                data['short_summary'] = " ".join(words)
            
            # Validate entities
            if not isinstance(data['entities'], list):
                data['entities'] = []
            
            validated_entities = []
            for entity in data['entities']:
                if isinstance(entity, dict) and 'type' in entity and 'name' in entity:
                    if entity['type'] in [et.value for et in EntityTypeEnum]:
                        validated_entities.append(entity)
            
            data['entities'] = validated_entities
            
            # Validate tags
            if not isinstance(data['tags'], list):
                data['tags'] = []
            
            # Add metadata
            data['title_original'] = title
            data['publisher'] = publisher
            data['industry'] = 'automotive'
            
            # Store raw response for auditing
            data['ai_raw_response'] = {
                'raw_response': ai_response,
                'model': self.model,
                'timestamp': str(datetime.utcnow())
            }
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error("Invalid JSON from AI", error=str(e), response=ai_response[:200])
            raise ValueError(f"Invalid JSON response from AI: {str(e)}")
        
        except Exception as e:
            logger.error("Error parsing AI response", error=str(e))
            raise
    
    def _count_words(self, text: str) -> int:
        """Count words in text."""
        return len(text.split())
    
    def _validate_entities(self, entities: List[Dict]) -> List[Dict]:
        """Validate and clean entities."""
        validated = []
        for entity in entities:
            if (isinstance(entity, dict) and 
                'type' in entity and 'name' in entity and
                entity['type'] in [et.value for et in EntityTypeEnum]):
                validated.append(entity)
        return validated


# Standalone function for use in workers
async def process_article_with_ai(title: str, text: str, url: str, publisher: str) -> Dict[str, Any]:
    """Standalone function to process article with AI."""
    processor = AIProcessor()
    return await processor.process_article(title, text, url, publisher)


# Import datetime here to avoid circular imports
from datetime import datetime
