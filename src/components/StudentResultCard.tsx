"use client";

import React, { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface Subject {
  id: number;
  name: string;
  subjectCode: string;
  type: string;
  maxMarks: number;
  branchId: number;
  semesterId: number;
}

interface Student {
  id: string;
  name: string;
}

interface Result {
  subject: Subject | string; 
  sessionalExam: string;
  endTerm: string;
  overallMark: string;
  grade: string;
}

interface StudentResultCardProps {
  student: Student;
  results: Result[];
}

const StudentResultCard: React.FC<StudentResultCardProps> = ({
  student,
  results,
}) => {
  const resultRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!resultRef.current) return;

    const canvas = await html2canvas(resultRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save(`${student.name}_Result.pdf`);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl border border-gray-200">
      {/* Student Info */}
      <div ref={resultRef}>
        <h2 className="text-xl font-semibold text-gray-800">{student.name}</h2>
        <p className="text-sm text-gray-500 mb-4">Student ID: {student.id}</p>

        {/* Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm">
                <th className="p-2 border">Subject</th>
                <th className="p-2 border">Sessional Exam</th>
                <th className="p-2 border">End Term Exam</th>
                <th className="p-2 border">Overall Marks</th>
                <th className="p-2 border">Grade</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index} className="text-sm text-gray-800 border-t">
                  {/* ✅ Ensure subject name is displayed properly */}
                  <td className="p-2 border">
                    {typeof result.subject === "object" ? result.subject.name : result.subject}
                  </td>
                  <td className={`p-2 border ${result.sessionalExam === "-" ? "text-gray-400" : "text-gray-800"}`}>
                    {result.sessionalExam}
                  </td>
                  <td className="p-2 border">{result.endTerm}</td>
                  <td className="p-2 border">{result.overallMark}</td>
                  <td className="p-2 border">{result.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={generatePDF}
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
      >
        Download PDF
      </button>
    </div>
  );
};

export default StudentResultCard;