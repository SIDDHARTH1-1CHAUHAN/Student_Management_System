import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import type { Result, Student, Subject, Branch, Prisma, Teacher } from "@prisma/client";
import StudentResultDownload from "@/components/StudentResultDownload";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ResultFilters } from "@/components/Filter";

type ResultList = Result & { student: Student; subject: Subject; branch: Branch; teacher: Teacher };

const ResultListPage = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {

  const user = await currentUser();
  const teacherId = user?.id; 
  const role = user?.publicMetadata?.role as string | undefined;

  const columns = [
    { header: "Student Name", accessor: "student.name", className: "hidden md:table-cell" },
    { header: "Marks", accessor: "overallMark", className: "hidden md:table-cell" },
    { header: "Subject", accessor: "subject.name", className: "hidden md:table-cell" },
    { header: "Actions", accessor: "action" },
  ];

  const renderRow = (item: ResultList) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
      <td className="hidden md:table-cell">{item.student.name}</td>
      <td className="hidden md:table-cell">{item.overallMark}</td>
      <td className="hidden md:table-cell">{item.subject.name}</td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "registrar" || role === "teacher") && (
            <>
              <FormContainer table="result" type="update" data={item} />
              <FormContainer table="result" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, branchId, semester, subjectId, ...queryParams } = searchParams;
  const p = page ? Number.parseInt(page) : 1;

  const query: Prisma.ResultWhereInput = {};
  if (queryParams.studentName) {
    query.student = { name: { contains: queryParams.studentName, mode: "insensitive" } };
  }
  if (branchId) {
    query.student = { ...query.student, branchId: Number.parseInt(branchId) };
  }
  if (semester) {
    query.student = { ...query.student, semesterId: Number.parseInt(semester) };
  }
  let allowedSubjectIds: number[] = [];

  if (role === "teacher" && teacherId) {
    try {
      const teacherSubjects = await prisma.subject.findMany({
        where: { teachers: { some: { id: teacherId } } },
        select: { id: true },
      });

      allowedSubjectIds = teacherSubjects.map((subject) => subject.id);
      console.log("Allowed Subject IDs:", allowedSubjectIds);
      if (allowedSubjectIds.length === 0) {
        return (
          <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            <h1 className="text-lg font-semibold">All Results</h1>
            <p className="text-gray-500">You have no allotted subjects.</p>
          </div>
        );
      }
      if (subjectId) {
        const requestedSubjectId = Number.parseInt(subjectId);
        query.subjectId = allowedSubjectIds.includes(requestedSubjectId)
          ? requestedSubjectId
          : { in: [] }; 
      } else {
        query.subjectId = { in: allowedSubjectIds };
      }
    } catch (error) {
      console.error("Error fetching teacher subjects:", error);
    }
  } else if (subjectId) {
    query.subjectId = Number.parseInt(subjectId);
  }
  try {
    const [dataRes, count] = await prisma.$transaction([
      prisma.result.findMany({
        where: query,
        include: {
          student: {
            select: {
              name: true,
              branch: true,
              semester: true,
            },
          },
          subject: { select: { name: true } },
          teacher: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.result.count({ where: query }),
    ]);
    const data = dataRes.map((item) => ({ ...item }));
    const branches = await prisma.branch.findMany().catch(() => []);
    const semesters = await prisma.semester.findMany().catch(() => []);
    const subjects =
      role === "teacher"
        ? await prisma.subject
            .findMany({
              where: {
                id: { in: allowedSubjectIds },
              },
            })
            .catch(() => [])
        : await prisma.subject.findMany().catch(() => []);

    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold">All Results</h1>
        </div>
        <TableSearch />
        <ResultFilters
          branches={branches}
          semesters={semesters}
          subjects={subjects}
          branchId={branchId}
          semester={semester}
          subjectId={subjectId}
        />
        <Table columns={columns} data={data} renderRow={renderRow} />
        <Pagination page={p} count={count} itemsPerPage={ITEM_PER_PAGE} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching results:", error);
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold">All Results</h1>
        <p className="text-gray-500">Error loading results. Please try again later.</p>
      </div>
    );
  }
};

export default ResultListPage;