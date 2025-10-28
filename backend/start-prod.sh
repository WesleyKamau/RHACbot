#!/bin/bash
# Production-like local server using Gunicorn

# Set default port if not provided
PORT=${PORT:-4000}

echo "Starting RHACbot backend with Gunicorn on port $PORT..."
echo "This is a production-grade WSGI server (no warnings!)"
echo ""

# Run with 4 workers for better concurrency
gunicorn -w 4 -b 0.0.0.0:$PORT app:app --access-logfile - --error-logfile -
