"""
MongoDB models and schemas for the news ingestion pipeline.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from bson import ObjectId
from enum import Enum


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


class CategoryEnum(str, Enum):
    """Allowed article categories."""
    PRODUCT_LAUNCH = "product_launch"
    REGULATION = "regulation"
    CORPORATE_FINANCIAL = "corporate_financial"
    TECHNOLOGY = "technology"
    RECALL = "recall"
    MARKET_SALES = "market_sales"
    OPINION = "opinion"


class SentimentEnum(str, Enum):
    """Sentiment labels."""
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class EntityTypeEnum(str, Enum):
    """Entity types for named entity recognition."""
    COMPANY = "company"
    PRODUCT = "product"
    PERSON = "person"


class Entity(BaseModel):
    """Named entity extracted from article."""
    type: EntityTypeEnum
    name: str


class Source(BaseModel):
    """RSS source configuration."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    industry: str = "automotive"
    source_type: str = "google_rss"
    url: str
    config: Dict[str, Any] = {"poll_interval_seconds": 120}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_polled: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class RawArticle(BaseModel):
    """Raw article data from RSS and scraping."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    source_id: PyObjectId
    feed_item_id: str  # Unique identifier from RSS item
    url: str
    raw_xml_item: str
    raw_html: Optional[str] = None
    scraped_text: Optional[str] = None
    scraped_at: Optional[datetime] = None
    fetch_status: Literal["fetched", "failed"] = "fetched"
    fetch_error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class AIArticle(BaseModel):
    """AI-enriched article data."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    raw_article_id: PyObjectId
    ai_title: str = Field(..., max_length=200)  # <= 15 words
    title_original: str
    publisher: str
    published_at: datetime
    industry: str = "automotive"
    category: CategoryEnum
    short_summary: str = Field(..., max_length=600)  # <= 120 words
    long_summary: str = Field(..., min_length=300, max_length=2500)  # 300-500 words
    sentiment_label: SentimentEnum
    sentiment_score: float = Field(..., ge=0.0, le=1.0)
    entities: List[Entity] = []
    tags: List[str] = []
    ai_raw_response: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class AppConfig(BaseModel):
    """Application configuration stored in database."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    config_name: str
    payload: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# API Response Models
class ArticleResponse(BaseModel):
    """Article response for API endpoints."""
    id: str
    ai_title: str
    title_original: str
    publisher: str
    published_at: datetime
    industry: str
    category: str
    short_summary: str
    long_summary: str
    sentiment_label: str
    sentiment_score: float
    entities: List[Entity]
    tags: List[str]
    url: str
    created_at: datetime

    class Config:
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    items: List[ArticleResponse]
    total: int
    page: int
    per_page: int
    pages: int


class WebSocketMessage(BaseModel):
    """WebSocket message format."""
    type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
