"""
Gunicorn configuration for RHACbot backend
Filters out 404 errors from scanner bots while keeping successful API calls
"""
import logging
import os


class SuccessOnlyAccessLogFilter(logging.Filter):
    """Filter to only show successful requests (2xx, 3xx) and API errors (4xx, 5xx on /api/*)"""
    
    def filter(self, record):
        # Get the log message
        msg = record.getMessage()
        
        # Always show 2xx and 3xx status codes (successful requests)
        if '" 2' in msg or '" 3' in msg:
            return True
        
        # Show 4xx and 5xx only if they're on API endpoints
        if ('/api/' in msg) and ('" 4' in msg or '" 5' in msg):
            return True
        
        # Filter out everything else (404s for scanners, etc.)
        return False


# Gunicorn config
bind = f"0.0.0.0:{os.getenv('PORT', '4000')}"
workers = 2
errorlog = "-"
loglevel = "info"
accesslog = "-"
access_log_format = '%(h)s "%(r)s" %(s)s %(b)s'

# Apply custom filter to access log
logconfig_dict = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'success_only': {
            '()': SuccessOnlyAccessLogFilter,
        }
    },
    'formatters': {
        'generic': {
            'format': '%(asctime)s [%(process)d] [%(levelname)s] %(message)s',
            'datefmt': '[%Y-%m-%d %H:%M:%S %z]',
            'class': 'logging.Formatter'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'generic',
            'stream': 'ext://sys.stdout'
        },
        'error_console': {
            'class': 'logging.StreamHandler',
            'formatter': 'generic',
            'stream': 'ext://sys.stderr'
        },
        'access_console': {
            'class': 'logging.StreamHandler',
            'formatter': 'generic',
            'filters': ['success_only'],
            'stream': 'ext://sys.stdout'
        }
    },
    'loggers': {
        'gunicorn.error': {
            'level': 'INFO',
            'handlers': ['error_console'],
            'propagate': False,
            'qualname': 'gunicorn.error'
        },
        'gunicorn.access': {
            'level': 'INFO',
            'handlers': ['access_console'],
            'propagate': False,
            'qualname': 'gunicorn.access'
        }
    },
    'root': {
        'level': 'INFO',
        'handlers': ['console']
    }
}
