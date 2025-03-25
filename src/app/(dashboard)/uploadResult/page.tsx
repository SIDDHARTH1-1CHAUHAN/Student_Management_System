"use client";

import { useState } from "react";

interface UploadSectionProps {
  title: string;
  onUpload: (file: File | null) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ title, onUpload }) => {
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

    setLoading(true);
    setMessage("");

    try {
      await onUpload(file);
      setMessage("Upload successful.");
    } catch (error) {
      setMessage("An error occurred during the upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md w-full max-w-lg mx-auto mb-6">
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

export default function UploadResults() {
  const handleResultsUpload = async (file: File | null) => {
    if (!file) {
      throw new Error("File is required for results upload.");
    }

    const formData = new FormData();
    formData.append("file", file as Blob);

    try {
      const response = await fetch("/api/uploadResult", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Upload failed.");
      }
      return result.message;
    } catch (error) {
      throw new Error("An error occurred during the upload.");
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex flex-col items-center">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 font-mono">UPLOAD RESULTS</h1>
        <div className="h-1 w-36 bg-blue-700 mx-auto mt-3"></div>
      </div>

      <div className="w-full max-w-6xl bg-white p-8 rounded-xl shadow-lg border border-gray-200 mt-10">
        <h2 className="text-xl font-semibold text-white text-center bg-blue-800 p-4 rounded-md ">Results Excel File</h2>
        <UploadSection title="Results Excel File" onUpload={handleResultsUpload} />
      </div>
    </div>
  );
}