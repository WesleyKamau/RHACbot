# RHACbot API Client Library

This directory contains the typed API client for the RHACbot frontend.

## Files

- **`api.ts`** - API client functions with full TypeScript typing
- **`types.ts`** - TypeScript types and interfaces derived from `openapi.yaml`
- **`index.ts`** - Barrel export for convenient imports

## Usage

### Basic Import

```typescript
import { addChat, sendMessage, authenticate, healthCheck } from '@/../../lib/api';
import type { Building, AddChatRequest, SendMessageResponse } from '@/../../lib/types';
```

Or use the barrel export:

```typescript
import { addChat, Building, AddChatRequest } from '@/../../lib';
```

### Health Check

```typescript
import { healthCheck } from '@/../../lib/api';

const result = await healthCheck();
console.log(result.data.status); // 'ok'
```

### Add Chat

```typescript
import { addChat } from '@/../../lib/api';
import type { AddChatRequest } from '@/../../lib/types';

const chatData: AddChatRequest = {
  groupme_link: 'https://groupme.com/join_group/...',
  building_id: 5,
  floor_number: 3
};

const response = await addChat(chatData);
if (response.status === 200) {
  console.log('Chat added:', response.data.message);
}
```

### Authenticate

```typescript
import { authenticate } from '@/../../lib/api';

const response = await authenticate('password');
if (response.status === 200) {
  console.log('Authenticated!');
}
```

### Send Message

```typescript
import { sendMessage } from '@/../../lib/api';
import { hasMessageFailures } from '@/../../lib/types';

const formData = new FormData();
formData.append('password', 'exec_password');
formData.append('message_body', 'Hello everyone!');
formData.append('regions', 'North');
formData.append('regions', 'South');

const response = await sendMessage(formData);

if (response.status === 200) {
  console.log('All messages sent successfully');
} else if (response.status === 207 && hasMessageFailures(response.data)) {
  console.log(`Sent: ${response.data.summary.sent}/${response.data.summary.total}`);
  console.log('Failures:', response.data.failures);
}
```

### Type Guards

The library includes helpful type guards:

```typescript
import { isApiError, hasMessageFailures, isValidRegion } from '@/../../lib/types';

// Check if response is an error
if (isApiError(response.data)) {
  console.error(response.data.error);
}

// Check if send message response has failures
if (hasMessageFailures(response.data)) {
  // TypeScript now knows response.data has 'failures' property
  response.data.failures.forEach(f => console.log(f.error));
}

// Validate region
if (isValidRegion('North')) {
  // TypeScript knows this is a valid Region type
}
```

## Type Definitions

### Buildings

```typescript
type Region = "North" | "South" | "West";

interface Building {
  id: number; // 0-40
  name: string;
  address: string;
  region: Region;
}
```

### Chat Management

```typescript
interface AddChatRequest {
  groupme_link: string;
  building_id: number; // 0-40
  floor_number: number; // minimum: 1
}

interface AddChatResponse {
  message: string;
  chat_id?: string;
}
```

### Message Broadcasting

```typescript
interface SendMessageRequest {
  password: string;
  message_body: string; // max 1000 characters
  image_file?: File;
  regions?: RegionTarget[]; // "all" | "North" | "South" | "West"
  building_ids?: string[];
}

interface MessageSendSummary {
  total: number;
  sent: number;
  failed: number;
}

interface MessageFailure {
  chat_id: string;
  building: string;
  floor: number;
  error: string;
}
```

## API Response Pattern

All API functions follow a consistent response pattern:

```typescript
interface ApiResponse<T> {
  status: number;  // HTTP status code
  data: T;         // Response data (typed based on endpoint)
}
```

Example:

```typescript
const response = await addChat(chatData);
// response.status: 200 | 400 | 500
// response.data: AddChatResponse | ApiError
```

## Error Handling

```typescript
import { isApiError } from '@/../../lib/types';

const response = await addChat(chatData);

if (response.status === 200) {
  // Success
  console.log(response.data.message);
} else if (isApiError(response.data)) {
  // Error
  console.error(response.data.error);
  if (response.data.details) {
    console.error('Details:', response.data.details);
  }
}
```

## Relationship to OpenAPI Spec

All types in `types.ts` are derived from the OpenAPI 3.0 specification in `openapi.yaml` at the repository root. When the API changes:

1. Update `openapi.yaml` with the new schema
2. Update `types.ts` to match the new schema
3. Update `api.ts` if function signatures change
4. Update consuming components to use new types

## Migration from JavaScript

The old `api.js` file has been replaced with `api.ts`. The function signatures remain the same, but now with proper TypeScript types. All existing imports will automatically resolve to the TypeScript version.

### Before (JavaScript)
```javascript
import { addChat } from '../../../lib/api';

const response = await addChat(payload);
```

### After (TypeScript)
```typescript
import { addChat } from '../../../lib/api';
import type { AddChatRequest } from '../../../lib/types';

const payload: AddChatRequest = { ... };
const response = await addChat(payload);
// TypeScript now knows the exact shape of response
```

## Benefits

✅ **Type Safety** - Catch errors at compile time, not runtime  
✅ **IntelliSense** - Full autocomplete in VS Code  
✅ **Documentation** - Types serve as inline documentation  
✅ **Refactoring** - Safely rename and restructure code  
✅ **API Contract** - Types match the OpenAPI specification exactly
