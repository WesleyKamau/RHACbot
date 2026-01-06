import type {
  ApiResponse,
  HealthCheckResponse,
  Building,
  AddChatRequest,
  AddChatResponse,
  SendMessageResponse,
  AuthRequest,
  AuthResponse,
  AuthErrorResponse,
} from './types';

// Use Next.js API routes (local to the application)
const API_URL = '/api';

/**
 * Health check endpoint to wake up the backend
 * @returns Promise with status and health check data
 */
export async function healthCheck(): Promise<ApiResponse<HealthCheckResponse>> {
  try {
    const res = await fetch(`${API_URL}/health`, {
      method: 'GET',
    });
    const data = await res.json().catch(() => ({ status: 'error', message: 'Failed to parse response' }));
    return { status: res.status, data };
  } catch (error) {
    console.warn('Health check failed:', error);
    return { status: 500, data: { status: 'error' as any, message: 'Health check failed' } };
  }
}

/**
 * Get list of all buildings
 * @returns Promise with array of buildings
 */
export async function getBuildings(): Promise<Building[]> {
  const res = await fetch(`${API_URL}/buildings`);
  if (!res.ok) throw new Error('Failed to load buildings');
  const data = await res.json();
  return data.buildings || [];
}

/**
 * Add a floor chat to RHACbot
 * @param payload - Chat information including GroupMe link, building ID, and floor number
 * @returns Promise with status and response data
 */
export async function addChat(payload: AddChatRequest): Promise<ApiResponse<AddChatResponse>> {
  const res = await fetch(`${API_URL}/chats/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ error: 'Failed to parse response' }));
  return { status: res.status, data };
}

/**
 * Send a message to multiple floor chats
 * @param formData - FormData containing password, message_body, optional image_file, regions, and building_ids
 * @returns Promise with status and response data
 */
export async function sendMessage(formData: FormData): Promise<ApiResponse<SendMessageResponse>> {
  const res = await fetch(`${API_URL}/messages/send`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json().catch(() => ({ error: 'Failed to parse response' }));
  return { status: res.status, data };
}

/**
 * Authenticate as executive board member
 * @param password - Executive board password
 * @returns Promise with status and response data
 */
export async function authenticate(password: string): Promise<ApiResponse<AuthResponse | AuthErrorResponse>> {
  const res = await fetch(`${API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password } as AuthRequest),
  });
  const data = await res.json().catch(() => ({ error: 'Failed to parse response' }));
  return { status: res.status, data };
}
