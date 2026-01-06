import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // Read buildings.json from the data directory
    const filePath = join(process.cwd(), 'data', 'buildings.json');
    const fileContents = await readFile(filePath, 'utf8');
    const buildings = JSON.parse(fileContents);
    
    return NextResponse.json({ buildings });
  } catch (error) {
    console.error('Error reading buildings.json:', error);
    return NextResponse.json(
      { error: 'Failed to load buildings' },
      { status: 500 }
    );
  }
}
