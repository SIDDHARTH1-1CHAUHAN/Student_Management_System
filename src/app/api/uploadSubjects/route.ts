import { NextResponse } from "next/server";
import * as xlsx from "xlsx";
import prisma from "@/lib/prisma";
import { writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import { NextRequest } from "next/server";
import { SubjectType } from "@prisma/client"; // Import the SubjectType enum

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Missing file" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, "uploadedsubjects.xlsx");
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

    const subjectData = xlsx.utils.sheet_to_json<{
      Name: string;
      SubjectCode: string;
      Type: string;
      MaxMarks: number;
      BranchName: string;
      SemesterNumber: number;
    }>(sheet);

    if (
      !subjectData.every(
        (row) =>
          row.Name &&
          row.SubjectCode &&
          row.Type &&
          row.BranchName &&
          row.SemesterNumber
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid Excel columns." },
        { status: 400 }
      );
    }

    const subjects = await Promise.all(
      subjectData.map(async (row) => {
        const branch = await prisma.branch.findUnique({
          where: { name: row.BranchName },
        });
        if (!branch) {
          throw new Error(`Branch '${row.BranchName}' not found`);
        }

        const semester = await prisma.semester.findFirst({
            where: {
              level: row.SemesterNumber,
              branchId: branch.id, // Use relation filtering
            },
          });
          
        if (!semester) {
          throw new Error(
            `Semester '${row.SemesterNumber}' not found for branch '${row.BranchName}'`
          );
        }

        return {
          name: row.Name,
          subjectCode: row.SubjectCode,
          type:
            row.Type.toUpperCase() === "PRACTICAL"
              ? SubjectType.PRACTICAL
              : SubjectType.THEORY, // Correctly using SubjectType enum
          maxMarks: row.MaxMarks,
          branchId: branch.id,
          semesterId: semester.id,
        };
      })
    );

    await prisma.subject.createMany({ data: subjects, skipDuplicates: false });

    return NextResponse.json({
      success: true,
      message: "Subjects imported successfully",
    });
  } catch (error) {
    console.error("Error importing subjects:", error);
    return NextResponse.json({
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
}
