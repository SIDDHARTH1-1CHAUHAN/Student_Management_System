import { NextResponse } from "next/server";
import * as xlsx from "xlsx";
import prisma from "@/lib/prisma";
import { writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import { NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as Blob; // Get the file from the form data

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Missing file" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, "uploadedteachers.xlsx");
    await writeFile(tempFilePath, uint8Array);

    if (!existsSync(tempFilePath)) {
      return NextResponse.json(
        { success: false, error: "File save failed." },
        { status: 400 }
      );
    }

    const fileBuffer = await readFile(tempFilePath);
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const teacherData = xlsx.utils.sheet_to_json<{
      Name: string;
      TeacherID: string;
    }>(sheet);

    if (!teacherData.every((row) => row.Name && row.TeacherID)) {
      return NextResponse.json(
        { success: false, error: "Invalid Excel columns." },
        { status: 400 }
      );
    }

    // Step 1: Create users in Clerk and store the user IDs
    // const usersWithIds = await Promise.all(
    //   teacherData.map(async (row) => {
    //     const user = await clerkClient.users.createUser({
    //       username: row.TeacherID,
    //       password: "defaultPassword",
    //       publicMetadata: { role: "teacher" },
    //     });
    //     return { userId: user.id, username: row.TeacherID, name: row.Name };
    //   })
    // );

    // // Step 2: Create teachers in Prisma using the user IDs from Clerk
    // const teachers = usersWithIds.map((user) => ({
    //   id: user.userId,  // Use the userId from Clerk
    //   name: user.name,
    //   username: user.username,
    //   password: "defaultPassword",
    // }));
    const teachers = teacherData.map((row) => ({
      name: row.Name.toUpperCase(),
      username: row.TeacherID,
      password: "defaultPassword",
    }));

    // Step 3: Create teachers in Prisma (bulk create)
    await prisma.teacher.createMany({
      data: teachers,
      skipDuplicates: false,  // or true depending on your needs
    });

    return NextResponse.json({
      success: true,
      message: "Teachers imported successfully",
    });
  } catch (error) {
    console.error("Error importing teachers:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
}
