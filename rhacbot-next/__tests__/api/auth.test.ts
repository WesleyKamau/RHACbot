/**
 * Tests for the authentication API endpoint
 */

import { POST } from '@/app/api/auth/route';

// Mock the config
jest.mock('@/lib/config', () => ({
  Config: {
    ADMIN_PASSWORD: 'test_password_123',
  },
}));

describe('/api/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate successfully with correct password', async () => {
    const request = {
      json: async () => ({ password: 'test_password_123' }),
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.message).toBe('Authenticated');
  });

  it('should reject incorrect password', async () => {
    const request = {
      json: async () => ({ password: 'wrong_password' }),
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should reject missing password', async () => {
    const request = {
      json: async () => ({}),
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Missing password');
  });
});
