# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import uuid  # For generating unique message IDs
import logging
from config import Config
import os
from pathlib import Path
from pymongo import MongoClient, errors as pymongo_errors
from api_types import (
    HealthCheckResponse, AddChatRequest, AddChatResponse, AuthRequest,
    AuthResponse, AuthErrorResponse, MessageSendSummary, MessageFailure,
    SendMessageSuccessResponse, SendMessagePartialResponse, ApiError,
    is_valid_building_id, validate_message_body, is_valid_region_target
)

import re

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)


# CORS origin validation function
def is_allowed_origin(origin):
    """Check if the origin is allowed to make CORS requests"""
    allowed_patterns = [
        r'^https://rhacbot\.wesleykamau\.com$',
        r'^https://www\.rhacbot\.wesleykamau\.com$',
        r'^https://rhacbot-.*\.vercel\.app$',  # Vercel preview deployments
        r'^https://.*-wesley-kamaus-projects\.vercel\.app$',  # Vercel project URLs
        r'^http://localhost:3000$',
        r'^http://localhost:3001$'
    ]
    
    if origin:
        for pattern in allowed_patterns:
            if re.match(pattern, origin):
                return True
    return False


# Configure CORS at module level so it works with Gunicorn
# Must be done BEFORE init_app() and BEFORE routes are defined
CORS(app, 
     resources={r"/api/*": {
         "origins": is_allowed_origin,  # Use function for dynamic origin checking
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept"],
         "supports_credentials": True,
         "expose_headers": ["Content-Type"],
         "max_age": 3600
     }}
)

# Module-level defaults so module can be imported without side-effects
GROUPME_API_URL = 'https://api.groupme.com/v3'
buildings_data = []
chats_collection = None
_fallback_chats = []


def init_app():
    """Perform application initialization that should only run in the main process.

    This moves environment validation, config load, buildings file load,
    and MongoDB connection out of import-time execution so the module can be
    imported safely (for testing, linting, or use with WSGI servers).
    
    NOTE: This is called at module level below to ensure Gunicorn also runs it.
    """
    global buildings_data, chats_collection, _fallback_chats

    # Validate and load configuration (warning-only in dev, raises in prod if enabled)
    try:
        Config.validate(fail_on_missing=False)
    except Exception:
        logger.exception("Configuration validation raised an exception")

    app.config.from_object(Config)
    # Ensure an application-level environment and computed DB name are available
    # Use a distinct key 'APP_ENV' to avoid colliding with Flask's internal 'ENV'
    app_env = getattr(Config, 'ENV', 'dev')
    app.config['APP_ENV'] = app_env
    # Compute the DB name using the helper added to Config
    try:
        app.config['MONGODB_DB_NAME'] = Config.MONGODB_DB_NAME()
    except Exception:
        # Fall back gracefully if method is missing for older installs
        app.config['MONGODB_DB_NAME'] = app.config.get('MONGODB_DB', 'rhac_db')

    # Load buildings data safely. Try multiple locations (app root, module dir, cwd)
    try:
        tried = []
        buildings_path = None
        candidates = [
            Path(app.root_path) / 'buildings.json',
            Path(__file__).resolve().parent / 'buildings.json',
            Path.cwd() / 'buildings.json',
        ]
        for p in candidates:
            tried.append(str(p))
            if p.exists():
                buildings_path = p
                break

        if buildings_path is None:
            raise FileNotFoundError(f"buildings.json not found. Tried: {', '.join(tried)}")

        with buildings_path.open('r', encoding='utf-8') as f:
            buildings_data = json.load(f)
        logger.info("Loaded buildings.json from %s", buildings_path)
    except FileNotFoundError as e:
        logger.warning("%s", e)
        buildings_data = []
    except json.JSONDecodeError as e:
        logger.error("Failed to parse buildings.json (%s): %s", buildings_path if 'buildings_path' in locals() else 'unknown', e)
        buildings_data = []

    # MongoDB setup with safe fallbacks
    chats_collection = None
    _fallback_chats = []
    if app.config.get('MONGODB_URI'):
        try:
            client = MongoClient(app.config['MONGODB_URI'], serverSelectionTimeoutMS=5000)
            client.admin.command('ping')
            dbname = app.config.get('MONGODB_DB_NAME') or app.config.get('MONGODB_DB') or 'rhac_db'
            logger.info("Connected to MongoDB: %s (env=%s)", dbname, app.config.get('APP_ENV'))
            db = client[dbname]
            chats_collection = db['chats']
            
        except pymongo_errors.PyMongoError:
            logger.exception("Failed to connect to MongoDB; falling back to in-memory storage")
            chats_collection = None
            _fallback_chats = []
    else:
        logger.warning("MONGODB_URI not set; using in-memory fallback storage for chats")

    # Final summary of which storage is active and which DB name is configured.
    effective_dbname = app.config.get('MONGODB_DB_NAME') or app.config.get('MONGODB_DB') or 'rhac_db'
    if chats_collection is not None:
        logger.info("Chat storage: MongoDB (database=%s, env=%s)", effective_dbname, app.config.get('APP_ENV'))
        # Also print to stdout so it's obvious when running app directly
        print(f"Using MongoDB database: {effective_dbname} (env={app.config.get('APP_ENV')})")
    else:
        logger.info("Chat storage: in-memory fallback (no MongoDB). Configured DB name would be: %s", effective_dbname)
        print(f"Using in-memory chat storage (no MongoDB). Configured DB name would be: {effective_dbname}")


