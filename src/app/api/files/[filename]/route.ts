
import { NextResponse } from 'next/server';
import { join, resolve } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

const STORAGE_PATH = process.env.STORAGE_PATH || './upload/public';

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;

    const normalizedPath = join(STORAGE_PATH, filename);
    const resolvedPath = resolve(normalizedPath);

    if (!resolvedPath.startsWith(resolve(STORAGE_PATH))) {
      return new NextResponse('Invalid path', { status: 403 });
    }

    if (!existsSync(resolvedPath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const file = await readFile(resolvedPath);

    const ext = resolvedPath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
    }

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}