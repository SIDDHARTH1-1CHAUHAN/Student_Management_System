import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

const Announcements = async () => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const query: any = {};
  if (role === "teacher") {
    query.OR = [
      { teachers: { some: { teacherId: userId } } },
      { teachers: { none: {} } },
    ];
  }

  const data = await prisma.announcement.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    where: query,
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
        <Link href={"/list/announcements"}>
          <span className="text-sm text-blue-600 hover:underline">View All</span>
        </Link>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {data.map((announcement, index) => (
          <div
            key={announcement.id}
            className={`rounded-md p-4 transition-transform transform hover:scale-[1.02] hover:shadow-lg ${
              index === 0
                ? "bg-blue-100"
                : index === 1
                ? "bg-purple-100"
                : "bg-yellow-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{announcement.title}</h2>
              <span className="text-xs text-gray-500 bg-white rounded-md px-2 py-1 border border-gray-300">
                {new Intl.DateTimeFormat("en-GB").format(new Date(announcement.createdAt))}
              </span>
            </div>
            {announcement.content && (
              <p className="text-sm text-gray-700 mt-1 line-clamp-2">{announcement.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;