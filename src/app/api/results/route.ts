import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure Prisma is set up correctly
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk authentication

export async function GET(req: NextRequest) {
  try {
    const students = await prisma.student.findMany({
      include: {
        results: {
          include: { subject: true },
        },
      },
    });

    if (!students || students.length === 0) {
      return NextResponse.json({ message: "No results found", data: [] }, { status: 200 });
    }

    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
  }
}