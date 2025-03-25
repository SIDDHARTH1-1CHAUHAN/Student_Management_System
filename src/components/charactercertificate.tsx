'use client';

import { useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Student, Branch } from '@prisma/client';

interface CharacterCertificateProps {
  student: Student & {
    branch: Branch;
  };
}

const CharacterCertificate = ({ student }: CharacterCertificateProps) => {
  
  const handleDownload = async () => {
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set font
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
      
      // Save the PDF
      doc.save(`${student.name}_character_certificate.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <button 
      onClick={handleDownload}
      className="p-3 rounded-md bg-lamaSkyLight hover:bg-lamaSky transition-colors"
    >
      Download character certificate
    </button>
  );
};

export default CharacterCertificate;