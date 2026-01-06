/**
 * Tests for the health check API endpoint
 */

import { GET } from '@/app/api/health/route';

describe('/api/health', () => {
  it('should return 200 OK with status message', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.message).toBe('Backend is healthy');
  });
});
