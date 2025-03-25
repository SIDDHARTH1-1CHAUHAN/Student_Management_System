"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Table from "@/components/Table";

interface Result {
  id: string;
  teacher: {
    id: string;
    name: string;
  };
  subject: {
    name: string;
  };
  excelFile?: string;
  verified: boolean;
}

interface ResultTableProps {
  results: Result[];
  role: string;
}

export default function ResultTable({ results, role }: ResultTableProps) {
  const [data, setData] = useState(results);
  const router = useRouter();

  const handleVerify = async (id) => {
    try {
      const res = await fetch(`/api/verify/${id}`, { method: "POST" });
      if (res.ok) {
        setData((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, verified: true } : item
          )
        );
        router.refresh(); // Refresh the table
      }
    } catch (error) {
      console.error("Verification failed:", error);
    }
  };

  const columns = [
    { header: "Teacher ID", accessor: "teacher.id" },
    { header: "Teacher Name", accessor: "teacher.name" },
    { header: "Subject", accessor: "subject.name" },
    { header: "Excel File", accessor: "excelFile" },
    { header: "Verified", accessor: "verified" },
    { header: "Actions", accessor: "action" },
  ];

  const renderRow = (item) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-gray-50">
      <td>{item.teacher.id}</td>
      <td>{item.teacher.name}</td>
      <td>{item.subject.name}</td>
      <td>
        {item.excelFile ? (
          <Link href={`/uploads/${item.excelFile}`} target="_blank">
            <button variant="outline">View File</button>
          </Link>
        ) : (
          <span className="text-gray-500">No File</span>
        )}
      </td>
      <td>
        {item.verified ? (
          <span className="text-green-600 font-bold">✔ Verified</span>
        ) : (
          <button onClick={() => handleVerify(item.id)} className="bg-blue-600 text-white">
            Verify
          </button>
        )}
      </td>
    </tr>
  );

  return <Table columns={columns} data={data} renderRow={renderRow} />;
}