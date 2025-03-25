"use client";

import { useRouter } from "next/navigation";

const ITEM_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const Pagination = ({ page, count, itemsPerPage }: { page: number; count: number; itemsPerPage: number }) => {
  const router = useRouter();

  const hasPrev = itemsPerPage * (page - 1) > 0;
  const hasNext = itemsPerPage * (page - 1) + itemsPerPage < count;

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`${window.location.pathname}?${params}`);
  };

  const changeItemsPerPage = (newItemsPerPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("itemsPerPage", newItemsPerPage.toString());
    params.set("page", "1"); // Reset to the first page
    router.push(`${window.location.pathname}?${params}`);
  };

  return (
    <div className="p-4 flex items-center justify-between text-gray-500  m-4">
      <button
        disabled={!hasPrev}
        className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed mx-2"
        onClick={() => {
          changePage(page - 1);
        }}
      >
        Prev
      </button>
      <div className="flex items-center gap-2 text-sm">
        {Array.from(
          { length: Math.ceil(count / itemsPerPage) },
          (_, index) => {
            const pageIndex = index + 1;
            return (
              <button
                key={pageIndex}
                className={`px-2 rounded-sm ${
                  page === pageIndex ? "bg-lamaSky" : ""
                }`}
                onClick={() => {
                  changePage(pageIndex);
                }}
              >
                {pageIndex}
              </button>
            );
          }
        )}
      </div>
      <button
        className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed mx-2"
        disabled={!hasNext}
        onClick={() => {
          changePage(page + 1);
        }}
      >
        Next
      </button>
      <select
        value={itemsPerPage}
        onChange={(e) => changeItemsPerPage(Number(e.target.value))}
        className="p-4 rounded-md bg-slate-200 text-black font-serif text-xs font-semibold mx-8"
      >
        {ITEM_PER_PAGE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            Show {option} items per page
          </option>
        ))}
      </select>
    </div>
  );
};

export default Pagination;