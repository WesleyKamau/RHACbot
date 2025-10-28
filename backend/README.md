# Backend (RHACbot Panel)

This folder contains the Flask backend for the RHACbot Control Panel. It exposes REST endpoints to add GroupMe chats, send messages, and manage buildings data.

## Quick Start

### Development Mode (Flask dev server)

1. Create and activate a virtual environment, then install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and fill in values for development (see environment section below).

3. Run the app (non-debug mode by default):

```powershell
python app.py
```

⚠️ **Note**: This uses Flask's development server and will show a warning. This is fine for local development but **never use this in production**.

### Production Mode (Gunicorn)

For a production-like experience locally or in production, use Gunicorn:

**PowerShell (Windows):**
```powershell
.\start-prod.ps1
```

**Bash (Linux/Mac):**
```bash
./start-prod.sh
```

Or run Gunicorn directly:
```bash
gunicorn -w 4 -b 0.0.0.0:4000 app:app
```

This eliminates the Flask development server warning and provides better performance.

## Configuration and environment variables

- Copy `.env.example` to `.env` (this repo already has `.env` ignored by git).
- Important variables:
  - GROUPME_ACCESS_TOKEN — required to call GroupMe APIs
  - MONGODB_URI — optional for local dev; if missing the app falls back to in-memory storage
  - MONGODB_DB — optional (default: rhac_db)
  - SECRET_KEY — cryptographic secret; generate a secure value for production
  - EXECUTIVE_PASSWORD — admin password for the control panel (do not put this in client-side env)

## Security notes

- Never expose `SECRET_KEY` or `EXECUTIVE_PASSWORD` to the frontend. If you see a `REACT_APP_` prefixed environment variable holding a secret, move it to the backend.
- If secrets were previously committed to git, rotate them immediately.

## Production Deployment

### Using Gunicorn (Recommended)

Gunicorn is a production-grade WSGI server that eliminates the Flask development server warnings.

**On Render/Heroku** (already configured in `Procfile`):
```
web: gunicorn app:app
```

**Locally or on VPS**:
```bash
gunicorn -w 4 -b 0.0.0.0:4000 app:app
```

Workers (`-w 4`): Use `(2 * CPU_cores) + 1` as a starting point.

### Behind a Reverse Proxy

For production, run Gunicorn behind Nginx or similar:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Other Production Recommendations

- Use a production WSGI server (Gunicorn, uWSGI, or Waitress on Windows)
- Run with `FLASK_DEBUG` unset or false
- Store secrets in a secrets manager (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
- Use a process manager (systemd, supervisor) or container orchestration for reliability

## Health and debugging

- The backend exposes `/api/buildings` and `/api/auth` endpoints for basic operations.
- The application generates secure temporary secrets when `SECRET_KEY` or `EXECUTIVE_PASSWORD` are missing, but those are intended only for development.

If you want, I can add a `systemd` unit example or a Dockerfile for deployment.
