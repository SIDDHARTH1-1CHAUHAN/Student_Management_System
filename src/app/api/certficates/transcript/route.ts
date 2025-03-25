import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jsPDF } from "jspdf";

// Helper interface for subject abbreviations
interface SubjectAbbreviation {
  code: string;
  name: string;
}

// Helper interface for gender-specific terms
interface GenderTerms {
  title: string;      // Mr./Mrs./Mx.
  pronoun: string;    // he/she/they
  possessive: string; // his/her/their
  childOf: string;    // s/o (son of) or d/o (daughter of)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Fetch the student with branch information and results with subjects
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { 
        branch: true,
        semester: true,
        results: {
          include: {
            subject: true
          }
        }
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Helper function to get gender-specific terms
    const getGenderTerms = (sex: string | null): GenderTerms => {
      if (sex === 'FEMALE') {
        return {
          title: 'Miss.',
          pronoun: 'she',
          possessive: 'her',
          childOf: 'd/o'
        };
      } else if (sex === 'other') {
        return {
          title: 'Mx.',
          pronoun: 'they',
          possessive: 'their',
          childOf: 'c/o'
        };
      } else {
        // Default to male terms if null or unspecified
        return {
          title: 'Mr.',
          pronoun: 'he',
          possessive: 'his',
          childOf: 's/o'
        };
      }
    };

    // Helper function to group results by semester
    const groupResultsBySemester = (results: any[]) => {
      const grouped: Record<number, any[]> = {};
      
      results.forEach(result => {
        const semesterNumber = result.subject.semesterId;
        if (semesterNumber !== null) {
          if (!grouped[semesterNumber]) {
            grouped[semesterNumber] = [];
          }
          grouped[semesterNumber].push(result);
        }
      });
      
      return grouped;
    };

    // Helper function to get semester superscript
    const getSemesterSuperscript = (num: number): string => {
      if (num === 1) return 'st';
      if (num === 2) return 'nd';
      if (num === 3) return 'rd';
      return 'th';
    };

    // Helper function to get subject code abbreviation
    const getSubjectCode = (subjectName: string, subjectCode: string): string => {
      // If subject code is provided, use it
      if (subjectCode && subjectCode.trim().length > 0) {
        return subjectCode;
      }
      
      // Otherwise create abbreviation from subject name
      return subjectName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();
    };

    // Create PDF document
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    // Set font
    doc.setFont('times');
      
    // Current date for formatting
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()} ${currentDate.toLocaleString('default', { month: 'long' })}, ${currentDate.getFullYear()}`;
    
    // Format birthday date for display
    const birthdayYear = student.birthday.getFullYear();
    
    // Default start/end dates if not provided
    const courseStartDate = startDate || `September ${birthdayYear}`;
    const courseEndDate = endDate || `July ${birthdayYear + 4}`;
    
    // Get gender-specific terms
    const genderTerms = getGenderTerms(student.sex);
    
    // Add date at top
    doc.setFontSize(12);
    doc.text(`Dated: ${formattedDate}`, 90, 38);
    
    // Add TRANSCRIPT header
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text('TRANSCRIPT', 105, 42, { align: 'center' });
    doc.setFont('times', 'normal');
    
    // Add first paragraph with student details (like marksheet)
    doc.setFontSize(10);
    const fullText = `Certified that ${genderTerms.title} ${student.name}, Roll No. ${student.username}, ${genderTerms.childOf} Shri ${student.fatherName}, has been a bonafide student of this Institute from ${courseStartDate} to ${courseEndDate}. ${genderTerms.title === 'Mx.' ? 'They' : genderTerms.pronoun.charAt(0).toUpperCase() + genderTerms.pronoun.slice(1)} successfully completed the course on "${student.branch.name}" (4-Year), in ${courseEndDate} after passing all the eight semesters.`;

    // Set the starting position for the text
    let xPos = 20;
    let yPos = 50;  // Starting Y position for the first paragraph (reduced)

    // Split the text into lines if it exceeds the width
    const lines = doc.splitTextToSize(fullText, 170); // 170 is the width for the text

    // Adjust yPos based on the number of lines and add the text
    doc.text(lines, xPos, yPos);
    
    // Add additional line about transcript issuance
    doc.text(`This transcript is being issued to ${student.name} at ${genderTerms.possessive} own request for higher education`, 20, yPos + 13);

    // Update yPos after the paragraph has been added
    yPos += lines.length * 5 + 5; // Increase Y position based on the number of lines plus additional line

    // Add second paragraph for marks details
    const detailText = `Following is the detail of the marks secured by ${genderTerms.pronoun} in the eight Semesters during ${genderTerms.possessive} study at this institute.`;
    doc.text(detailText, 20, yPos);
    
    // Starting Y position for semester tables
    let yPosition = yPos + 8;
    
    // Group results by semester
    const semesterResults = groupResultsBySemester(student.results);
    
    // Reduced spacing between each semester table
    const semesterSpacing = 20; // Reduced from the previous value
    
    // Add each semester's marks
    
    Object.keys(semesterResults).forEach((semKey, semesterIndex) => {
      const semesterNumber = parseInt(semKey);
      const semResults = semesterResults[semesterNumber];
      
      // Semester header with superscript
      doc.setFont('helvetica', 'normal');
      const superscript = getSemesterSuperscript(semesterNumber);
      const semHeader = `${semesterNumber}${superscript} Semester`;
      doc.text(semHeader, 105, yPosition, { align: 'left' });
      doc.setFont('helvetica', 'normal');
      
      yPosition += 1; // Reduced from 10
      
      // Headers for the table (like marksheet)
      const tableX = 20;
      const tableY = yPosition;
      
      const numSubjects = Math.min(semResults.length, 9); // Max 9 subjects
      
      // Calculate column widths
      const firstColWidth = 18;
      const lastColWidth = 25;
      const availableWidth = 170 - firstColWidth - lastColWidth;
      const subjectColWidth = availableWidth / numSubjects;
      
      const tableWidth = firstColWidth + (subjectColWidth * numSubjects) + lastColWidth;
      
      // Draw header row
      doc.setFontSize(11);
      doc.setFont('helvetica');
      doc.rect(tableX, tableY, tableWidth, 7); // Header row box
      
      // Draw vertical dividers for header
      doc.line(tableX + firstColWidth, tableY, tableX + firstColWidth, tableY + 7);
      
      for (let i = 0; i < numSubjects; i++) {
        doc.line(
          tableX + firstColWidth + (i + 1) * subjectColWidth, 
          tableY, 
          tableX + firstColWidth + (i + 1) * subjectColWidth, 
          tableY + 7
        );
      }
      
      // Draw header texts (like marksheet)
      doc.text('Subject', tableX + 2, tableY + 4);
      
      for (let i = 0; i < numSubjects; i++) {
        const subjectCode = getSubjectCode(semResults[i].subject.name, semResults[i].subject.subjectCode || '');
        doc.text(
          subjectCode, 
          tableX + firstColWidth + (i * subjectColWidth) + (subjectColWidth / 2), 
          tableY + 4, 
          { align: 'center' }
        );
      }
      
      // Add Percentage header
      doc.text(
        'Percentage', 
        tableX + firstColWidth + (numSubjects * subjectColWidth) + (lastColWidth / 2), 
        tableY + 4, 
        { align: 'center' }
      );
      
      // Draw data row
      const dataY = tableY + 7;
      doc.setFont('helvetica', 'normal');
      doc.rect(tableX, dataY, tableWidth, 7); // Data row box
      
      // Draw vertical dividers for data
      doc.line(tableX + firstColWidth, dataY, tableX + firstColWidth, dataY + 7); // After "Marks"
      
      for (let i = 0; i < numSubjects; i++) {
        doc.line(
          tableX + firstColWidth + (i + 1) * subjectColWidth, 
          dataY, 
          tableX + firstColWidth + (i + 1) * subjectColWidth, 
          dataY + 7
        );
      }
      
      // Draw "Marks" text
      doc.text('Marks', tableX + 2, dataY + 4);
      
      // Total marks variables
      let totalMarks = 0;
      let totalMaxMarks = 0;
      
      // Add marks for each subject
      for (let i = 0; i < numSubjects; i++) {
        const result = semResults[i];
        const sessionalMarks = Number(result.sessionalExam) || 0;
        const endTermMarks = result.endTerm || 0;
        const totalSubjectMarks = sessionalMarks + Number(endTermMarks);
        const maxMarks = Number(result.overallMark) || 100;
        
        doc.text(
          `${totalSubjectMarks}/${maxMarks}`, 
          tableX + firstColWidth + (i * subjectColWidth) + (subjectColWidth / 2), 
          dataY + 4, 
          { align: 'center' }
        );
        
        totalMarks += totalSubjectMarks;
        totalMaxMarks += maxMarks;
      }
      
      const percentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : "0.0";
      
      doc.text(
        percentage, 
        tableX + firstColWidth + (numSubjects * subjectColWidth) + (lastColWidth / 2), 
        dataY + 4, 
        { align: 'center' }
      );
      
      // Move down for next semester with reduced spacing
      yPosition += semesterSpacing;
    });
    
    // Create a new page for subject abbreviations only after all semesters are done
    doc.addPage();
    
    // Add header for abbreviations page
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT ABBREVIATIONS', 105, 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    
    // Group all subject abbreviations by semester
    const subjectsBySemester: Record<number, SubjectAbbreviation[]> = {};
    
    // Collect all unique subjects across all semesters
    Object.keys(semesterResults).forEach(semKey => {
      const semesterNumber = parseInt(semKey);
      const semResults = semesterResults[semesterNumber];
      
      if (!subjectsBySemester[semesterNumber]) {
        subjectsBySemester[semesterNumber] = [];
      }
      
      semResults.forEach(result => {
        const code = getSubjectCode(result.subject.name, result.subject.subjectCode || '');
        subjectsBySemester[semesterNumber].push({
          code,
          name: result.subject.name
        });
      });
    });
    
    let abbrevYPos = 30;
    
    Object.keys(subjectsBySemester).forEach(semKey => {
      const semesterNumber = parseInt(semKey);
      const subjects = subjectsBySemester[semesterNumber];
      
      if (abbrevYPos > 250) {
        doc.addPage();
        abbrevYPos = 20;
      }
      
      // Semester header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const superscript = getSemesterSuperscript(semesterNumber);
      const semHeader = `${semesterNumber}${superscript} Semester Subjects`;
      doc.text(semHeader, 15, abbrevYPos);
      doc.setFont('helvetica', 'normal');
      
      abbrevYPos += 7;
      
      // Set up the table for abbreviations
      const tableX = 20;
      const codeColWidth = 20;
      const nameColWidth = 150;
      const tableWidth = codeColWidth + nameColWidth;
      
      // Draw header row
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.rect(tableX, abbrevYPos, tableWidth, 7); // Header row
      
      // Vertical divider for header
      doc.line(tableX + codeColWidth, abbrevYPos, tableX + codeColWidth, abbrevYPos + 7);
      
      // Header texts
      doc.text('Code', tableX + 2, abbrevYPos + 5);
      doc.text('Subject Name', tableX + codeColWidth + 2, abbrevYPos + 5);
      
      // Draw data rows for subjects
      doc.setFont('helvetica', 'normal');
      let currentY = abbrevYPos + 7;
      
      subjects.forEach((subject, index) => {
        // Draw row rectangle
        doc.rect(tableX, currentY, tableWidth, 7);
        
        // Draw vertical divider
        doc.line(tableX + codeColWidth, currentY, tableX + codeColWidth, currentY + 7);
        
        // Add text
        doc.text(subject.code, tableX + 2, currentY + 5);
        doc.text(subject.name, tableX + codeColWidth + 2, currentY + 5);
        
        currentY += 7;
      });
      
      abbrevYPos = currentY + 10;
    });
    
    // Add signature spaces on first page
    doc.setPage(1);
    doc.setFontSize(10);
    
    // Adjusted bottom Y position to ensure signatures fit on the first page
    const bottomY = 276;
    
    doc.text('(Registrar)', 40, bottomY);
    doc.text('(Principal)', 140, bottomY);

    // Generate PDF output
    const pdfOutput = doc.output("arraybuffer");

    return new Response(pdfOutput, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${student.name}_transcript.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating transcript:", error);
    return NextResponse.json({ error: "Failed to generate transcript" }, { status: 500 });
  }
}