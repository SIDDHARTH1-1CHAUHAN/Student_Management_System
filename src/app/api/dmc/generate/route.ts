import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { updateProgress } from '../progress/route';

export async function POST(req: NextRequest) {
  try {
    const { semesterId } = await req.json();
    
    if (!semesterId) {
      return NextResponse.json({ success: false, message: 'Semester ID is required' }, { status: 400 });
    }
    
    // Find all students in the specified semester who have results
    const students = await prisma.student.findMany({
      where: {
        semesterId: parseInt(semesterId),
        results: {
          some: {} // Only include students who have at least one result
        }
      },
      include: {
        branch: { include: { _count: { select: { lectures: true } } } },
        semester: true,
        results: {
          include: { subject: true },
        }
      }
    });
    
    if (students.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No students found with results for the selected semester'
      }, { status: 404 });
    }
    
    // Reset progress tracking
    updateProgress(0, students.length);
    
    // Create a ZIP file to store all PDFs
    const zip = new JSZip();
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const folderName = `dmc_semester_${semesterId}_${timestamp}`;
    
    // Process each student and generate PDF
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      // Generate PDF for this student
      const pdfDoc = await generateStudentPDF(student);
      
      // Add the PDF to the ZIP file
      const fileName = `${student.name.replace(/\s+/g, '_')}_${student.username}.pdf`;
      zip.file(fileName, pdfDoc.output('arraybuffer'));
      
      // Update progress
      updateProgress(i + 1, students.length);
    }
    
    // Generate ZIP file as base64
    const zipContent = await zip.generateAsync({ type: 'base64' });
    const dataUrl = `data:application/zip;base64,${zipContent}`;
    
    // Return success response with download data
    return NextResponse.json({
      success: true,
      message: `Generated DMCs for ${students.length} students`,
      dataUrl: dataUrl,
      filename: `${folderName}.zip`
    });
    
  } catch (error) {
    console.error('Error generating DMCs:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to generate DMCs'
    }, { status: 500 });
  }
}

async function generateStudentPDF(student: any) {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Set font
  doc.setFont('helvetica');
  
  
  const scale = 0.24;
  
  // Top header section
  // Date (top right)
  doc.setFontSize(10);
  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate()} ${currentDate.toLocaleString('default', { month: 'long' })}, ${currentDate.getFullYear()}`;
  
  // Program information
  doc.setFontSize(12);
  // Roll number or username (top left)
  doc.text(student.username, 213 * scale, (1234 - 1130) * scale);
  
  // Diploma program name (centered)
  doc.text(`DIPLOMA IN ${student.branch.name.toUpperCase()}`, 176 * scale, (1234 - 962) * scale);
  
  // Determine semester period based on semester number
  const getSemesterPeriod = () => {
    const currentYear = new Date().getFullYear();
    const semesterNumber = Number(student.semesterId);
    
    if (semesterNumber % 2 === 0) {
      return `FEBRUARY ${currentYear} to JUNE ${currentYear}`;
    } else {
      return `JULY ${currentYear} to JANUARY ${currentYear}`;
    }
  };
  
  // Semester period based on odd/even semester
  const semesterPeriod = getSemesterPeriod();
  doc.text(semesterPeriod, 310 * scale, (1234 - 882) * scale);
  doc.text(` ${student.semesterId}`, 570 * scale, (1234 - 900) * scale);
  
  // Student information
  doc.setFontSize(11);
  // Student name
  doc.text(student.name.toUpperCase(), 357 * scale, (1234 - 830) * scale);
  
  // Father's name
  doc.text(student.fatherName.toUpperCase(), 357 * scale, (1234 - 791) * scale);
  
  // Mother's name (if available)
  doc.text(student.motherName?.toUpperCase() || 'MOTHER NAME', 359 * scale, (1234 - 755) * scale);
  
  // Roll number again
  doc.text(student.username, 359 * scale, (1234 - 715) * scale);
  
  // Subjects with marks - using exact positions from document
  doc.setFontSize(10);
  
  // Calculate totals for summary
  let totalMarks = 0;
  let totalMaxMarks = 0;
  
  // The starting positions for subjects based on original document
  const subjectStartY = 1234 - 610; // From bottom of page
  const yIncrement = 26; // Space between subjects
  
  student.results.forEach((result: any, index: number) => {
    if (index >= 8) return; // Only display up to 8 subjects as in the original
    
    // Serial number
    doc.text(`${index + 1}`, 78 * scale, (subjectStartY + index * yIncrement) * scale);
    
    // Subject name
    doc.text(result.subject.name, 120 * scale, (subjectStartY + index * yIncrement) * scale);
    
    // Calculate sessional and end term marks
    const sessionalMarks = Number(result.sessionalExam) || 0;
    const endTermMarks = Number(result.endTerm) || 0;
    const sessionalMax = 50;
    const endTermMax = result.overallMark || 100;
    
    // Sessional marks
    doc.text(`${sessionalMarks}/${sessionalMax}`, 585 * scale, (subjectStartY + index * yIncrement) * scale);
    
    // End term marks
    doc.text(`${endTermMarks}/${endTermMax}`, 680 * scale, (subjectStartY + index * yIncrement) * scale);
    
    // Calculate grade based on percentage
    const totalSubjectMarks = sessionalMarks + endTermMarks;
    const totalSubjectMaxMarks = sessionalMax + endTermMax;
    const percentage = (totalSubjectMarks / totalSubjectMaxMarks) * 100;
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C+';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    
    // Add grade
    doc.text(grade, 773 * scale, (subjectStartY + index * yIncrement) * scale);
    
    // Update totals
    totalMarks += totalSubjectMarks;
    totalMaxMarks += totalSubjectMaxMarks;
  });
  
  // Add total marks at specific position based on original layout
  doc.setFontSize(12);
  doc.text(`${totalMarks}/${totalMaxMarks}`, 284 * scale, (1234 - 280) * scale);
  
  // Pass/Fail status based on original layout
  const percentage = (totalMarks / totalMaxMarks) * 100;
  doc.text(percentage >= 33 ? 'PASS' : 'FAIL', 284 * scale, (1234 - 249) * scale);
  
  // Add current date at the bottom
  doc.text(formattedDate, 187 * scale, (1234 - 100) * scale);
  
  return doc;
}