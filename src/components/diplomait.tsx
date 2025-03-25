'use client';

import { useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Student, Branch } from '@prisma/client';

interface DiplomaProps {
  student: Student & {
    branch: Branch;
  };
}

const DiplomaGenerator = ({ student }: DiplomaProps) => {
  
  const handleDownload = async () => {
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
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
      
      // Save the PDF with exact same filename structure
      doc.save(`${student.username}_diploma.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="p-3 rounded-md bg-green-100 hover:bg-green-200"
    >
      Download Diploma Certificate
    </button>
  );
};

export default DiplomaGenerator;