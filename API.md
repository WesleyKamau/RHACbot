# RHACbot API Documentation

This repository uses [OpenAPI 3.0](https://swagger.io/specification/) specification to document the backend API.

## Viewing the API Documentation

### Option 1: Online Swagger Editor (Recommended)
1. Go to [Swagger Editor](https://editor.swagger.io/)
2. Copy the contents of `openapi.yaml` and paste it into the editor
3. View the interactive documentation with request/response examples

### Option 2: Local Swagger UI
If you want to run Swagger UI locally:

```bash
# Using npx (no installation required)
npx swagger-ui-serve openapi.yaml

# Or install globally
npm install -g swagger-ui-serve
swagger-ui-serve openapi.yaml
```

### Option 3: VS Code Extension
1. Install the "OpenAPI (Swagger) Editor" extension
2. Open `openapi.yaml` in VS Code
3. Right-click and select "Preview Swagger"

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if backend is running (useful for waking up sleeping services)

### Chat Management
- **POST** `/api/chats/add` - Register a floor's GroupMe chat with RHACbot

### Message Broadcasting
- **POST** `/api/messages/send` - Send messages to multiple floor chats (requires auth)

### Authentication
- **POST** `/api/auth` - Authenticate as executive board member

### Buildings
- **GET** `/api/buildings` - Get list of all residence halls

## Environment Variables

The API base URL is configured via environment variables:

### Frontend (Next.js)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_PREFIX=/api
```

### Backend (Flask)
```env
PORT=5000
GROUPME_BOT_ID=your_bot_id
GROUPME_API_TOKEN=your_api_token
RHAC_PASSWORD=your_password
MONGODB_URI=your_mongodb_uri
```

## Testing the API

### Using curl

**Health check:**
```bash
curl http://localhost:5000/api/health
```

**Add chat:**
```bash
curl -X POST http://localhost:5000/api/chats/add \
  -H "Content-Type: application/json" \
  -d '{
    "groupme_link": "https://groupme.com/join_group/12345678/abcdefgh",
    "building_id": 1,
    "floor_number": 3
  }'
```

**Authenticate:**
```bash
curl -X POST http://localhost:5000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"password": "your_password"}'
```

**Send message:**
```bash
curl -X POST http://localhost:5000/api/messages/send \
  -F "password=your_password" \
  -F "message_body=Test message" \
  -F "regions=North" \
  -F "regions=South"
```

### Using JavaScript/TypeScript

The frontend uses helper functions defined in `rhacbot-next/lib/api.js`:

```javascript
import { healthCheck, addChat, sendMessage, authenticate, getBuildings } from './lib/api';

// Health check
await healthCheck();

// Add chat
await addChat({
  groupme_link: 'https://groupme.com/join_group/...',
  building_id: 1,
  floor_number: 3
});

// Authenticate
await authenticate('password');

// Send message
const formData = new FormData();
formData.append('password', 'password');
formData.append('message_body', 'Hello!');
formData.append('regions', 'North');
await sendMessage(formData);
```

## Response Codes

- **200** - Success
- **207** - Multi-Status (some operations succeeded, some failed)
- **400** - Bad Request (invalid data)
- **401** - Unauthorized (authentication failed)
- **500** - Internal Server Error

## Data Models

### Building
```typescript
{
  id: number;
  name: string;
  region: "North" | "South" | "East" | "West" | "Central";
}
```

### Chat
```typescript
{
  groupme_link: string;
  building_id: number;
  floor_number: number;
}
```

### Message Send Summary
```typescript
{
  message: string;
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
  failures?: Array<{
    chat_id: string;
    building: string;
    floor: number;
    error: string;
  }>;
}
```

## Contributing

When adding new endpoints:
1. Update `openapi.yaml` with the new endpoint specification
2. Implement the endpoint in `backend/app.py`
3. Add corresponding function in `rhacbot-next/lib/api.js`
4. Update this documentation
