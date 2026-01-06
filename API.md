# RHACbot API Documentation

This document describes the Next.js API routes for RHACbot. The API is built using Next.js 16 Route Handlers and serves both the frontend and backend functionality.

## API Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-vercel-app.vercel.app/api`

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

All endpoints are Next.js Route Handlers located in `rhacbot-next/src/app/api/`.

### Health Check
- **GET** `/api/health` - Check application and database health status

### Chat Management
- **POST** `/api/chats/add` - Register a floor's GroupMe chat with RHACbot

### Message Broadcasting
- **POST** `/api/messages/send` - Send messages to multiple floor chats (requires auth)

### Authentication
- **POST** `/api/auth` - Authenticate as executive board member

### Buildings
- **GET** `/api/buildings` - Get list of all residence halls with regions

## Environment Variables

Environment variables are stored in the root `.env` file (not inside rhacbot-next).

### Required Variables
```env
# GroupMe API Configuration
GROUPME_ACCESS_TOKEN=your_groupme_token_here

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=Cluster0
MONGODB_DB_DEV=rhac_db_dev
MONGODB_DB_PROD=rhac_db_prod

# Authentication & Security
ADMIN_PASSWORD=your_admin_password
SECRET_KEY=your_secret_key_here

# Environment Configuration
ENV=dev

# Next.js Public Variables
NEXT_PUBLIC_ENV=dev
NEXT_PUBLIC_STYLISH=true
```

## Testing the API

### Using curl

**Health check:**
```bash
curl http://localhost:3000/api/health
```

**Get buildings:**
```bash
curl http://localhost:3000/api/buildings
```

**Authenticate:**
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"password": "your_admin_password"}'
```

**Add chat:**
```bash
curl -X POST http://localhost:3000/api/chats/add \
  -H "Content-Type: application/json" \
  -d '{
    "groupme_link": "https://groupme.com/join_group/12345678/abcdefgh",
    "building_id": 1,
    "floor_number": 3
  }'
```

**Send message:**
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "password": "your_admin_password",
    "message_body": "Test announcement",
    "regions": ["North", "South"],
    "building_ids": [],
    "image_path": ""
  }'
```

### Using TypeScript/JavaScript

The application uses internal API route handlers. Here's how to call them from the client:

```typescript
// Health check
const healthResponse = await fetch('/api/health');
const health = await healthResponse.json();

// Get buildings
const buildingsResponse = await fetch('/api/buildings');
const buildings = await buildingsResponse.json();

// Authenticate
const authResponse = await fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'your_password' })
});
const auth = await authResponse.json();

// Add chat
const addChatResponse = await fetch('/api/chats/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    groupme_link: 'https://groupme.com/join_group/...',
    building_id: 1,
    floor_number: 3
  })
});
const result = await addChatResponse.json();

// Send message
const sendResponse = await fetch('/api/messages/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    password: 'your_password',
    message_body: 'Hello everyone!',
    regions: ['all'],
    building_ids: [],
    image_path: ''
  })
});
const sendResult = await sendResponse.json();
```

## Response Codes

- **200** - Success
- **400** - Bad Request (invalid data or validation error)
- **401** - Unauthorized (authentication failed)
- **404** - Not Found (resource doesn't exist)
- **500** - Internal Server Error

## Data Models

### Building
```typescript
{
  id: number;
  name: string;
  region: "North Campus" | "South Campus" | "West Campus" | "East Campus" | "Off Campus";
}
```

### Chat Registration
```typescript
{
  groupme_link: string;    // GroupMe join link
  building_id: number;     // Building ID from buildings.json
  floor_number: number;    // Floor number (1-20)
}
```

### Message Send Request
```typescript
{
  password: string;        // Admin password
  message_body: string;    // Message text
  regions: string[];       // ["all"] or ["North Campus", "South Campus", ...]
  building_ids: number[];  // [] or [1, 5, 10, ...]
  image_path?: string;     // Optional path to image file
}
```

### Health Check Response
```typescript
{
  status: "healthy" | "unhealthy";
  database: "connected" | "disconnected";
  timestamp: string;       // ISO 8601 timestamp
}
```

### Error Response
```typescript
{
  error: string;           // Error message
  details?: any;           // Optional additional error details
}
```

## Architecture Notes

- **Full-Stack Next.js**: All API routes are Next.js Route Handlers (no separate backend)
- **TypeScript**: Complete type safety across the application
- **MongoDB**: Used for persistent storage of chat registrations
- **GroupMe API**: Direct integration for message sending and image uploads
- **Environment-Based**: Separate dev/prod database and configuration

## Contributing

When adding new endpoints:
1. Create route handler in `rhacbot-next/src/app/api/[endpoint]/route.ts`
2. Add type definitions in `rhacbot-next/lib/types.ts`
3. Add comprehensive tests in `rhacbot-next/__tests__/api/`
4. Update `openapi.yaml` with the new endpoint specification
5. Update this documentation

All new API routes must:
- Include proper error handling
- Validate all inputs using type guards
- Return consistent response format
- Include comprehensive tests (aim for >80% coverage)
