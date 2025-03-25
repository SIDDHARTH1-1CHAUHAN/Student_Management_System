import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const semesterId = searchParams.get('semesterId');

    if (!semesterId) {
      return NextResponse.json({ error: 'Semester ID is required' }, { status: 400 });
    }

    // Count students in the specified semester
    const count = await prisma.student.count({
      where: {
        semesterId: parseInt(semesterId),
        results: {
          some: {} 
        }
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting students:', error);
    return NextResponse.json({ error: 'Failed to count students' }, { status: 500 });
  }
}