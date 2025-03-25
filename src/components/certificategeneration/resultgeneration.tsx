'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

const GenerateResult = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [progress, setProgress] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [completedStudents, setCompletedStudents] = useState(0);

  // Array of semesters to choose from
  const semesters = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    label: `Semester ${i + 1}`
  }));

  // Handle the SSE connection for progress updates
  useEffect(() => {
    if (isLoading && totalStudents > 0) {
      const eventSource = new EventSource('/api/dmc/progress');
      
      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        setCompletedStudents(data.completed);
        setProgress(data.percentage);
        
        if (data.completed === data.total) {
          eventSource.close();
        }
      });
      
      eventSource.addEventListener('error', () => {
        eventSource.close();
      });
      
      return () => {
        eventSource.close();
      };
    }
  }, [isLoading, totalStudents]);

  const handleGenerateDMCs = async () => {
    if (!selectedSemester) {
      toast.error('Please select a semester');
      return;
    }

    try {
      setIsLoading(true);
      setProgress(0);
      setCompletedStudents(0);

      // First, get the count of students in this semester
      const countResponse = await fetch(`/api/dmc/count?semesterId=${selectedSemester}`);
      const { count } = await countResponse.json();
      
      setTotalStudents(count);
      
      if (count === 0) {
        toast.error('No students found for the selected semester');
        setIsLoading(false);
        return;
      }

      // Get student data from the API
      const response = await fetch('/api/dmc/generateresult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ semesterId: selectedSemester }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch student data');
      }

      const { success, message, students } = await response.json();
      
      if (success && students) {
        // Generate PDFs client-side and create a ZIP file
        await generatePDFsAndZip(students);
      } else {
        toast.error(message || 'Failed to generate DMCs');
      }
    } catch (error) {
      console.error('Error generating DMCs:', error);
      toast.error('Error generating DMCs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate PDFs on the client-side
  const generatePDFsAndZip = async (students: any[]) => {
    const zip = new JSZip();
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const folderName = `result_semester_${selectedSemester}_${timestamp}`;
    
    try {
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        
        // Generate PDF for this student (client-side)
        const pdfDoc = await generateStudentPDF(student);
        
        // Add the PDF to the ZIP file
        const fileName = `${student.name.replace(/\s+/g, '_')}_${student.username}.pdf`;
        zip.file(fileName, pdfDoc.output('arraybuffer'));
        
        // Update progress manually since we're doing this client-side now
        setCompletedStudents(i + 1);
        setProgress(((i + 1) / students.length) * 100);
      }
      
      // Generate and download the ZIP file
      const zipContent = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipContent);
      
      // Create a download link and trigger it
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `${folderName}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up the object URL
      URL.revokeObjectURL(downloadUrl);
      
      toast.success('DMC generation completed. Downloading ZIP file...');
    } catch (error) {
      console.error('Error generating PDFs:', error);
      toast.error('Error generating PDFs. Please try again.');
    }
  };

  // Client-side PDF generation function
  interface Student {
    name: string;
    fatherName: string;
    motherName?: string;
    username: string;
    branch: { name: string };
    semesterId: number;
    createdAt: string;
    results: {
      subject: { id: string; name: string };
      sessionalExam: number;
      endTerm: number;
      overallMark: number;
    }[];
  }

  const generateStudentPDF = async (student: Student) => {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate graduation year (student creation year + 4)
    const calculateGraduationYear = () => {
      const creationDate = new Date(student.createdAt);
      const graduationYear = creationDate.getFullYear() + 4;
      return graduationYear;
    };
    
    // Determine semester period based on semester number
    const getSemesterPeriod = () => {
      const currentYear = new Date().getFullYear();
      const semesterNumber = Number(student.semesterId);
      
      if (semesterNumber % 2 === 0) {
        return `FEBRUARY ${currentYear} to JUNE ${currentYear}`;
      } else {
        return `JULY ${currentYear} to JANUARY ${currentYear + 1}`;
      }
    };

    // Set font
    doc.setFont('helvetica');
    
    // A4 size: 210x297mm
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    
    // Add border to the document
    doc.setDrawColor(0, 51, 153); // Navy blue border
    doc.setLineWidth(0.5);
    doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
    
    // Add decorative inner border
    doc.setDrawColor(0, 102, 204); // Lighter blue
    doc.setLineWidth(0.2);
    doc.rect(margin + 3, margin + 3, pageWidth - 2 * (margin + 3), pageHeight - 2 * (margin + 3));

    // We can't use the image loading approach from server-side
    // Instead, use a simple text header or include a base64 encoded image
    
    const headerTop = 10;
    // Navy blue bar (similar to image)
    doc.setFillColor(0, 28, 99); // Dark navy blue
    doc.rect(margin, headerTop + 25, pageWidth - 2 * margin, 5, 'F');
    
    // Add header text instead of image
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102); // Dark blue
    doc.text("INDO SWISS TRAINING CENTRE", pageWidth / 2, headerTop + 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text("SECTOR 30-C, CHANDIGARH", pageWidth / 2, headerTop + 22, { align: 'center' });
    
    // Title - Detailed Marks Certificate
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102); // Dark blue
    doc.text("DETAILED MARKS CERTIFICATE", pageWidth / 2, headerTop + 40, { align: 'center' });
    
    // Serial number and Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()} ${currentDate.toLocaleString('default', { month: 'long' })}, ${currentDate.getFullYear()}`;
    doc.text(`Certificate No: ${Math.floor(Math.random() * 1000000)}`, margin, headerTop + 50);
    doc.text(`Date: ${formattedDate}`, pageWidth - margin, headerTop + 50, { align: 'right' });
    
    // Student details section
    doc.setDrawColor(0, 51, 153);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, headerTop + 55, pageWidth - 2 * margin, 50, 2, 2);
    
    // Student details - Left column headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Student Name:", margin + 5, headerTop + 65);
    doc.text("Father's Name:", margin + 5, headerTop + 75);
    doc.text("Mother's Name:", margin + 5, headerTop + 85);
    doc.text("Roll Number:", margin + 5, headerTop + 95);
    
    // Student details - Right column headers
    doc.text("Branch:", pageWidth / 2 + 5, headerTop + 65);
    doc.text("Semester:", pageWidth / 2 + 5, headerTop + 75);
    doc.text("Semester Period:", pageWidth / 2 + 5, headerTop + 85);
    doc.text("Academic Year:", pageWidth / 2 + 5, headerTop + 95);
    
    // Student details - Values (left column)
    doc.setFont('helvetica', 'normal');
    doc.text(student.name.toUpperCase(), margin + 40, headerTop + 65);
    doc.text(student.fatherName.toUpperCase(), margin + 40, headerTop + 75);
    doc.text(student.motherName?.toUpperCase() || 'N/A', margin + 40, headerTop + 85);
    doc.text(student.username, margin + 40, headerTop + 95);
    
    // Student details - Values (right column)
    doc.text(student.branch.name.toUpperCase(), pageWidth / 2 + 40, headerTop + 65);
    doc.text(`${student.semesterId}`, pageWidth / 2 + 40, headerTop + 75);
    doc.text(getSemesterPeriod(), pageWidth / 2 + 40, headerTop + 85);
    const graduationYear = calculateGraduationYear();
    doc.text(`${graduationYear - 4} - ${graduationYear}`, pageWidth / 2 + 40, headerTop + 95);
    
    // Marks section - Table header
    const tableTop = headerTop + 115;
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, tableTop, pageWidth - 2 * margin, 10, 'F');
    
    // Adjusted column widths to fit everything properly
    const col1 = margin + 7;      // S.No.
    const col2 = margin + 24;     // Subject Code
    const col3 = margin + 53;     // Subject Name
    const col4 = margin + 85;     // Sessional
    const col5 = margin + 105;    // End Term
    const col6 = margin + 130;    // Total
    const col7 = margin + 158;    // Grade
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text("S.No.", col1, tableTop + 6);
    doc.text("Subject Code", col2, tableTop + 6);
    doc.text("Subject Name", col3, tableTop + 6);
    doc.text("Sessional", col4, tableTop + 6);
    doc.text("End Term", col5, tableTop + 6);
    doc.text("Total", col6, tableTop + 6);
    doc.text("Grade", col7, tableTop + 6);
    
    // Draw vertical lines for table columns
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(col2 - 5, tableTop, col2 - 5, tableTop + 10 + (8 * 8)); // After S.No.
    doc.line(col3 - 5, tableTop, col3 - 5, tableTop + 10 + (8 * 8)); // After Subject Code
    doc.line(col4 - 5, tableTop, col4 - 5, tableTop + 10 + (8 * 8)); // After Subject Name
    doc.line(col5 - 5, tableTop, col5 - 5, tableTop + 10 + (8 * 8)); // After Sessional
    doc.line(col6 - 5, tableTop, col6 - 5, tableTop + 10 + (8 * 8)); // After End Term
    doc.line(col7 - 5, tableTop, col7 - 5, tableTop + 10 + (8 * 8)); // After Total
    
    // Marks section - Data rows
    doc.setFont('helvetica', 'normal');
    
    // Calculate totals for summary
    let totalMarks = 0;
    let totalMaxMarks = 0;
    
    student.results.forEach((result, index) => {
      if (index >= 8) return; // Only display up to 8 subjects
      
      const yPos = tableTop + 15 + (index * 8);
      
      // Add alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
      }
      
      // Draw horizontal line for row
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos + 4, pageWidth - margin, yPos + 4);
      
      // Serial number
      doc.text(`${index + 1}`, col1, yPos);
      
      // Subject code
      doc.text(`${result.subject.id || 'SUB' + (index + 101)}`, col2, yPos);
      
      // Subject name - ensure it doesn't overflow
      const subjectName = result.subject.name;
      if (subjectName.length > 30) {
        doc.text(subjectName.substring(0, 27) + '...', col3, yPos);
      } else {
        doc.text(subjectName, col3, yPos);
      }
      
      // Calculate sessional and end term marks
      const sessionalMarks = Number(result.sessionalExam) || 0;
      const endTermMarks = Number(result.endTerm) || 0;
      const sessionalMax = 50;
      const endTermMax = result.overallMark || 100;
      
      // Sessional marks
      doc.text(`${sessionalMarks}/${sessionalMax}`, col4, yPos);
      
      // End term marks
      doc.text(`${endTermMarks}/${endTermMax}`, col5, yPos);
      
      // Total marks
      const totalSubjectMarks = sessionalMarks + endTermMarks;
      const totalSubjectMaxMarks = sessionalMax + endTermMax;
      doc.text(`${totalSubjectMarks}/${totalSubjectMaxMarks}`, col6, yPos);
      
      // Calculate grade based on percentage
      const percentage = (totalSubjectMarks / totalSubjectMaxMarks) * 100;
      
      let grade = 'F';
      if (percentage >= 90) grade = 'A';
      else if (percentage >= 80) grade = 'B';
      else if (percentage >= 70) grade = 'C+';
      else if (percentage >= 60) grade = 'C';
      else if (percentage >= 50) grade = 'D';
      
      // Add grade
      doc.text(grade, col7, yPos);
      
      // Update totals
      totalMarks += totalSubjectMarks;
      totalMaxMarks += totalSubjectMaxMarks;
    });
    
    // Summary section
    const summaryTop = tableTop + 15 + (8 * 8) + 10;
    
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, summaryTop, pageWidth - 2 * margin, 30, 'F');
    
    // Overall percentage and result
    const percentage = (totalMarks / totalMaxMarks) * 100;
    const result = percentage >= 33 ? 'PASS' : 'FAIL';
    let division = '';
    
    if (percentage >= 60) division = 'FIRST DIVISION';
    else if (percentage >= 45) division = 'SECOND DIVISION';
    else if (percentage >= 33) division = 'THIRD DIVISION';
    
    doc.setFont('helvetica', 'bold');
    doc.text("Total Marks:", margin + 5, summaryTop + 10);
    doc.text("Percentage:", margin + 5, summaryTop + 20);
    doc.text("Result:", pageWidth / 2, summaryTop + 10);
    doc.text("Division:", pageWidth / 2, summaryTop + 20);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${totalMarks}/${totalMaxMarks}`, margin + 40, summaryTop + 10);
    doc.text(`${percentage.toFixed(2)}%`, margin + 40, summaryTop + 20);
    doc.text(result, pageWidth / 2 + 40, summaryTop + 10);
    doc.text(division, pageWidth / 2 + 40, summaryTop + 20);
    
    // Signature section
    const signatureTop = summaryTop + 40;
    
    doc.text("______________________", margin + 20, signatureTop + 5);
    doc.text("Principal", margin + 30, signatureTop + 10);
    
    doc.text("______________________", pageWidth - margin - 50, signatureTop + 5);
    doc.text("Examination Controller", pageWidth - margin - 60, signatureTop + 10);
    
    doc.setDrawColor(0, 51, 153);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - margin - 15, pageWidth - margin, pageHeight - margin - 15);
    
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("INDO SWISS TRAINING CENTRE, SECTOR 30-C, CHANDIGARH - 160030", pageWidth / 2, pageHeight - margin - 10, { align: 'center' });
    
    return doc;
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate Result for Multiple Students</h2>
      
      <div className="mb-6">
        <label htmlFor="semester" className="block text-gray-700 font-medium mb-2">
          Select Semester
        </label>
        <div className="relative">
          <select
            id="semester"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="block w-full py-3 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="">Select a semester</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && totalStudents > 0 && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            Processing {completedStudents} of {totalStudents} students ({Math.round(progress)}%)
          </p>
        </div>
      )}

      <button
        onClick={handleGenerateDMCs}
        disabled={isLoading || !selectedSemester}
        className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <Loader2 className="animate-spin mr-2 h-5 w-5" />
            Generating Result...
          </span>
        ) : (
          'Generate Result'
        )}
      </button>
    </div>
  );
};

export default GenerateResult;