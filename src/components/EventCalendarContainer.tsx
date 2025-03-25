import Image from "next/image";
import EventCalendar from "./EventCalendar";

const EventCalendarContainer = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  const { date } = searchParams;
  return (
    <div className="bg-blue p-4 rounded-md">
      <EventCalendar />
      
      <div className="flex flex-col gap-4">
      </div>
    </div>
  );
};

export default EventCalendarContainer;
