import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure Prisma is correctly set up

export async function POST(req: NextRequest) {
  try {
    const { teacherId } = await req.json();

    if (!teacherId) {
      return NextResponse.json({ error: "Missing teacherId parameter" }, { status: 400 });
    }

    // Update all results for the teacher to be verified (irreversible)
    await prisma.result.updateMany({
      where: { teacherId },
      data: { verified: true },
    });

    return NextResponse.json({ message: "Results verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error verifying results:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}