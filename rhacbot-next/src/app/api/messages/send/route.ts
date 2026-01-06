import { NextResponse } from 'next/server';
import { Config } from '@/lib/config';
import { getGroupMeMapByBuildings } from '@/lib/database';
import { sendMessageToGroup, uploadImageToGroupMe } from '@/lib/groupme';
import { isValidBuildingId, isValidRegionTarget, validateMessageBody } from '@/lib/types';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const buildingIdsRaw = formData.getAll('building_ids');
    const messageBody = formData.get('message_body') as string;
    const imageFile = formData.get('image_file') as File | null;
    const regionsRaw = formData.getAll('regions');
    const password = formData.get('password') || formData.get('auth');

    // Validate executive/admin password server-side
    if (!password || password !== Config.ADMIN_PASSWORD) {
      console.warn('Unauthorized send_messages attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((!buildingIdsRaw.length && !regionsRaw.length) || !messageBody) {
      return NextResponse.json(
        { error: 'Missing building_ids or regions, or message_body' },
        { status: 400 }
      );
    }

    // Validate message body
    const messageError = validateMessageBody(messageBody);
    if (messageError) {
      return NextResponse.json({ error: messageError }, { status: 400 });
    }

    let buildingIds: number[] = [];

    // Determine building_ids based on regions or provided list
    if (buildingIdsRaw.length > 0) {
      // Validate building IDs
      try {
        buildingIds = buildingIdsRaw.map((id) => {
          const numId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
          if (!isValidBuildingId(numId)) {
            throw new Error(`Invalid building_id: ${id}`);
          }
          return numId;
        });
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'building_ids must be valid integers' },
          { status: 400 }
        );
      }
    } else {
      // Handle regions selection
      const regions = regionsRaw.map((r) => String(r));
      
      for (const region of regions) {
        if (!isValidRegionTarget(region)) {
          return NextResponse.json(
            { error: `Invalid region: ${region}` },
            { status: 400 }
          );
        }
      }

      // Normalize regions to lowercase for case-insensitive comparison
      const regionsLower = regions.map((r) => r.toLowerCase());

      // Load buildings data
      const filePath = join(process.cwd(), 'data', 'buildings.json');
      const fileContents = await readFile(filePath, 'utf8');
      const buildingsData = JSON.parse(fileContents);

      if (regionsLower.includes('all')) {
        // Use all building IDs
        buildingIds = buildingsData.map((b: any) => b.id);
      } else {
        // Get building IDs for the specified regions (case-insensitive)
        buildingIds = buildingsData
          .filter((b: any) => regionsLower.includes(b.region.toLowerCase()))
          .map((b: any) => b.id);

        if (buildingIds.length === 0) {
          return NextResponse.json(
            { error: `No buildings found in regions ${regions.join(', ')}` },
            { status: 400 }
          );
        }
      }
    }

    // Map building_id -> groupme_ids
    const groupMap = await getGroupMeMapByBuildings(buildingIds);

    // If no group chats found for any building, return 404
    const totalGroups = Object.values(groupMap).reduce(
      (sum, groups) => sum + groups.length,
      0
    );
    if (totalGroups === 0) {
      return NextResponse.json(
        { error: 'No group chats found for the provided building IDs' },
        { status: 404 }
      );
    }

    // If an image file is provided, upload it to GroupMe Image Service
    let imageUrl: string | null = null;
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageUrl = await uploadImageToGroupMe(buffer, imageFile.type);
      if (!imageUrl) {
        return NextResponse.json(
          { error: 'Failed to upload image to GroupMe' },
          { status: 500 }
        );
      }
    }

    // Send messages grouped by building and collect results per building
    const perBuildingResults: any[] = [];
    let overallSuccesses = 0;
    let overallFailures = 0;

    // Load buildings data for lookup
    const filePath = join(process.cwd(), 'data', 'buildings.json');
    const fileContents = await readFile(filePath, 'utf8');
    const buildingsData = JSON.parse(fileContents);
    const buildingLookup: Record<number, string> = {};
    for (const b of buildingsData) {
      buildingLookup[b.id] = b.name || '';
    }

    for (const [bidStr, groupEntries] of Object.entries(groupMap)) {
      const bid = parseInt(bidStr, 10);
      const buildingEntry: any = {
        building_id: bid,
        building_name: buildingLookup[bid] || '',
        results: [],
      };

      for (const g of groupEntries) {
        const gid = g.group_id;
        const floorNumber = g.floor_number;

        const res = await sendMessageToGroup(gid, messageBody, imageUrl || undefined);
        const entry = {
          group_id: gid,
          floor_number: floorNumber,
          success: res.success,
          status_code: res.status_code,
          error: res.error,
        };

        buildingEntry.results.push(entry);
        if (entry.success) {
          overallSuccesses++;
        } else {
          overallFailures++;
        }
      }

      perBuildingResults.push(buildingEntry);
    }

    const total = overallSuccesses + overallFailures;
    if (total === 0) {
      return NextResponse.json({ error: 'No group chats found' }, { status: 404 });
    }

    // Build summary
    const summary = {
      total,
      sent: overallSuccesses,
      failed: overallFailures,
    };

    if (overallFailures === 0) {
      // All successful
      return NextResponse.json({
        message: 'All messages sent successfully',
        summary,
      });
    } else if (overallSuccesses > 0) {
      // Partial success - collect failures
      const failures: any[] = [];
      for (const buildingEntry of perBuildingResults) {
        const buildingName = buildingEntry.building_name || 'Unknown';
        for (const result of buildingEntry.results || []) {
          if (!result.success) {
            failures.push({
              chat_id: result.group_id || '',
              building: buildingName,
              floor: result.floor_number || 0,
              error: result.error || 'Unknown error',
            });
          }
        }
      }

      return NextResponse.json(
        {
          message: 'Some messages were sent successfully',
          summary,
          failures,
        },
        { status: 207 }
      );
    } else {
      // All failed
      return NextResponse.json(
        {
          error: 'No messages were sent',
          details: `${total} attempts failed`,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error in send_messages:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
