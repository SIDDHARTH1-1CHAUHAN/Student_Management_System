"use client";

import { useRouter } from "next/navigation";
import { Branch, Semester, Subject } from "@prisma/client";
import { useEffect, useState } from "react";

interface FiltersProps {
  branches?: Branch[];
  semesters?: Semester[];
  subjects?: Subject[];
  branchId?: string;
  semester?: string;
  subjectId?: string;
}

export default function Filters({
  branches,
  semesters,
  selectedBranchId,
  selectedSemester,
}: {
  branches: { id: number; name: string }[];
  semesters: { id: number; level: number }[];
  selectedBranchId?: string;
  selectedSemester?: string;
}) {
  const router = useRouter();

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value;
    const url = new URL(window.location.href);
    if (branchId) {
      url.searchParams.set("branchId", branchId);
    } else {
      url.searchParams.delete("branchId");
    }
    router.push(url.toString());
  };

  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const semester = e.target.value;
    const url = new URL(window.location.href);
    if (semester) {
      url.searchParams.set("semester", semester);
    } else {
      url.searchParams.delete("semester");
    }
    router.push(url.toString());
  };

  return (
    <div className="flex items-center gap-2">
      {/* Branch Filter */}
      <select
        className="p-2 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
        value={selectedBranchId || ""}
        onChange={handleBranchChange}
      >
        <option value="">All Branches</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>

      {/* Semester Filter */}
      <select
        className="p-2 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
        value={selectedSemester || ""}
        onChange={handleSemesterChange}
      >
        <option value="">All Semesters</option>
        {semesters.map((sem) => (
          <option key={sem.id} value={sem.id}>
            Semester {sem.level}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TeacherFilter({
  branches = [],
  branchId,
}: {
  branches: { id: number; name: string }[];
  
  branchId?: string;
}) {
  const router = useRouter();

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value;
    const url = new URL(window.location.href);
    if (branchId) {
      url.searchParams.set("branchId", branchId);
    } else {
      url.searchParams.delete("branchId");
    }
    router.push(url.toString());
  };

  
  return (
    <div className="flex items-center gap-2">
      {/* Branch Filter */}
      <select
        className="p-2 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
        value={branchId || ""}
        onChange={handleBranchChange}
      >
        <option value="">All Branches</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ResultFilters({
  branches = [],
  semesters = [],
  subjects = [],
  branchId,
  semester,
  subjectId,
}: FiltersProps) {
  const router = useRouter();

  // State for dependent dropdowns
  const [filteredSemesters, setFilteredSemesters] = useState<Semester[]>(semesters);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>(subjects);

  // Update semesters when branch changes
  useEffect(() => {
    if (branchId) {
      const filtered = semesters.filter((sem) => sem.branchId === parseInt(branchId));
      setFilteredSemesters(filtered);
    } else {
      setFilteredSemesters(semesters);
    }
  }, [branchId, semesters]);

  // Update subjects when semester changes
  useEffect(() => {
    if (branchId && semester) {
      const filtered = subjects.filter(
        (sub) =>
          sub.branchId === parseInt(branchId) && sub.semesterId === parseInt(semester)
      );
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects(subjects);
    }
  }, [branchId, semester, subjects]);

  const handleFilterChange = (key: string, value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    router.replace(url.toString());
  };

  return (
    <div className="flex gap-4 my-4">
      {/* Branch Dropdown */}
      <select
        defaultValue={branchId || ""}
        onChange={(e) => handleFilterChange("branchId", e.target.value)}
        className="p-2 border rounded"
      >
        <option value="">Filter by Branch</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>

      {/* Semester Dropdown */}
      <select
        defaultValue={semester || ""}
        onChange={(e) => handleFilterChange("semester", e.target.value)}
        className="p-2 border rounded"
      >
        <option value="">Filter by Semester</option>
        {filteredSemesters.map((sem) => (
          <option key={sem.id} value={sem.level}>
            Semester {sem.level}
          </option>
        ))}
      </select>

      {/* Subject Dropdown */}
      <select
        defaultValue={subjectId || ""}
        onChange={(e) => handleFilterChange("subjectId", e.target.value)}
        className="p-2 border rounded"
      >
        <option value="">Filter by Subject</option>
        {filteredSubjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SubjectFilters({
  branches = [],
  semesters = [],
  branchId,
  semester,
}: FiltersProps) {
  const router = useRouter();

  // State for dependent dropdowns
  const [filteredSemesters, setFilteredSemesters] = useState<Semester[]>(semesters);

  // Update semesters when branch changes
  useEffect(() => {
    if (branchId) {
      const filtered = semesters.filter((sem) => sem.branchId === parseInt(branchId));
      setFilteredSemesters(filtered);
    } else {
      setFilteredSemesters(semesters);
    }
  }, [branchId, semesters]);

  const handleFilterChange = (key: string, value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    router.replace(url.toString());
  };

  return (
    <div className="flex gap-4">
      {/* Branch Dropdown */}
      <select
        defaultValue={branchId || ""}
        onChange={(e) => handleFilterChange("branchId", e.target.value)}
        className="p-2 border rounded"
      >
        <option value="">Filter by Branch</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>

      {/* Semester Dropdown */}
      <select
        defaultValue={semester || ""}
        onChange={(e) => handleFilterChange("semester", e.target.value)}
        className="p-2 border rounded"
      >
        <option value="">Filter by Semester</option>
        {filteredSemesters.map((sem) => (
          <option key={sem.id} value={sem.id}>
            Semester {sem.level}
          </option>
        ))}
      </select>
    </div>
  );
}