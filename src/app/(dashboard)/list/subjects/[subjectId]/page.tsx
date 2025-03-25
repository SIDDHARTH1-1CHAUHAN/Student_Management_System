import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Branch, Prisma, Student } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

type StudentList = Student & { branch: Branch };

const SubjectDetailsPage = async ({
  params,
  searchParams,
}: {
  params: { subjectId: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const userId = sessionClaims?.sub;

  const subjectId = parseInt(params.subjectId);

  if (isNaN(subjectId)) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex-1 m-4 mt-0 border border-gray-100">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">Invalid Subject ID</h1>
        <p className="text-gray-500">The provided subject ID is not valid.</p>
      </div>
    );
  }

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });

  if (!subject) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex-1 m-4 mt-0 border border-gray-100">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">Subject Not Found</h1>
        <p className="text-gray-500">No subject found with the provided ID.</p>
      </div>
    );
  }

  const { page, search } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Fetch students with the same branchId and semesterId as the subject
  const query: Prisma.StudentWhereInput = {
    branchId: subject.branchId,
    semesterId: subject.semesterId,
  };

  if (search) {
    query.OR = [
      { name: { contains: search.toLowerCase() } },
      { email: { contains: search.toLowerCase() } },
      { username: { contains: search.toLowerCase() } },
    ];
  }

  const [students, count] = await prisma.$transaction([
    prisma.student.findMany({
      where: query,
      include: {
        branch: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.student.count({ where: query }),
  ]);

  const columns = [
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Student ID",
      accessor: "studentId",
      className: "hidden md:table-cell",
    },
    {
      header: "Gender",
      accessor: "gender",
      className: "hidden lg:table-cell",
    },
    ...(role === "admin" || role === "registrar" || role == 'teacher'
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: StudentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.branch.name}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.username}</td>
      <td className="hidden md:table-cell">{item.sex}</td>

      <td>
        <div className="flex items-center gap-2">
          {/* <Link href={`/list/students/${item.id}`}>
            <button className="flex items-center justify-center p-2 m-2 bg-blue-400 ">
              <>View</>
            </button>
          </Link> */}
          {(role === "admin" || role === "registrar") && (
            <FormContainer table="student" type="delete" id={item.id} />
          )}
          {(role === "teacher" || role === "registrar") && (
            <FormContainer table="result" type="create" data={{ student: item }} />
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex-1 m-4 mt-0 border border-gray-100">
      {/* Subject Details Section */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">{subject.name}</h1>
        <p className="text-gray-500">Subject Code: {subject.subjectCode}</p>
        <p className="text-gray-500">Type: {subject.type}</p>
        <p className="text-gray-500">Max Marks: {subject.maxMarks}</p>
        <p className="text-gray-500">Branch ID: {subject.branchId}</p>
        <p className="text-gray-500">Semester ID: {subject.semesterId}</p>
        {subject.fileUrl ? (
          <a
            href={`/api/files/${subject.fileUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline hover:text-red-500 hover:font-extrabold"
          >
            View Subject Curriculum
          </a>
        ) : (
          <p className="text-red-500 font-extrabold">No Curriculum updated yet</p>
        )}
      </div>

      {/* Student List Section */}
      <div className="mt-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-xl font-semibold text-gray-800 flex items-center">
              <span className="bg-blue-500 w-2 h-6 rounded mr-2 hidden md:block"></span>
              All the Students enrolled in - <span className="text-red-500"> {subject.name}</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1 hidden md:block">
              Students enrolled in - <span className="font-bold truncate">{subject.name} {`(${subject.subjectCode})`}</span>
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div className="w-full md:w-auto mb-3 md:mb-0">
              <TableSearch placeholder="Search students..." />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
          <Table columns={columns} renderRow={renderRow} data={students} />
        </div>

        <div className="mt-6 flex justify-center md:justify-end">
          <Pagination page={p} count={count} />
        </div>
      </div>
    </div>
  );
};

export default SubjectDetailsPage;