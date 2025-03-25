"use client";

import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const GeneratetranscriptCertificatesPage = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadAlltranscriptCertificates = async () => {
    try {
      setLoading(true);
      setProgress(0);

      // Fetch all 8th semester students
      const response = await fetch("/api/students");
      
      if (!response.ok) {
        throw new Error("Failed to fetch 8th semester students");
      }
      
      const students = await response.json();
      const totalStudents = students.length;
      
      if (totalStudents === 0) {
        alert("No 8th semester students found");
        setLoading(false);
        return;
      }

      // Create a new ZIP file
      const zip = new JSZip();
      
      // Process each student
      for (let i = 0; i < totalStudents; i++) {
        const student = students[i];
        
        // Generate PDF for this student
        const pdfResponse = await fetch(`/api/certficates/transcript?studentId=${student.id}`);
        
        if (!pdfResponse.ok) {
          console.error(`Failed to generate certificate for ${student.name}`);
          continue;
        }
        
        const pdfBlob = await pdfResponse.blob();
        
        // Add this PDF to the ZIP file
        zip.file(`${student.name}_transcript_certificate.pdf`, pdfBlob);
        
        // Update progress
        setProgress(Math.round(((i + 1) / totalStudents) * 100));
      }
      
      // Generate the ZIP file
      const zipContent = await zip.generateAsync({ type: "blob" });
      
      // Download the ZIP file
      saveAs(zipContent, "transcript_certificates.zip");
      
      setLoading(false);
    } catch (error) {
      console.error("Error generating certificates:", error);
      alert("Error generating certificates. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate transcript Certificates</h2>
      <p className="mb-6 text-gray-600">
        Download transcript certificates for all eligible students.
      </p>
      
      <button
        onClick={downloadAlltranscriptCertificates}
        disabled={loading}
        className="py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-400"
      >
        {loading ? "Generating..." : "Download All Certificates"}
      </button>
      
      {loading && (
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Generating certificates: {progress}% complete
          </p>
        </div>
      )}
    </div>
  );
};

export default GeneratetranscriptCertificatesPage;