import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const teacherId = url.searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json({ error: "Missing teacherId parameter" }, { status: 400 });
    }

    // Fetch all results grouped by subjects
    const results = await prisma.result.findMany({
      where: { 
        teacherId: teacherId, 
      },
      include: {
        student: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
    });

    if (results.length === 0) {
      return NextResponse.json({ error: "No results found for this teacher" }, { status: 404 });
    }

    // Organize results by subject
    const subjectMap: Record<string, any[]> = {};
    
    results.forEach((res) => {
      const subjectName = res.subject.name;
      if (!subjectMap[subjectName]) {
        subjectMap[subjectName] = [];
      }
      subjectMap[subjectName].push({
        Student_ID: res.student.id,
        Student_Name: res.student.name,
        Sessional_Exam: res.sessionalExam || "N/A",
        End_Term: res.endTerm ?? "N/A",
        Overall_Mark: res.overallMark,
        Grade: res.grade,
        Verified: res.verified ? "Yes" : "No",
      });
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    Object.keys(subjectMap).forEach((subject) => {
      const worksheet = XLSX.utils.json_to_sheet(subjectMap[subject]);
      XLSX.utils.book_append_sheet(workbook, worksheet, subject);
    });

    // Convert to buffer
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new Response(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="teacher_${teacherId}_results.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}