import { NextResponse } from 'next/server';
import { addChat, chatExists } from '@/lib/database';
import { extractGroupIdAndToken, joinGroup } from '@/lib/groupme';
import { isValidBuildingId } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { groupme_link, building_id, floor_number } = data;

    // Validate request
    if (!groupme_link || !groupme_link.trim()) {
      return NextResponse.json(
        { error: 'groupme_link is required' },
        { status: 400 }
      );
    }

    if (!isValidBuildingId(building_id)) {
      return NextResponse.json(
        { error: 'building_id must be an integer between 0 and 40' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(floor_number) || floor_number < 1) {
      return NextResponse.json(
        { error: 'floor_number must be an integer >= 1' },
        { status: 400 }
      );
    }

    console.log(
      `add_floor_chat payload: groupme_link=${groupme_link}, building_id=${building_id}, floor_number=${floor_number}`
    );

    // Extract group_id and share_token from the GroupMe link
    const groupInfo = extractGroupIdAndToken(groupme_link);
    if (!groupInfo) {
      return NextResponse.json(
        { error: 'Invalid GroupMe link' },
        { status: 400 }
      );
    }

    const { groupId, shareToken } = groupInfo;
    console.log(`Group ID: ${groupId}, Share Token: ${shareToken}`);

    // Check if the chat already exists
    const exists = await chatExists(groupId);
    if (exists) {
      console.log(`GroupMe ID already exists in storage: ${groupId}`);
      return NextResponse.json(
        { error: 'Chat already exists' },
        { status: 400 }
      );
    }

    // Join the group using the GroupMe API
    const joined = await joinGroup(groupId, shareToken);
    if (!joined) {
      return NextResponse.json(
        { error: 'Failed to join the GroupMe group' },
        { status: 500 }
      );
    }

    // Add the chat to the database
    const chat = await addChat(groupId, building_id, floor_number);
    if (!chat) {
      return NextResponse.json(
        { error: 'Failed to add chat' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      message: 'Chat added successfully',
      chat_id: chat._id || '',
    });
  } catch (error) {
    console.error('Error in add_floor_chat:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
