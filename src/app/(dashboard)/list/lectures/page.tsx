import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Branch, Lectures, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type LectruesList = Lectures & { subject: Subject } & { branch: Branch } & {
  teacher: Teacher;
};


const LecturesListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

const { sessionClaims } = auth();
const role = (sessionClaims?.metadata as { role?: string })?.role;


const columns = [
  {
    header: "Subject Name",
    accessor: "name",
  },
  {
    header: "Branch",
    accessor: "branch",
  },
  {
    header: "Teacher",
    accessor: "teacher",
    className: "hidden md:table-cell",
  },
  ...(role === "admin"
    ? [
        {
          header: "Actions",
          accessor: "action",
        },
      ]
    : []),
];

const renderRow = (item: LectruesList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">{item.subject.name}</td>
    <td>{item.branch.name}</td>
    <td className="hidden md:table-cell">
      {item.teacher.name }
    </td>
    <td>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <FormContainer table="lectures" type="update" data={item} />
            <FormContainer table="lectures" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.LecturesWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "branchId":
            query.branchId = parseInt(value);
            break;
          case "teacherId":
            query.teacherId = value;
            break;
          case "search":
            query.OR = [
              { subject: { name: { contains: value, mode: "insensitive" } } },
              { teacher: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.lectures.findMany({
      where: query,
      include: {
        subject: { select: { name: true } },
        branch: { select: { name: true } },
        teacher: { select: { name: true} },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.lectures.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex-1 m-4 mt-0 border border-gray-100">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center">
            <span className="bg-blue-500 w-2 h-6 rounded mr-2 hidden md:block"></span>
            All Lectures
          </h1>
          <p className="text-sm text-gray-500 mt-1 hidden md:block">
            View and manage lecture schedules
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full md:w-auto mb-3 md:mb-0">
            <TableSearch />
          </div>
          
          <div className="flex items-center gap-3 self-end">
            {/* <button className="flex items-center justify-center p-2 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors">
              <Image src="/filter.png" alt="Filter" width={16} height={16} />
              <span className="ml-2 text-sm font-medium text-blue-700 hidden md:inline">Filter</span>
            </button>
            
            <button className="flex items-center justify-center p-2 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors">
              <Image src="/sort.png" alt="Sort" width={16} height={16} />
              <span className="ml-2 text-sm font-medium text-blue-700 hidden md:inline">Sort</span>
            </button> */}
            
            {role === "admin" && (
              <FormContainer table="lectures" type="create" />
            )}
          </div>
        </div>
      </div>
      
      {/* Table Section with Card Styling */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
        <Table columns={columns} renderRow={renderRow} data={data} />
      </div>
      
      {/* Pagination with Better Styling */}
      <div className="mt-6 flex justify-center md:justify-end">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default LecturesListPage;