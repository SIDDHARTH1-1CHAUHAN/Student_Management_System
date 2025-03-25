import prisma from "@/lib/prisma";
import Image from "next/image";

const UserCard = async ({
  type,
}: {
  type: "admin" | "teacher" | "student" | "registrar";
}) => {
  const modelMap: Record<typeof type, any> = {
    admin: prisma.admin,
    teacher: prisma.teacher,
    student: prisma.student,
    registrar: prisma.registrar,
  };

  const data = await modelMap[type].count();
  
  // Custom background and icon for each type
  const cardStyles = {
    admin: {
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-600",
      iconBg: "bg-blue-100",
      iconPath: "/teacher.png", // Using the existing icon
      textColor: "text-blue-800"
    },
    teacher: {
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-600",
      iconBg: "bg-purple-100",
      iconPath: "/teacher.png",
      textColor: "text-purple-800"
    },
    student: {
      bgColor: "bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600",
      iconBg: "bg-green-100",
      iconPath: "/student.png",
      textColor: "text-green-800"
    },
    registrar: {
      bgColor: "bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-600",
      iconBg: "bg-amber-100",
      iconPath: "/registrar.png",
      textColor: "text-amber-800"
    }
  };

  const style = cardStyles[type];

  return (
    <div className={`rounded-lg shadow-md p-5 flex-1 min-w-[200px] ${style.bgColor}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full ${style.iconBg} flex items-center justify-center mr-2`}>
            <Image src={style.iconPath || "/more.png"} alt="" width={20} height={20} />
          </div>
          <h2 className="capitalize text-sm font-semibold text-gray-700 tracking-wide">
            {type}s
          </h2>
        </div>
        <span className="text-xs bg-white px-3 py-1 rounded-full text-gray-600 font-medium shadow-sm">
          2024/25
        </span>
      </div>
      
      <div className="mt-3">
        <h1 className={`text-3xl font-bold ${style.textColor}`}>
          {data}
        </h1>
        <p className="text-xs text-gray-500 mt-1 font-medium">
          Total {type}s registered
        </p>
      </div>
      
      {/* Subtle decorative element */}
      <div className="w-full mt-3 flex">
        <div className="h-1 w-1/3 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
};

export default UserCard;

// return (
//   <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px]">
//     <div className="flex justify-between items-center">
//       <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
//         2024/25
//       </span>
//       <Image src="/more.png" alt="" width={20} height={20} />
//     </div>
//     <h1 className="text-2xl font-semibold my-4">{data}</h1>
//     <h2 className="capitalize text-sm font-medium text-gray-500">{type}s</h2>
//   </div>
// );
// };

// export default UserCard;
