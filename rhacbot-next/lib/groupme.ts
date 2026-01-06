/**
 * GroupMe API utilities
 */

import { Config } from './config';
import { v4 as uuidv4 } from 'uuid';

const GROUPME_API_URL = 'https://api.groupme.com/v3';

/**
 * Extract group_id and share_token from GroupMe link
 */
export function extractGroupIdAndToken(link: string): { groupId: string; shareToken: string } | null {
  try {
    const parts = link.trim().replace(/\/$/, '').split('/');
    const index = parts.indexOf('join_group');
    if (index === -1) return null;
    
    const groupId = parts[index + 1];
    const shareToken = parts[index + 2];
    
    if (!groupId || !shareToken) return null;
    
    return { groupId, shareToken };
  } catch (error) {
    return null;
  }
}

/**
 * Join a GroupMe group using the share token
 */
export async function joinGroup(groupId: string, shareToken: string): Promise<boolean> {
  const url = `${GROUPME_API_URL}/groups/${groupId}/join/${shareToken}`;
  const token = Config.GROUPME_ACCESS_TOKEN;
  
  if (!token) {
    console.error('GROUPME_ACCESS_TOKEN is not set');
    return false;
  }

  try {
    const response = await fetch(`${url}?token=${token}`, {
      method: 'POST',
    });

    console.log(`join_group response: status=${response.status}`);

    if (response.status === 200 || response.status === 201) {
      console.log(`Successfully joined group ${groupId}`);
      return true;
    } else {
      const text = await response.text();
      console.error(`Failed to join group ${groupId}: ${response.status} ${text}`);
      return false;
    }
  } catch (error) {
    console.error(`Network error while joining group ${groupId}:`, error);
    return false;
  }
}

/**
 * Upload image to GroupMe Image Service
 */
export async function uploadImageToGroupMe(imageBuffer: Buffer, contentType: string): Promise<string | null> {
  const url = 'https://image.groupme.com/pictures';
  const token = Config.GROUPME_ACCESS_TOKEN;
  
  if (!token) {
    console.error('GROUPME_ACCESS_TOKEN not configured; cannot upload image');
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Access-Token': token,
        'Content-Type': contentType,
      },
      body: imageBuffer as any,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.payload?.picture_url || null;
  } catch (error) {
    console.error('Failed to upload image to GroupMe:', error);
    return null;
  }
}

/**
 * Send a message to a GroupMe group
 */
export async function sendMessageToGroup(
  groupId: string,
  text: string,
  imageUrl?: string
): Promise<{ success: boolean; group_id: string; status_code?: number; error?: string }> {
  const url = `${GROUPME_API_URL}/groups/${groupId}/messages`;
  const token = Config.GROUPME_ACCESS_TOKEN;
  
  if (!token) {
    console.error('GROUPME_ACCESS_TOKEN is not set');
    return { success: false, group_id: groupId, error: 'GROUPME_ACCESS_TOKEN not set' };
  }

  const messageData: any = {
    message: {
      source_guid: uuidv4(),
      text,
    },
  };

  if (imageUrl) {
    messageData.message.attachments = [
      {
        type: 'image',
        url: imageUrl,
      },
    ];
  }

  try {
    const response = await fetch(`${url}?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    if (response.status !== 201) {
      const text = await response.text();
      console.error(`Failed to send message to group ${groupId}: ${response.status} ${text}`);
      return {
        success: false,
        group_id: groupId,
        status_code: response.status,
        error: text,
      };
    }

    console.log(`Message sent to group ${groupId}`);
    return { success: true, group_id: groupId, status_code: response.status };
  } catch (error: any) {
    console.error(`Network error while sending message to group ${groupId}:`, error);
    return { success: false, group_id: groupId, error: error?.message || 'Network error' };
  }
}
