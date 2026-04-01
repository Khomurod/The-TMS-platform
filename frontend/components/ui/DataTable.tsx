"use client";

import React from "react";
import { 
  ChevronDown, 
  ChevronsUpDown,
  MoreVertical,
  Download,
  Filter,
  Columns,
  Bookmark
} from "lucide-react";

export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  renderSubNav?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
}

export default function DataTable<T>({ 
  data, 
  columns, 
  onRowClick,
  renderSubNav,
  renderFooter
}: DataTableProps<T>) {
  return (
    <div className="flex flex-col h-full bg-white w-full text-sm rounded-md">
      
      {/* Dynamic Sub-Navigation (Tabs) */}
      {renderSubNav && renderSubNav()}

      {/* Table Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 border border-[#e5e7eb] px-3 py-1.5 rounded bg-white text-xs font-medium text-[#374151] hover:bg-gray-50">
            <Filter className="h-3 w-3" />
            Filter
          </button>
        </div>

        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 border border-[#e5e7eb] px-3 py-1.5 rounded bg-white text-xs font-medium text-[#374151] hover:bg-gray-50">
            <Download className="h-3 w-3" />
            Import file
          </button>
          
          <button className="flex items-center gap-2 border border-[#e5e7eb] px-3 py-1.5 rounded bg-white text-xs font-medium text-[#374151] hover:bg-gray-50">
            Bulk actions
            <ChevronDown className="h-3 w-3" />
          </button>

          <button className="flex items-center gap-2 border border-[#e5e7eb] px-3 py-1.5 rounded bg-white text-xs font-medium text-[#374151] hover:bg-gray-50 ml-2">
            <Download className="h-3 w-3" />
            Export
          </button>

          <button className="flex items-center gap-2 border border-[#3b82f6] text-[#3b82f6] px-3 py-1.5 rounded bg-blue-50 text-xs font-medium hover:bg-blue-100">
            <Bookmark className="h-3 w-3" />
            Save view
          </button>

          <button className="flex items-center gap-2 border border-[#e5e7eb] px-3 py-1.5 rounded bg-white text-xs font-medium text-[#374151] hover:bg-gray-50 ml-2">
            <Columns className="h-3 w-3" />
            Columns
          </button>
        </div>
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead className="sticky top-0 bg-[#f9fafb] border-b border-[#e5e7eb] z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 border-r border-[#e5e7eb] w-12 text-center">
                <input type="checkbox" className="rounded border-gray-300 text-[#3525cd] focus:ring-[#3525cd]" />
              </th>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-3 text-xs font-semibold text-[#6b7280] border-r border-[#e5e7eb] whitespace-nowrap">
                  <div className="flex items-center justify-between cursor-pointer hover:text-gray-900 group">
                    <span className="flex items-center gap-2">
                      <ChevronsUpDown className="h-3 w-3 text-gray-300 group-hover:text-gray-500" />
                      {col.header}
                    </span>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-xs font-semibold text-[#6b7280] border-r border-[#e5e7eb]"></th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-16 text-center text-gray-400 text-sm">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className="border-b border-[#e5e7eb] hover:bg-[#f9fafb] cursor-pointer"
                >
                <td className="px-4 py-2 text-center border-r border-[#e5e7eb]">
                  <input type="checkbox" className="rounded border-gray-300 text-[#3525cd] focus:ring-[#3525cd]" onClick={(e) => e.stopPropagation()}/>
                </td>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-3 text-xs text-[#374151] border-r border-[#e5e7eb] truncate max-w-[200px]">
                    {col.cell ? col.cell(row) : (row as any)[col.accessorKey]}
                  </td>
                ))}
                <td className="px-4 py-2 border-r border-[#e5e7eb] text-center">
                  <button className="text-gray-400 hover:text-gray-600 outline-none">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Aggregate Footer Calculation Space */}
      {renderFooter && (
        <div className="bg-[#f9fafb] border-t border-[#e5e7eb] px-4 py-3 flex text-xs font-bold text-[#111827] w-full shrink-0">
          {renderFooter()}
        </div>
      )}

      {/* Pagination Container */}
      <div className="px-4 py-3 border-t border-[#e5e7eb] flex items-center justify-end text-xs text-[#6b7280] bg-white shrink-0">
        <span className="mr-4">Rows per page: </span>
        <select className="border-none bg-transparent mr-6 focus:ring-0 cursor-pointer font-medium text-[#374151]">
          <option>20</option>
          <option>50</option>
          <option>100</option>
        </select>
        <span>{data.length > 0 ? `1-${data.length}` : "0"} of {data.length}</span>
      </div>
    </div>
  );
}
