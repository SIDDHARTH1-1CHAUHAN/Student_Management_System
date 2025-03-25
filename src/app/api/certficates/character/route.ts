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
    doc.setFont('helvetica');
      
    // Add certificate content
    const currentDate = new Date();
    const formattedDate = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    const certificateNumber = `${currentDate.getFullYear()}-${student.id.substring(0, 3)}`;
    const createdAtDate = new Date(student.createdAt);
const fromMonthYear = `${createdAtDate.toLocaleString('default', { month: 'long' })} ${createdAtDate.getFullYear()}`;

// Current date for "to" date
const toMonthYear = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;

    // Add certificate number and date
    doc.setFontSize(14);
    doc.text(`No.Prin./Char/${certificateNumber}/ISTC `, 32, 79);
    doc.text(`Dated: ${formattedDate}`, 140, 79);
    
    doc.setFontSize(16);
    doc.text('CHARACTER CERTIFICATE', 105,97, { align: 'center' });
  
    doc.setLineWidth(0.5);
    doc.line(70, 98, 140, 98);
  
    doc.setFontSize(14);
    
    const text = `This is to certify that ${student.name.toUpperCase()}, Roll No. ${student.username}, S/o D/o Sh. ${student.fatherName.toUpperCase()} was a bonafide student of this institute from ${fromMonthYear} to ${toMonthYear}.`;

    const splitText = doc.splitTextToSize(text, 140);
    doc.text(splitText, 30, 110);
    
    
    doc.text('To the best of my knowledge, he/she bears a good moral character.', 29, 141);
    
   
    doc.text('(Principal)', 157, 163);
    // Generate PDF output
    const pdfOutput = doc.output("arraybuffer");

    return new Response(pdfOutput, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${student.name}_character_certificate.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating character certificate:", error);
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
  }
}
