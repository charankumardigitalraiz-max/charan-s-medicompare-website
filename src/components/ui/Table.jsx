import React from "react";

/**
 * Reusable Table Component styled with Tailwind CSS
 * @param {Array} headers - Array of header configs: { key: string, label: string, render?: (value, row) => ReactNode, className?: string }
 * @param {Array} data - Array of row items
 * @param {boolean} loading - Loading state indicator
 * @param {string} emptyMessage - Custom message when data is empty
 */
const Table = ({ headers = [], data = [], loading = false, emptyMessage = "No data found." }) => {
  return (
    <div className="!w-full !overflow-x-auto !rounded-sm !border !border-slate-200 !bg-white !shadow-sm">
      <table className="!w-full !border-collapse !text-left !text-sm !text-slate-500">
        <thead className="!bg-[#faf8ff] !border-b !border-slate-100 !text-xs !font-semibold !uppercase !text-slate-700 !tracking-wider">
          <tr>
            {headers.map((header, index) => (
              <th
                key={header.key}
                scope="col"
                className={`!py-3 !font-semibold ${index === 0 ? "!pl-8 !pr-4" : index === headers.length - 1 ? "!pl-4 !pr-8" : "!px-6"} ${header.className || ""}`}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="!divide-y !divide-slate-100 !border-t !border-slate-100">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="!px-6 !py-12 !text-center">
                <div className="!flex !items-center !justify-center !gap-2">
                  <div className="!h-5 !w-5 !animate-spin !rounded-full !border-2 !border-[#321961] !border-t-transparent"></div>
                  <span className="!text-slate-400 !font-medium">Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="!px-6 !py-36 !text-center">
                <div className="!flex !flex-col !items-center !justify-center !gap-1.5">
                  <div className="!w-12 !h-12 !rounded-full !bg-slate-50 !flex !items-center !justify-center !mb-1 !text-slate-400 !border !border-slate-100">
                    <i className="fa-solid fa-inbox !text-lg"></i>
                  </div>
                  <span className="!text-slate-600 !font-semibold !text-[14px]">
                    {emptyMessage || "No data found."}
                  </span>
                  <span className="!text-slate-400 !text-xs">
                    There are no records matching this query.
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row._id || row.id || rowIndex}
                className="!hover:bg-slate-50/70 !transition-colors !duration-150"
              >
                {headers.map((header, index) => {
                  const value = row[header.key];
                  return (
                    <td
                      key={header.key}
                      className={`!py-3 !text-slate-700 !align-middle ${index === 0 ? "!pl-8 !pr-4" : index === headers.length - 1 ? "!pl-4 !pr-8" : "!px-6"} ${header.className || ""}`}
                    >
                      {header.render ? header.render(value, row) : value ?? "-"}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
