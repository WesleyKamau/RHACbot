/**
 * Tests for GroupMe utility functions
 */

// Mock uuid before any imports
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Mock config and database before importing groupme
jest.mock('@/lib/config', () => ({
  Config: {
    GROUPME_ACCESS_TOKEN: 'test_token_123',
    ENV: 'test',
  },
  connectToDatabase: jest.fn(),
}));

import { extractGroupIdAndToken, joinGroup, sendMessageToGroup, uploadImageToGroupMe } from '@/lib/groupme';

// Mock fetch
global.fetch = jest.fn();

describe('GroupMe utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractGroupIdAndToken', () => {
    it('should extract group ID and token from valid link', () => {
      const link = 'https://groupme.com/join_group/12345678/SHARE_TOKEN_ABC';
      const result = extractGroupIdAndToken(link);
      
      expect(result).toEqual({
        groupId: '12345678',
        shareToken: 'SHARE_TOKEN_ABC',
      });
    });

    it('should handle link with trailing slash', () => {
      const link = 'https://groupme.com/join_group/12345678/SHARE_TOKEN_ABC/';
      const result = extractGroupIdAndToken(link);
      
      expect(result).toEqual({
        groupId: '12345678',
        shareToken: 'SHARE_TOKEN_ABC',
      });
    });

    it('should return null for invalid link', () => {
      const link = 'https://invalid-link.com';
      const result = extractGroupIdAndToken(link);
      
      expect(result).toBeNull();
    });

    it('should return null for link missing token', () => {
      const link = 'https://groupme.com/join_group/12345678';
      const result = extractGroupIdAndToken(link);
      
      expect(result).toBeNull();
    });
  });

  describe('joinGroup', () => {
    it('should successfully join group', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ response: { group: { id: '12345678' } } }),
        json: async () => ({ response: { group: { id: '12345678' } } }),
      });

      const result = await joinGroup('12345678', 'SHARE_TOKEN');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.groupme.com/v3/groups/12345678/join/SHARE_TOKEN?token=test_token_123',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should return false on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not Found',
      });

      const result = await joinGroup('invalid', 'token');

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await joinGroup('12345', 'token');

      expect(result).toBe(false);
    });
  });

  describe('uploadImageToGroupMe', () => {
    it('should successfully upload image', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          payload: {
            picture_url: 'https://i.groupme.com/uploaded_image.jpg',
          },
        }),
      });

      const mockBuffer = Buffer.from('fake image data');
      const result = await uploadImageToGroupMe(mockBuffer, 'image/jpeg');

      expect(result).toBe('https://i.groupme.com/uploaded_image.jpg');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://image.groupme.com/pictures',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Access-Token': 'test_token_123',
            'Content-Type': 'image/jpeg',
          }),
        })
      );
    });

    it('should return null on upload error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      const mockBuffer = Buffer.from('fake image data');
      const result = await uploadImageToGroupMe(mockBuffer, 'image/jpeg');

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const mockBuffer = Buffer.from('fake image data');
      const result = await uploadImageToGroupMe(mockBuffer, 'image/jpeg');

      expect(result).toBeNull();
    });
  });

  describe('sendMessageToGroup', () => {
    it('should successfully send text message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ response: { message: { id: 'msg123' } } }),
        json: async () => ({ response: { message: { id: 'msg123' } } }),
      });

      const result = await sendMessageToGroup('group123', 'Hello world');

      expect(result).toEqual({
        success: true,
        group_id: 'group123',
        status_code: 201,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.groupme.com/v3/groups/group123/messages?token=test_token_123',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"text":"Hello world"'),
        })
      );
    });

    it('should successfully send message with image', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ response: { message: { id: 'msg456' } } }),
        json: async () => ({ response: { message: { id: 'msg456' } } }),
      });

      const result = await sendMessageToGroup(
        'group123',
        'Check this out',
        'https://i.groupme.com/test.jpg'
      );

      expect(result).toEqual({
        success: true,
        group_id: 'group123',
        status_code: 201,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.groupme.com/v3/groups/group123/messages?token=test_token_123',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"url":"https://i.groupme.com/test.jpg"'),
        })
      );
    });

    it('should return failure on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Bad Request',
      });

      const result = await sendMessageToGroup('group123', 'Test');

      expect(result).toEqual({
        success: false,
        group_id: 'group123',
        status_code: 400,
        error: 'Bad Request',
      });
    });

    it('should return failure on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await sendMessageToGroup('group123', 'Test');

      expect(result).toEqual({
        success: false,
        group_id: 'group123',
        error: expect.stringContaining('Network error'),
      });
    });
  });
});
