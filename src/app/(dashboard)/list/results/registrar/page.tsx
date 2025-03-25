"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Result {
  teacherId: string;
  teacherName: string;
  subjectName: string;
  verified: boolean;
}

export default function RegistrarResultsPage() {
  const [results, setResults] = useState<Record<string, { teacherName: string; subjects: string[]; verified: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/results/list")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch results");
        return res.json();
      })
      .then((data) => {
        console.log("Fetched data:", data); // Debugging log

        // Group results by teacher
        const groupedResults: Record<string, { teacherName: string; subjects: string[]; verified: boolean }> = {};

        data.forEach((res: Result) => {
          if (!groupedResults[res.teacherId]) {
            groupedResults[res.teacherId] = { teacherName: res.teacherName, subjects: [], verified: res.verified };
          }
          if (!groupedResults[res.teacherId].subjects.includes(res.subjectName)) {
            groupedResults[res.teacherId].subjects.push(res.subjectName);
          }
        });

        setResults(groupedResults);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching results:", err);
        setLoading(false);
      });
  }, []);

  // Function to trigger confirmation popup
  const handleVerifyClick = (teacherId: string) => {
    setSelectedTeacher(teacherId);
    setShowConfirm(true);
  };

  // Function to verify results
  const handleVerify = async () => {
    if (!selectedTeacher) return;

    try {
      const res = await fetch("/api/results/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: selectedTeacher }),
      });

      if (!res.ok) {
        throw new Error("Failed to verify results");
      }

      // Update state to reflect verification
      setResults((prevResults) => ({
        ...prevResults,
        [selectedTeacher]: { ...prevResults[selectedTeacher], verified: true },
      }));

      setShowConfirm(false);
      setSelectedTeacher(null);
    } catch (error) {
      console.error("Error verifying results:", error);
    }
  };

  if (loading) return <div>Loading results...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Uploaded Results</h1>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Teacher</th>
            <th className="border p-2">Subjects</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Download</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(results).length > 0 ? (
            Object.entries(results).map(([teacherId, data]) => (
              <tr key={teacherId} className="border">
                <td className="border p-2">{data.teacherName}</td>
                <td className="border p-2">{data.subjects.join(", ")}</td>
                <td className={`border p-2 ${data.verified ? "text-green-600" : "text-red-600"}`}>
                  {data.verified ? "Verified" : "Unverified"}
                </td>
                <td className="border p-2">
                  <Link
                    href={`/api/results/export?teacherId=${teacherId}`}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Download All Results (Excel)
                  </Link>
                </td>
                <td className="border p-2">
                  {!data.verified && (
                    <button
                      onClick={() => handleVerifyClick(teacherId)}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center p-4">
                No results available.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Confirm Verification</h2>
            <p>Are you sure you want to verify this teacher's results? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}