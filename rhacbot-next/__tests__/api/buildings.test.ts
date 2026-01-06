/**
 * Tests for the buildings API endpoint
 */

import { GET } from '@/app/api/buildings/route';
import { readFile } from 'fs/promises';

// Mock fs/promises
jest.mock('fs/promises');

describe('/api/buildings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return buildings list successfully', async () => {
    const mockBuildings = [
      { id: 1, name: 'Test Building 1', region: 'north', address: '123 Test St' },
      { id: 2, name: 'Test Building 2', region: 'south', address: '456 Test Ave' },
    ];

    (readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockBuildings));

    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.buildings).toEqual(mockBuildings);
  });

  it('should handle file read errors', async () => {
    (readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

    const response = await GET();
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Failed to load buildings');
  });

  it('should handle JSON parse errors', async () => {
    (readFile as jest.Mock).mockResolvedValue('invalid json');

    const response = await GET();
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Failed to load buildings');
  });
});
