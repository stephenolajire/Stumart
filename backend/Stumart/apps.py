# Stumart/apps.py
from django.apps import AppConfig
import os

class StumartConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Stumart'

    def ready(self):
        """Start scheduler when Django starts"""
        # Only start scheduler in main process, not in reloader
        if os.environ.get('RUN_MAIN') != 'true':
            return
        
        from . import scheduler
        scheduler.start()
