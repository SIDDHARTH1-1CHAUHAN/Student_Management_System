import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "branchId";
  id: string | number;
}) => {
  const dataRes = await prisma.lectures.findMany({
    where: {
      ...(type === "teacherId"
        ? { teacherId: id as string }
        : { branchId: id as number }),
    },
  });

  const data = dataRes.map((lectures) => ({
    title: lectures.name,
    start: lectures.startTime,
    end: lectures.endTime,
  }));

  const schedule = adjustScheduleToCurrentWeek(data);

  return (
    <div className="">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
