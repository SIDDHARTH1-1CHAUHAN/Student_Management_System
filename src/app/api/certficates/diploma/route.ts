import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jsPDF } from "jspdf";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Fetch the student with branch information
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { branch: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Create PDF document
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const currentDate = new Date();
    const formattedDate = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    const createdDate = new Date(student.createdAt);

    const graduationYear = createdDate.getFullYear() + 4;
  
    // Set font
    doc.setFont('helvetica');
    
    // Base coordinates from the document
    // A4 size: 210x297mm, scaling from the document dimensions
    const scale = 0.24;
    const certificateNumber = `${student.id.substring(0, 3)}`;
    // Add exact content from DIPLOMAIT2010.doc
    doc.setFontSize(17);
    doc.text(` ${student.username}`, 163 * scale, (1234 - 1160) * scale);
    doc.text(`${certificateNumber}`,230,(1234 - 1160) * scale);
    doc.text(`${student.name.toUpperCase()}`, 260* scale, (1234 - 648) * scale);
    doc.text(`${student.fatherName.toUpperCase()}`, 260 * scale, (1234 - 580) * scale);
    doc.setFontSize(12);
    // U doc.setFontSize(12);se exact date from document
    doc.setFontSize(14);
    doc.text(`July,${graduationYear}`, 226 * scale, (1234 - 363) * scale);
    
    // Use exact expiry date from document
    doc.text(`${formattedDate}`, 133 * scale, (1234 - 85) * scale);
    
    // Add other content as per the exact document structure
    doc.setFontSize(12);
  //   doc.text(`DIPLOMA IN ${student.branch.name.toUpperCase()}`, 176 * scale, (1234 - 900) * scale);
    

    // Generate PDF output
    const pdfOutput = doc.output("arraybuffer");

    return new Response(pdfOutput, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${student.name}_diploma_certificate.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating diploma certificate:", error);
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
  }
}
