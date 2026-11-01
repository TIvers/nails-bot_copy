from app.settings import settings

# Broker settings
broker_url = settings.celery_broker_url
result_backend = settings.celery_result_backend

# Task settings
task_serializer = 'json'
accept_content = ['json']
result_serializer = 'json'
timezone = 'UTC'
enable_utc = True

# Worker settings
worker_prefetch_multiplier = 1
task_acks_late = True
worker_max_tasks_per_child = 1000

# Task execution settings
task_track_started = True
task_time_limit = 30 * 60  # 30 minutes
task_soft_time_limit = 25 * 60  # 25 minutes

# Result backend settings
result_expires = 3600  # 1 hour

# Task routing
task_routes = {
    'app.tasks.parse_and_store': {'queue': 'default'},
}