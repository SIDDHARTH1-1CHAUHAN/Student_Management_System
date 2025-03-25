import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  const id = parseInt(params.id);

  try {
    await prisma.result.update({
      where: { id },
      data: { verified: true },
    });

    return NextResponse.json({ message: "Result Verified" });
  } catch (error) {
    return NextResponse.json({ error: "Error verifying result" }, { status: 500 });
  }
}