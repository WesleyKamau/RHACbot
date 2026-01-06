/**
 * Tests for the add chat API endpoint
 */

import { POST } from '@/app/api/chats/add/route';

// Mock the dependencies
jest.mock('@/lib/database', () => ({
  chatExists: jest.fn(),
  addChat: jest.fn(),
}));

jest.mock('@/lib/groupme', () => ({
  extractGroupIdAndToken: jest.fn(),
  joinGroup: jest.fn(),
}));

import { chatExists, addChat } from '@/lib/database';
import { extractGroupIdAndToken, joinGroup } from '@/lib/groupme';

describe('/api/chats/add', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add chat successfully', async () => {
    (extractGroupIdAndToken as jest.Mock).mockReturnValue({
      groupId: '12345678',
      shareToken: 'SHARE_TOKEN_ABC',
    });
    (chatExists as jest.Mock).mockResolvedValue(false);
    (joinGroup as jest.Mock).mockResolvedValue(true);
    (addChat as jest.Mock).mockResolvedValue({
      _id: 'test_id_123',
      groupme_id: '12345678',
      building_id: 1,
      floor_number: 5,
      env: 'test',
    });

    const request = {
      json: async () => ({
        groupme_link: 'https://groupme.com/join_group/12345678/SHARE_TOKEN_ABC',
        building_id: 1,
        floor_number: 5,
      }),
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.message).toBe('Chat added successfully');
    expect(data.chat_id).toBe('test_id_123');
  });

  it('should reject invalid GroupMe link', async () => {
    (extractGroupIdAndToken as jest.Mock).mockReturnValue(null);

    const request = {
      json: async () => ({
        groupme_link: 'https://invalid-link.com',
        building_id: 1,
        floor_number: 5,
      }),
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid GroupMe link');
  });

  it('should reject missing groupme_link', async () => {
    const request = {
      json: async () => ({
        building_id: 1,
        floor_number: 5,
      }),
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('groupme_link is required');
  });

  it('should reject invalid building_id', async () => {
    const request = {
      json: async () => ({
        groupme_link: 'https://groupme.com/join_group/12345678/TOKEN',
        building_id: 999,
        floor_number: 5,
      }),
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('building_id must be an integer between 0 and 40');
  });

  it('should reject invalid floor_number', async () => {
    const request = {
      json: async () => ({
        groupme_link: 'https://groupme.com/join_group/12345678/TOKEN',
        building_id: 1,
        floor_number: 0,
      }),
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('floor_number must be an integer >= 1');
  });

  it('should reject existing chat', async () => {
    (extractGroupIdAndToken as jest.Mock).mockReturnValue({
      groupId: '12345678',
      shareToken: 'SHARE_TOKEN_ABC',
    });
    (chatExists as jest.Mock).mockResolvedValue(true);

    const request = {
      json: async () => ({
        groupme_link: 'https://groupme.com/join_group/12345678/SHARE_TOKEN_ABC',
        building_id: 1,
        floor_number: 5,
      }),
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Chat already exists');
  });

  it('should handle failed join group', async () => {
    (extractGroupIdAndToken as jest.Mock).mockReturnValue({
      groupId: '12345678',
      shareToken: 'SHARE_TOKEN_ABC',
    });
    (chatExists as jest.Mock).mockResolvedValue(false);
    (joinGroup as jest.Mock).mockResolvedValue(false);

    const request = {
      json: async () => ({
        groupme_link: 'https://groupme.com/join_group/12345678/SHARE_TOKEN_ABC',
        building_id: 1,
        floor_number: 5,
      }),
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Failed to join the GroupMe group');
  });
});
