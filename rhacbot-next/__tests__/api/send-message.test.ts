/**
 * Tests for the send message API endpoint
 */

import { POST } from '@/app/api/messages/send/route';
import { readFile } from 'fs/promises';

// Mock the dependencies
jest.mock('@/lib/database', () => ({
  getGroupMeMapByBuildings: jest.fn(),
}));

jest.mock('@/lib/groupme', () => ({
  sendMessageToGroup: jest.fn(),
  uploadImageToGroupMe: jest.fn(),
}));

jest.mock('@/lib/config', () => ({
  Config: {
    ADMIN_PASSWORD: 'test_password',
    GROUPME_ACCESS_TOKEN: 'test_token',
  },
}));

jest.mock('fs/promises');

import { getGroupMeMapByBuildings } from '@/lib/database';
import { sendMessageToGroup, uploadImageToGroupMe } from '@/lib/groupme';

describe('/api/messages/send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject unauthorized request', async () => {
    const formData = new FormData();
    formData.append('building_ids', '1');
    formData.append('message_body', 'Test message');
    formData.append('password', 'wrong_password');

    const request = {
      formData: async () => formData,
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should reject missing building_ids and regions', async () => {
    const formData = new FormData();
    formData.append('message_body', 'Test message');
    formData.append('password', 'test_password');

    const request = {
      formData: async () => formData,
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Missing building_ids or regions');
  });

  it('should reject empty message body', async () => {
    const formData = new FormData();
    formData.append('building_ids', '1');
    formData.append('message_body', '   ');
    formData.append('password', 'test_password');

    const request = {
      formData: async () => formData,
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('message_body');
  });

  it('should send message successfully', async () => {
    const formData = new FormData();
    formData.append('building_ids', '1');
    formData.append('message_body', 'Test message');
    formData.append('password', 'test_password');

    (getGroupMeMapByBuildings as jest.Mock).mockResolvedValue({
      1: [{ group_id: 'group123', floor_number: 5 }],
    });

    (sendMessageToGroup as jest.Mock).mockResolvedValue({
      success: true,
      group_id: 'group123',
      status_code: 201,
    });

    (readFile as jest.Mock).mockResolvedValue(
      JSON.stringify([{ id: 1, name: 'Building 1' }])
    );

    const request = {
      formData: async () => formData,
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.message).toContain('successfully');
    expect(data.summary).toBeDefined();
  });

  it('should handle region selection', async () => {
    const formData = new FormData();
    formData.append('regions', 'north');
    formData.append('message_body', 'Test message');
    formData.append('password', 'test_password');

    const mockBuildings = [
      { id: 1, name: 'Building 1', region: 'north' },
      { id: 2, name: 'Building 2', region: 'south' },
    ];

    (readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockBuildings));

    (getGroupMeMapByBuildings as jest.Mock).mockResolvedValue({
      1: [{ group_id: 'group123', floor_number: 5 }],
    });

    (sendMessageToGroup as jest.Mock).mockResolvedValue({
      success: true,
      group_id: 'group123',
      status_code: 201,
    });

    const request = {
      formData: async () => formData,
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should handle "all" region selection', async () => {
    const formData = new FormData();
    formData.append('regions', 'all');
    formData.append('message_body', 'Test message');
    formData.append('password', 'test_password');

    const mockBuildings = [
      { id: 1, name: 'Building 1', region: 'north' },
      { id: 2, name: 'Building 2', region: 'south' },
    ];

    (readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockBuildings));

    (getGroupMeMapByBuildings as jest.Mock).mockResolvedValue({
      1: [{ group_id: 'group123', floor_number: 5 }],
      2: [{ group_id: 'group456', floor_number: 3 }],
    });

    (sendMessageToGroup as jest.Mock).mockResolvedValue({
      success: true,
      group_id: 'group123',
      status_code: 201,
    });

    const request = {
      formData: async () => formData,
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should handle no groups found for building', async () => {
    const formData = new FormData();
    formData.append('building_ids', '1');
    formData.append('message_body', 'Test message');
    formData.append('password', 'test_password');

    (getGroupMeMapByBuildings as jest.Mock).mockResolvedValue({
      1: [],
    });

    const request = {
      formData: async () => formData,
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toContain('No group chats found');
  });

  it('should handle partial failures', async () => {
    const formData = new FormData();
    formData.append('building_ids', '1');
    formData.append('building_ids', '2');
    formData.append('message_body', 'Test message');
    formData.append('password', 'test_password');

    (getGroupMeMapByBuildings as jest.Mock).mockResolvedValue({
      1: [{ group_id: 'group123', floor_number: 5 }],
      2: [{ group_id: 'group456', floor_number: 3 }],
    });

    (sendMessageToGroup as jest.Mock)
      .mockResolvedValueOnce({
        success: true,
        group_id: 'group123',
        status_code: 201,
      })
      .mockResolvedValueOnce({
        success: false,
        group_id: 'group456',
        status_code: 500,
        error: 'Server error',
      });

    (readFile as jest.Mock).mockResolvedValue(
      JSON.stringify([
        { id: 1, name: 'Building 1' },
        { id: 2, name: 'Building 2' },
      ])
    );

    const request = {
      formData: async () => formData,
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(207); // Partial success

    const data = await response.json();
    expect(data.summary.sent).toBe(1);
    expect(data.summary.failed).toBe(1);
  });
});
