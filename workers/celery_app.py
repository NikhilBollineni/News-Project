"""
Celery application configuration for task queue.
"""
from celery import Celery
from backend.config import settings
import structlog

logger = structlog.get_logger(__name__)

# Create Celery app
celery_app = Celery(
    "news_ingestion",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        'workers.rss_poller',
        'workers.ai_processor',
        'workers.notifications'
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    task_soft_time_limit=240,  # 4 minutes
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    result_expires=3600,  # 1 hour
    task_routes={
        'workers.rss_poller.*': {'queue': 'rss_polling'},
        'workers.ai_processor.*': {'queue': 'ai_processing'},
        'workers.notifications.*': {'queue': 'notifications'},
    },
    task_default_queue='default',
    task_default_exchange='default',
    task_default_exchange_type='direct',
    task_default_routing_key='default',
    beat_schedule={
        'poll-rss-feeds': {
            'task': 'workers.rss_poller.poll_rss_feeds',
            'schedule': settings.poll_interval_seconds,
        },
    },
)

# Configure logging
celery_app.conf.update(
    worker_log_format='[%(asctime)s: %(levelname)s/%(processName)s] %(message)s',
    worker_task_log_format='[%(asctime)s: %(levelname)s/%(processName)s][%(task_name)s(%(task_id)s)] %(message)s',
)

logger.info("Celery app configured", 
           broker=settings.redis_url, 
           poll_interval=settings.poll_interval_seconds)