# Root route - redirect to health check or provide API info
@app.route('/', methods=['GET'])
def root():
    """Root endpoint - provides basic API information."""
    return jsonify({
        'name': 'RHACbot API',
        'version': '1.0.0',
        'status': 'online',
        'endpoints': {
            'health': '/api/health',
            'buildings': '/api/buildings',
            'add_chat': '/api/chats/add',
            'send_message': '/api/messages/send',
            'auth': '/api/auth'
        }
    }), 200


# Health check endpoint to wake up the backend
@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint to verify backend is running."""
    response = HealthCheckResponse(status="ok", message="Backend is healthy")
    return jsonify(response.to_dict()), 200


# Endpoint to add a floor chat
@app.route('/api/chats/add', methods=['POST'])
def add_floor_chat():
    try:
        # Parse and validate request
        chat_request = AddChatRequest.from_dict(request.json or {})
        validation_error = chat_request.validate()
        if validation_error:
            error_response = ApiError(error=validation_error)
            return jsonify(error_response.to_dict()), 400

        # Log payload at INFO level for observability
        logger.info("add_floor_chat payload: groupme_link=%s, building_id=%s, floor_number=%s",
                    chat_request.groupme_link, chat_request.building_id, chat_request.floor_number)

        # Extract group_id and share_token from the GroupMe link
        group_info = extract_group_id_and_token_from_link(chat_request.groupme_link)
        if not group_info:
            error_response = ApiError(error='Invalid GroupMe link')
            return jsonify(error_response.to_dict()), 400

        group_id, share_token = group_info
        print(f'Group ID: {group_id}, Share Token: {share_token}')

        # Check if the chat already exists in the database or fallback storage
        if chats_collection is not None:
            existing_chat = chats_collection.find_one({
                'groupme_id': group_id,
                'env': app.config.get('APP_ENV')
            })
        else:
            existing_chat = next((c for c in _fallback_chats 
                                if c['groupme_id'] == group_id 
                                and c.get('env') == app.config.get('APP_ENV')), None)

        if existing_chat:
            logger.info("GroupMe ID already exists in storage: %s", group_id)
            error_response = ApiError(error='Chat already exists')
            return jsonify(error_response.to_dict()), 400

        # Join the group using the GroupMe API
        joined = join_group(group_id, share_token)
        if not joined:
            error_response = ApiError(error='Failed to join the GroupMe group')
            return jsonify(error_response.to_dict()), 500

        # Add the chat to the database
        chat = add_chat(group_id, chat_request.building_id, chat_request.floor_number)
        if chat is None:
            error_response = ApiError(error='Failed to add chat')
            return jsonify(error_response.to_dict()), 500

        # Return success response
        success_response = AddChatResponse(
            message='Chat added successfully',
            chat_id=str(chat.get('_id', ''))
        )
        return jsonify(success_response.to_dict()), 200

    except Exception as e:
        logger.exception("Error in add_floor_chat")
        error_response = ApiError(error='Internal server error', details=str(e))
        return jsonify(error_response.to_dict()), 500

# Endpoint to send messages to chats based on building IDs or regions
@app.route('/api/messages/send', methods=['POST'])
def send_messages():
    # Access form data
    building_ids = request.form.getlist('building_ids')
    message_body = request.form.get('message_body')
    image_file = request.files.get('image_file')
    regions = request.form.getlist('regions')

    # Validate executive/admin password server-side
    password = request.form.get('password') or request.form.get('auth')
    if not password or password != app.config.get('ADMIN_PASSWORD'):
        logger.warning("Unauthorized send_messages attempt")
        return jsonify({'error': 'Unauthorized'}), 401

    if not (building_ids or regions) or not message_body:
        return jsonify({'error': 'Missing building_ids or regions, or message_body'}), 400

    # Validate message body using helper function
    message_error = validate_message_body(message_body)
    if message_error:
        return jsonify({'error': message_error}), 400

    # Determine building_ids based on regions or provided list
    if building_ids:
        # Ensure building_ids is a list of integers and validate them
        try:
            building_ids = [int(bid) for bid in building_ids]
            # Validate each building ID
            for bid in building_ids:
                if not is_valid_building_id(bid):
                    return jsonify({'error': f'Invalid building_id: {bid}'}), 400
        except ValueError:
            return jsonify({'error': 'building_ids must be integers'}), 400
    else:
        # Handle regions selection - validate region targets
        for region in regions:
            if not is_valid_region_target(region):
                return jsonify({'error': f'Invalid region: {region}'}), 400
        
        if 'all' in regions:
            # Use all building IDs
            building_ids = [building['id'] for building in buildings_data]
        else:
            # Get building IDs for the specified regions
            building_ids = [building['id'] for building in buildings_data if building['region'] in regions]
            if not building_ids:
                return jsonify({'error': f'No buildings found in regions {regions}'}), 400

    # Map building_id -> groupme_ids
    group_map = get_groupme_map_by_buildings(building_ids)

    # If no group chats found for any building, return 404
    total_groups = sum(len(v) for v in group_map.values())
    if total_groups == 0:
        return jsonify({'error': 'No group chats found for the provided building IDs'}), 404

    # If an image file is provided, upload it to GroupMe Image Service
    image_url = None
    if image_file:
        image_url = upload_image_to_groupme(image_file)
        if not image_url:
            return jsonify({'error': 'Failed to upload image to GroupMe'}), 500

    # Send messages grouped by building and collect results per building
    per_building_results = []
    overall_successes = 0
    overall_failures = 0

    # Build a quick lookup for building names
    building_lookup = {b['id']: b.get('name', '') for b in buildings_data}

    for bid, group_entries in group_map.items():
        # Each group entry may be a dict with group_id and floor_number (new structure),
        # or a plain group id string for backward compatibility.
        building_entry = {'building_id': bid, 'building_name': building_lookup.get(bid, ''), 'results': []}
        for g in group_entries:
            if isinstance(g, dict):
                gid = g.get('group_id')
                floor_number = g.get('floor_number')
            else:
                gid = g
                floor_number = None

            res = send_message_to_group(gid, message_body, image_url)
            entry = {
                'group_id': gid,
                'floor_number': floor_number,
                'success': bool(res.get('success')),
                'status_code': res.get('status_code'),
                'error': res.get('error'),
            }
            building_entry['results'].append(entry)
            if entry['success']:
                overall_successes += 1
            else:
                overall_failures += 1

        per_building_results.append(building_entry)

    total = overall_successes + overall_failures
    if total == 0:
        error_response = ApiError(error='No group chats found')
        return jsonify(error_response.to_dict()), 404

    # Build summary
    summary = MessageSendSummary(total=total, sent=overall_successes, failed=overall_failures)

    if overall_failures == 0:
        # All successful
        response = SendMessageSuccessResponse(
            message='All messages sent successfully',
            summary=summary
        )
        return jsonify(response.to_dict()), 200
    elif overall_successes > 0:
        # Partial success - collect failures
        failures = []
        for building_entry in per_building_results:
            building_name = building_entry.get('building_name', 'Unknown')
            for result in building_entry.get('results', []):
                if not result.get('success'):
                    failure = MessageFailure(
                        chat_id=result.get('group_id', ''),
                        building=building_name,
                        floor=result.get('floor_number', 0),
                        error=result.get('error', 'Unknown error')
                    )
                    failures.append(failure)
        
        response = SendMessagePartialResponse(
            message='Some messages were sent successfully',
            summary=summary,
            failures=failures
        )
        return jsonify(response.to_dict()), 207
    else:
        # All failed
        error_response = ApiError(
            error='No messages were sent',
            details=f'{total} attempts failed'
        )
        return jsonify(error_response.to_dict()), 502


@app.route('/api/buildings', methods=['GET'])
def get_buildings():
    return jsonify({'buildings': buildings_data}), 200


@app.route('/api/auth', methods=['POST'])
def auth():
    try:
        data = request.get_json() or {}
        auth_request = AuthRequest.from_dict(data)
        
        if not auth_request.password:
            # Also check form data as fallback
            auth_request.password = request.form.get('password', '')
        
        if not auth_request.password:
            error_response = AuthErrorResponse(error='Missing password')
            return jsonify(error_response.to_dict()), 400
        
        if auth_request.password == app.config.get('ADMIN_PASSWORD'):
            success_response = AuthResponse(message='Authenticated')
            return jsonify(success_response.to_dict()), 200
        else:
            error_response = AuthErrorResponse(error='Unauthorized')
            return jsonify(error_response.to_dict()), 401
            
    except Exception as e:
        logger.exception("Error in auth")
        error_response = AuthErrorResponse(error='Authentication failed')
        return jsonify(error_response.to_dict()), 500

def upload_image_to_groupme(image_file):
    url = 'https://image.groupme.com/pictures'
    headers = {
        'X-Access-Token': app.config.get('GROUPME_ACCESS_TOKEN'),
        'Content-Type': image_file.content_type  # Use the uploaded file's content type
    }

    if not headers['X-Access-Token']:
        logger.error("GROUPME_ACCESS_TOKEN not configured; cannot upload image")
        return None

    try:
        response = requests.post(url, headers=headers, data=image_file.read(), timeout=10)
        response.raise_for_status()
        response_json = response.json()
        return response_json.get('payload', {}).get('picture_url')
    except requests.RequestException as e:
        logger.exception("Failed to upload image to GroupMe: %s", e)
        return None

# Helper function to extract group_id and share_token from GroupMe link
def extract_group_id_and_token_from_link(link):
    # Example link: https://groupme.com/join_group/12345678/SHARE_TOKEN
    try:
        parts = link.strip('/').split('/')
        index = parts.index('join_group')
        group_id = parts[index + 1]
        share_token = parts[index + 2]
        return group_id, share_token
    except (ValueError, IndexError):
        return None

# Helper function to join a group using the GroupMe API
def join_group(group_id, share_token):
    url = f'{GROUPME_API_URL}/groups/{group_id}/join/{share_token}'
    token = app.config.get('GROUPME_ACCESS_TOKEN')
    if not token:
        logger.error("GROUPME_ACCESS_TOKEN is not set; cannot join group %s", group_id)
        return False

    params = {'token': token}
    try:
        response = requests.post(url, params=params, timeout=10)
        # Log a concise, structured summary of the response for debugging.
        try:
            resp_text = response.text
        except Exception:
            resp_text = '<unreadable response body>'

        # Try to decode JSON safely for richer logs
        resp_json = None
        try:
            resp_json = response.json()
        except ValueError:
            # Not JSON; ignore
            pass

        # Always log a short summary so failures are visible in normal runs.
        logger.info("join_group response: status=%s, reason=%s", response.status_code, getattr(response, 'reason', None))

        # Only log headers/body details when the application is running in debug mode
        # to avoid leaking potentially sensitive information in production logs.
        is_debug = bool(app.debug or app.config.get('DEBUG') or os.getenv('FLASK_DEBUG', '').lower() in ('1', 'true', 'yes', 'on'))
        if is_debug:
            logger.debug(
                "join_group details: headers=%s, body_preview=%s",
                dict(list(response.headers.items())[:5]),  # limited headers
                (resp_json if resp_json is not None else (resp_text[:1000] if resp_text else '')),
            )

        if response.status_code in (200, 201):
            logger.info("Successfully joined group %s", group_id)
            return True
        else:
            logger.error("Failed to join group %s: %s %s", group_id, response.status_code, response.text)
            return False
    except requests.RequestException:
        logger.exception("Network error while joining group %s", group_id)
        return False

# Helper function to add a chat to the database
def add_chat(groupme_id, building_id, floor_number):
    chat = {
        'groupme_id': groupme_id,
        'building_id': building_id,
        'floor_number': floor_number,
        # Tag the chat with the application environment to avoid mixing dev/prod data
        'env': app.config.get('APP_ENV')
    }
    if chats_collection is not None:
        try:
            result = chats_collection.insert_one(chat)
            if result.inserted_id:
                chat['_id'] = str(result.inserted_id)
                logger.info("Chat added to database: %s", chat)
                return chat
        except Exception:
            logger.exception("Failed to insert chat into MongoDB")
            return None
    else:
        # Fallback in-memory storage (development / offline mode)
        _fallback_chats.append(chat)
        logger.info("Chat added to in-memory storage: %s", chat)
        return chat


# Helper function to get groupme_ids by building IDs
def get_groupme_ids_by_buildings(building_ids):
    groupme_ids = []
    if chats_collection is not None:
        try:
            # Filter by active environment
            chats = chats_collection.find({'building_id': {'$in': building_ids}, 'env': app.config.get('APP_ENV')})
            for chat in chats:
                groupme_ids.append(chat['groupme_id'])
        except Exception:
            logger.exception("Error querying chats from MongoDB; returning empty list")
            return []
    else:
        groupme_ids = [c['groupme_id'] for c in _fallback_chats if c.get('building_id') in building_ids and c.get('env') == app.config.get('APP_ENV')]

    return groupme_ids


def get_groupme_map_by_buildings(building_ids):
    """Return a mapping of building_id -> list of group entries.

    Each entry is a dict with keys:
      - 'group_id' (str)
      - 'floor_number' (int|None)

    This preserves backward compatibility (values may still be plain group_id strings
    when older code populates the structure), but new code will return rich entries.
    """
    mapping = {bid: [] for bid in building_ids}
    if chats_collection is not None:
        try:
            # Filter by the active application environment
            chats = chats_collection.find({'building_id': {'$in': building_ids}, 'env': app.config.get('APP_ENV')})
            for chat in chats:
                bid = chat.get('building_id')
                gid = chat.get('groupme_id')
                floor = chat.get('floor_number')
                if bid in mapping:
                    mapping[bid].append({'group_id': gid, 'floor_number': floor})
        except Exception:
            logger.exception("Error querying chats from MongoDB for mapping; returning empty mapping")
            return mapping
    else:
        for c in _fallback_chats:
            # Respect environment when using fallback storage
            if c.get('env') != app.config.get('APP_ENV'):
                continue
            bid = c.get('building_id')
            if bid in mapping:
                mapping[bid].append({'group_id': c.get('groupme_id'), 'floor_number': c.get('floor_number')})

    return mapping

# Function to send a message directly to a GroupMe group
def send_message_to_group(group_id, text, image_url=None):
    url = f'{GROUPME_API_URL}/groups/{group_id}/messages'
    token = app.config.get('GROUPME_ACCESS_TOKEN')
    if not token:
        logger.error("GROUPME_ACCESS_TOKEN is not set; cannot send message to %s", group_id)
        return {'success': False, 'group_id': group_id, 'status_code': None, 'error': 'GROUPME_ACCESS_TOKEN not set'}

    params = {'token': token}
    message_data = {
        'message': {
            'source_guid': str(uuid.uuid4()),
            'text': text,
        }
    }
    if image_url:
        message_data['message']['attachments'] = [
            {
                'type': 'image',
                'url': image_url
            }
        ]
    try:
        response = requests.post(url, params=params, json=message_data, timeout=10)
        if response.status_code != 201:
            logger.error("Failed to send message to group %s: %s %s", group_id, response.status_code, response.text)
            return {
                'success': False,
                'group_id': group_id,
                'status_code': response.status_code,
                'error': response.text,
            }
        logger.info("Message sent to group %s", group_id)
        return {'success': True, 'group_id': group_id, 'status_code': response.status_code}
    except requests.RequestException as e:
        logger.exception("Network error while sending message to group %s", group_id)
        return {'success': False, 'group_id': group_id, 'status_code': None, 'error': str(e)}


# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handles 404 errors - don't log for security scanners."""
    # Only log 404s for API endpoints (ignore scanner noise)
    if request.path.startswith('/api/'):
        logger.warning("404 on API endpoint: %s", request.path)
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Handles 405 Method Not Allowed errors."""
    logger.warning("405 Method Not Allowed: %s %s", request.method, request.path)
    return jsonify({'error': 'Method not allowed'}), 405


@app.errorhandler(500)
def internal_error(error):
    """Handles 500 Internal Server errors."""
    logger.exception("500 Internal Server Error")
    return jsonify({'error': 'Internal server error'}), 500


# Initialize app at module level so Gunicorn can load config and data
# This must happen AFTER routes are defined but will run when module is imported
init_app()


if __name__ == '__main__':
    # Configure debug mode via FLASK_DEBUG env var (truthy values enable debug)
    import os

    flask_debug_env = os.getenv('FLASK_DEBUG', '')
    debug = flask_debug_env.lower() in ('1', 'true', 'yes', 'on')

    # Prefer PORT for PaaS (Render sets PORT). Fall back to FLASK_RUN_PORT, then to 4000 for local dev.
    port = int(os.getenv('PORT', os.getenv('FLASK_RUN_PORT', '4000')))

    # Bind to 0.0.0.0 so the server is reachable from the host/container network (required by Render).
    host = os.getenv('FLASK_RUN_HOST', '0.0.0.0')

    # Note: init_app() is already called at module level above
    # No need to call it again here

    # Warning: Flask's built-in server is for development only.
    # For production, use: gunicorn app:app
    # Only enable the reloader when debug mode is explicitly requested
    print("⚠️  WARNING: Using Flask development server. For production, use Gunicorn.")
    print(f"   To run in production mode: gunicorn -w 4 -b {host}:{port} app:app")
    app.run(host=host, port=port, debug=debug, use_reloader=debug)
