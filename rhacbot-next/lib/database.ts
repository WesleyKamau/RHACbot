/**
 * Database operations for chats
 */

import { connectToDatabase, Config } from './config';
import { Collection } from 'mongodb';

export interface Chat {
  _id?: string;
  groupme_id: string;
  building_id: number;
  floor_number: number;
  env: string;
}

// In-memory fallback storage
let fallbackChats: Chat[] = [];

/**
 * Get chats collection or use fallback
 */
async function getChatsCollection(): Promise<Collection<Chat> | null> {
  try {
    const { db } = await connectToDatabase();
    return db.collection<Chat>('chats');
  } catch (error) {
    console.warn('MongoDB not available, using in-memory storage');
    return null;
  }
}

/**
 * Add a chat to the database
 */
export async function addChat(
  groupmeId: string,
  buildingId: number,
  floorNumber: number
): Promise<Chat | null> {
  const chat: Chat = {
    groupme_id: groupmeId,
    building_id: buildingId,
    floor_number: floorNumber,
    env: Config.ENV,
  };

  try {
    const collection = await getChatsCollection();
    
    if (collection) {
      const result = await collection.insertOne(chat as any);
      if (result.insertedId) {
        chat._id = result.insertedId.toString();
        console.log('Chat added to database:', chat);
        return chat;
      }
    } else {
      // Fallback in-memory storage
      fallbackChats.push(chat);
      console.log('Chat added to in-memory storage:', chat);
      return chat;
    }
  } catch (error) {
    console.error('Failed to add chat:', error);
    return null;
  }
  
  return null;
}

/**
 * Check if a chat exists for a given GroupMe ID
 */
export async function chatExists(groupmeId: string): Promise<boolean> {
  try {
    const collection = await getChatsCollection();
    
    if (collection) {
      const existing = await collection.findOne({
        groupme_id: groupmeId,
        env: Config.ENV,
      });
      return !!existing;
    } else {
      // Check fallback storage
      return fallbackChats.some(
        (c) => c.groupme_id === groupmeId && c.env === Config.ENV
      );
    }
  } catch (error) {
    console.error('Error checking if chat exists:', error);
    return false;
  }
}

/**
 * Get GroupMe IDs for specific building IDs
 */
export async function getGroupMeIdsByBuildings(buildingIds: number[]): Promise<string[]> {
  try {
    const collection = await getChatsCollection();
    
    if (collection) {
      const chats = await collection
        .find({
          building_id: { $in: buildingIds },
          env: Config.ENV,
        })
        .toArray();
      return chats.map((chat) => chat.groupme_id);
    } else {
      // Use fallback storage
      return fallbackChats
        .filter((c) => buildingIds.includes(c.building_id) && c.env === Config.ENV)
        .map((c) => c.groupme_id);
    }
  } catch (error) {
    console.error('Error querying chats:', error);
    return [];
  }
}

/**
 * Get mapping of building_id -> list of group entries with floor info
 */
export async function getGroupMeMapByBuildings(
  buildingIds: number[]
): Promise<Record<number, Array<{ group_id: string; floor_number: number | null }>>> {
  const mapping: Record<number, Array<{ group_id: string; floor_number: number | null }>> = {};
  buildingIds.forEach((id) => (mapping[id] = []));

  try {
    const collection = await getChatsCollection();
    
    if (collection) {
      const chats = await collection
        .find({
          building_id: { $in: buildingIds },
          env: Config.ENV,
        })
        .toArray();
      
      for (const chat of chats) {
        const bid = chat.building_id;
        if (bid in mapping) {
          mapping[bid].push({
            group_id: chat.groupme_id,
            floor_number: chat.floor_number || null,
          });
        }
      }
    } else {
      // Use fallback storage
      for (const c of fallbackChats) {
        if (c.env !== Config.ENV) continue;
        const bid = c.building_id;
        if (bid in mapping) {
          mapping[bid].push({
            group_id: c.groupme_id,
            floor_number: c.floor_number || null,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error querying chats for mapping:', error);
  }

  return mapping;
}
