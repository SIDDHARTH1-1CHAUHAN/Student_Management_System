import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Link from "next/link";

const AllottedSubjectsPage = async () => {
  const { userId } = auth();

  if (!userId) {
    return <div>Not authenticated</div>;
  }
  const teacher = await prisma.teacher.findUnique({
    where: { id: userId }, 
    include: {
      subjects: true, 
    },
  });

  if (!teacher) {
    return <div>Teacher not found</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex-1 m-4 mt-0 border border-gray-100">
      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        Allotted Subjects for {teacher.name}
      </h1>

      {teacher.subjects.length === 0 ? (
        <p className="text-gray-500">No Subjects Allotted.</p>
      ) : (
        <div className="space-y-4">
          {teacher.subjects.map((subject) => (
            <div
              key={subject.id}
              className="p-4 bg-gray-50 rounded-md border border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <h2 className="font-semibold text-gray-800">{subject.name}</h2>
              <p className="text-sm text-gray-500">Subject Code: {subject.subjectCode}</p>
              <p className="text-sm text-gray-500">Type: {subject.type}</p>
              <Link
                href={`/list/subjects/${subject.id}`}
                className="text-blue-500 hover:underline"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllottedSubjectsPage;