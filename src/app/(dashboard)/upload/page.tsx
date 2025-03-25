"use client";

import { useState } from "react";

interface UploadSectionProps {
  title: string;
  onUpload: (branchId: string | undefined, semesterId: string | undefined, file: File | null) => void;
  isTeacherUpload?: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ title, onUpload, isTeacherUpload }) => {
  const [branchId, setBranchId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    if (!isTeacherUpload && (!branchId || !semesterId)) {
      setMessage("Please enter Branch ID and Semester ID.");
      return;
    }

    setLoading(true);
    setMessage(""); // Reset the message

    try {
      await onUpload(isTeacherUpload ? undefined : branchId, isTeacherUpload ? undefined : semesterId, file);
      setMessage("Upload successful.");
    } catch (error) {
      setMessage("An error occurred during the upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-teal-50 p-6 rounded-lg shadow-md w-full max-w-lg mx-auto mb-6">
      {/* Form fields with more formal styling */}
      {!isTeacherUpload && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Branch ID</label>
          <input
            type="text"
            placeholder="Enter Branch ID"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
      )}

      {!isTeacherUpload && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Semester ID</label>
          <input
            type="text"
            placeholder="Enter Semester ID"
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-1">File Upload</label>
        <div className="border border-dashed border-gray-400 rounded-md p-4 bg-white">
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
          />
          <p className="text-xs text-gray-500 mt-2">Please upload Excel (.xlsx) files only</p>
        </div>
      </div>

      <button
        onClick={handleUpload}
        className={`w-full py-3 px-5 text-white font-medium rounded-md focus:outline-none transition-colors ${
          loading ? 'bg-blue-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        disabled={loading}
      >
        {loading ? "Processing..." : "Upload File"}
      </button>

      {message && (
        <div
          className={`mt-4 text-center p-3 rounded-md text-white text-sm ${
            message.includes("error") ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default function Upload() {
  // Handle student file upload
  const handleStudentUpload = async (branchId: string | undefined, semesterId: string | undefined, file: File | null) => {
    if (!semesterId) {
      throw new Error("SemesterID is required for student upload.");
    }

    const formData = new FormData();
    formData.append("file", file as Blob);
    formData.append("branchId", branchId || "");
    formData.append("semesterId", semesterId || "");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        return result.message;
      } else {
        throw new Error(result.error || "Upload failed.");
      }
    } catch (error) {
      throw new Error("An error occurred during the upload.");
    }
  };

  // Handle teacher file upload
  const handleTeacherUpload = async (branchId: string | undefined, semesterId: string | undefined, file: File | null) => {
    if (!file) {
      throw new Error("File is required for teacher upload.");
    }

    const formData = new FormData();
    formData.append("file", file as Blob);

    try {
      const response = await fetch("/api/uploadteacher", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        return result.updatedTeacherCount;
      } else {
        throw new Error(result.error || "Upload failed.");
      }
    } catch (error) {
      throw new Error("An error occurred during the upload.");
    }
  };

  // Handle subjects file upload
  const handleSubjectsUpload = async (branchId: string | undefined, semesterId: string | undefined, file: File | null) => {
    if (!file) {
      throw new Error("File is required for subjects upload.");
    }

    const formData = new FormData();
    formData.append("file", file as Blob);

    try {
      const response = await fetch("/api/uploadSubjects", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        return result.message;
      } else {
        throw new Error(result.error || "Upload failed.");
      }
    } catch (error) {
      throw new Error("An error occurred during the upload.");
    }
  };
  // Handle results file upload
  const handleResultsUpload = async (branchId: string | undefined, semesterId: string | undefined, file: File | null) => {
    if (!file) {
      throw new Error("File is required for results upload.");
    }

    const formData = new FormData();
    formData.append("file", file as Blob);

    try {
      const response = await fetch("/api/uploadResults", {
        method: "POST",
        body: formData,
    });

    const result = await response.json();
    if (response.ok) {
      return result.message;
    } else {
      throw new Error(result.error || "Upload failed.");
    }
  } catch (error) {
    throw new Error("An error occurred during the upload.");
  }
};


  return (
    <div className="p-8 bg-blue-50 min-h-screen flex flex-col items-center">
      {/* Header Section */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-blue-950 font-mono">UPLOAD FILES</h1>
        <div className="h-1 w-36 bg-red-500 mx-auto mt-3"></div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-10 w-full max-w-6xl">
        {/* Student Upload Section */}
        <div className="w-full lg:w-1/2 bg-teal-50 p-8 rounded-xl shadow-lg border border-blue-500">
          <h2 className="text-xl font-semibold text-center bg-blue-900 p-4 rounded-md text-white">Student Excel File</h2>
          <UploadSection title="Student Excel File" onUpload={handleStudentUpload} isTeacherUpload={false} />
        </div>
        
        {/* Teacher Upload Section */}
        <div className="w-full lg:w-1/2 bg-teal-50 p-8 rounded-xl shadow-lg border border-blue-500">
          <h2 className="text-xl font-semibold text-center bg-blue-900 p-4 rounded-md text-white">Teacher Excel File</h2>
          <UploadSection title="Teacher Excel File" onUpload={handleTeacherUpload} isTeacherUpload={true} />
        </div>
      </div>

      {/* Subjects Upload Section */}
      <div className="w-full max-w-6xl bg-teal-50 p-8 rounded-xl shadow-lg border border-blue-500 mt-10">
        <h2 className="text-xl font-semibold text-center bg-blue-900 p-4 rounded-md text-white">Subjects Excel File</h2>
        <UploadSection title="Subjects Excel File" onUpload={handleSubjectsUpload} isTeacherUpload={true} />
      </div>
      {/* Results Upload Section */}
      <div className="w-full max-w-6xl bg-teal-50 p-8 rounded-xl shadow-lg border border-blue-500 mt-10">
      <h2 className="text-xl font-semibold text-center bg-blue-900 p-4 rounded-md text-white">Results Excel File</h2>
      <UploadSection title="Results Excel File" onUpload={handleResultsUpload} isTeacherUpload={true} />
    </div>
    </div>
  );
}
