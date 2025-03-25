import { NextResponse } from "next/server";
import * as xlsx from "xlsx";
import prisma from "@/lib/prisma";
import { writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import { NextRequest } from "next/server";
import { UserSex } from "@prisma/client/wasm";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const branchId = parseInt(formData.get("branchId") as string);
    const semesterId = parseInt(formData.get("semesterId") as string);
    const file = formData.get("file") as Blob;

    if (!branchId || !semesterId || !file) {
      return NextResponse.json(
        { success: false, error: "Missing file, Branch ID, or Semester ID." },
        { status: 400 }
      );
    }
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, "uploaded.xlsx");
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
    
    const studentData = xlsx.utils.sheet_to_json<{
      Name: string;
      RollNo: string;
      "Father Name": string;
      "Mother Name": string;
      Birthday: Date,
      Phone: string,
      Email: string,
      Address: string,
      "Blood Type" : string,
      Sex : UserSex,
    }>(sheet);

    if (!studentData.every((row) => row.Name && row.RollNo && row["Father Name"] && row["Mother Name"])) {
      return NextResponse.json({ success: false, error: "Invalid Excel columns." }, { status: 400 });
    }

    const students = studentData.map((row) => ({
      name: row.Name,
      username: row.RollNo,
      fatherName: row["Father Name"],
      motherName: row["Mother Name"],
      password: "defaultPassword",
      birthday: new Date(row.Birthday), 
      phone: row.Phone ? String(row.Phone) : "",
      email: row.Email,
      address: row.Address,
      bloodType: row["Blood Type"],
      branchId,
      semesterId,
    }));

    await prisma.student.createMany({ data: students, skipDuplicates: false });

    return NextResponse.json({ success: true, message: "Students imported successfully" });
  } catch (error) {
    console.error("Error importing students:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
}