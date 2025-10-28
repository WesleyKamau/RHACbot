# Production-like local server using Gunicorn (Windows)

# Set default port if not provided
$PORT = if ($env:PORT) { $env:PORT } else { "4000" }

Write-Host "Starting RHACbot backend with Gunicorn on port $PORT..." -ForegroundColor Green
Write-Host "This is a production-grade WSGI server (no warnings!)" -ForegroundColor Green
Write-Host ""

# Run with 4 workers for better concurrency
gunicorn -w 4 -b "0.0.0.0:$PORT" app:app --access-logfile - --error-logfile -
