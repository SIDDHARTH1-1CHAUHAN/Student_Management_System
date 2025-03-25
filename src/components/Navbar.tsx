import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Navbar = async () => {
  const user = await currentUser();

  {/*handling the announcemnet icon giving server error will see later !!!!!*/}

  // const router = useRouter(); // Initialize useRouter

  // // Handler for the announcement image click
  // const handleAnnouncementClick = () => {
  //   router.push("/list/announcements"); // Navigate to the announcements page
  // };


  return (
    <div className="flex items-center justify-between p-4">
      {/* SEARCH BAR */}
      {/* <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Search here..."
          className="w-[200px] p-3 bg-transparent outline-none"
        />
      </div> */}
      <div className="flex items-center gap-6 justify-end w-full font-extrabold font-serif">
        INDO SWISS TRIANING CENTER,SECTOR 30C, CHANDIGARH 
        </div>
      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        {/* <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative" onClick={handleAnnouncementClick}>
          <Image src="/announcement.png" alt="" width={25} height={25} />
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">
            1
          </div>
        </div> */}
        <div className="flex flex-col mx-3">
          <span className="text-xs leading-3 uppercase font-bold ">{user?.username as string}</span>
          <span className="text-[10px] text-gray-500 text-right">
            {user?.publicMetadata?.role as string}
          </span>
        </div>
        <UserButton />
      </div>
    </div>
  );
};

export default Navbar;
