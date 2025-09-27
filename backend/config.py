"""
Configuration settings for the news ingestion pipeline.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Database settings
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "news_app_autos_v1"
    
    # Redis settings
    redis_url: str = "redis://localhost:6379/0"
    
    # OpenAI settings
    openai_api_key: str
    openai_model: str = "gpt-3.5-turbo"
    openai_max_tokens: int = 2000
    openai_temperature: float = 0.3
    
    # RSS settings
    rss_url: str = "https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=automotive"
    poll_interval_seconds: int = 120
    
    # API settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4
    
    # Rate limiting
    rate_limit_per_minute: int = 100
    
    # Scraping settings
    max_retries: int = 3
    request_timeout: int = 30
    min_article_length: int = 250
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables


# Global settings instance
settings = Settings()
