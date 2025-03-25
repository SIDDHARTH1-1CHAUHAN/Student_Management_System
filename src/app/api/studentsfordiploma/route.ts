import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get all students with semesterId >= 6
    const students = await prisma.student.findMany({
      where: {
        semesterId: {
          gte: 6, // greater than or equal to 6
        },
      },
      include: {
        branch: true,
      },
    });

    if (students.length === 0) {
      return NextResponse.json(
        { error: "No students found for the specified semester range" },
        { status: 404 }
      );
    }

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students with semesterId >= 6:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
