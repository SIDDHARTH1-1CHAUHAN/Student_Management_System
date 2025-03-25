import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Find the ID of the 8th semester
    const eighthSemester = await prisma.semester.findFirst({
      where: {
        id: 8,
      },
    });

    if (!eighthSemester) {
      return NextResponse.json(
        { error: "8th semester not found" },
        { status: 404 }
      );
    }

    // Get all students in the 8th semester
    const students = await prisma.student.findMany({
      where: {
        semesterId: eighthSemester.id,
      },
      include: {
        branch: true,
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching 8th semester students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}