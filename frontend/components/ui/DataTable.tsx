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
  renderFooter?: () => React.ReactNode;
}

export default function DataTable<T>({ 
  data, 
  columns, 
  onRowClick,
  renderFooter
}: DataTableProps<T>) {
  return (
    <div
      className="flex flex-col h-full w-full text-sm rounded-md"
      style={{ backgroundColor: "var(--surface-lowest)" }}
    >
      {/* Table Action Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--outline-variant)" }}
      >
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              border: "1px solid var(--outline-variant)",
              backgroundColor: "var(--surface-lowest)",
              color: "var(--on-surface)",
            }}
          >
            <Filter className="h-3 w-3" />
            Filter
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              border: "1px solid var(--outline-variant)",
              backgroundColor: "var(--surface-lowest)",
              color: "var(--on-surface)",
            }}
          >
            <Download className="h-3 w-3" />
            Import file
          </button>
          
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              border: "1px solid var(--outline-variant)",
              backgroundColor: "var(--surface-lowest)",
              color: "var(--on-surface)",
            }}
          >
            Bulk actions
            <ChevronDown className="h-3 w-3" />
          </button>

          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ml-2"
            style={{
              border: "1px solid var(--outline-variant)",
              backgroundColor: "var(--surface-lowest)",
              color: "var(--on-surface)",
            }}
          >
            <Download className="h-3 w-3" />
            Export
          </button>

          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              border: "1px solid var(--primary)",
              color: "var(--primary)",
              backgroundColor: "var(--primary-fixed)",
            }}
          >
            <Bookmark className="h-3 w-3" />
            Save view
          </button>

          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ml-2"
            style={{
              border: "1px solid var(--outline-variant)",
              backgroundColor: "var(--surface-lowest)",
              color: "var(--on-surface)",
            }}
          >
            <Columns className="h-3 w-3" />
            Columns
          </button>
        </div>
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-left border-collapse min-w-max">
          <thead
            className="sticky top-0 z-10"
            style={{
              backgroundColor: "var(--surface-low)",
              borderBottom: "1px solid var(--outline-variant)",
              boxShadow: "0 1px 2px var(--shadow-ambient)",
            }}
          >
            <tr>
              <th
                className="px-4 py-3 w-12 text-center"
                style={{ borderRight: "1px solid var(--outline-variant)" }}
              >
                <input
                  type="checkbox"
                  className="rounded"
                  style={{ accentColor: "var(--primary)" }}
                />
              </th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-xs font-semibold whitespace-nowrap"
                  style={{
                    color: "var(--on-surface-variant)",
                    borderRight: "1px solid var(--outline-variant)",
                  }}
                >
                  <div className="flex items-center justify-between cursor-pointer group">
                    <span className="flex items-center gap-2">
                      <ChevronsUpDown
                        className="h-3 w-3"
                        style={{ color: "var(--outline)" }}
                      />
                      {col.header}
                    </span>
                  </div>
                </th>
              ))}
              <th
                className="px-4 py-3 text-xs font-semibold"
                style={{
                  color: "var(--on-surface-variant)",
                  borderRight: "1px solid var(--outline-variant)",
                }}
              ></th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-4 py-16 text-center text-sm"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid var(--outline-variant)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--surface-container-high)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "")
                  }
                >
                <td
                  className="px-4 py-2 text-center"
                  style={{ borderRight: "1px solid var(--outline-variant)" }}
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    style={{ accentColor: "var(--primary)" }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-3 text-xs truncate max-w-[200px]"
                    style={{
                      color: "var(--on-surface)",
                      borderRight: "1px solid var(--outline-variant)",
                    }}
                  >
                    {col.cell ? col.cell(row) : (row as any)[col.accessorKey]}
                  </td>
                ))}
                <td
                  className="px-4 py-2 text-center"
                  style={{ borderRight: "1px solid var(--outline-variant)" }}
                >
                  <button
                    className="outline-none transition-colors"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
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
        <div
          className="px-4 py-3 flex text-xs font-bold w-full shrink-0"
          style={{
            backgroundColor: "var(--surface-low)",
            borderTop: "1px solid var(--outline-variant)",
            color: "var(--on-surface)",
          }}
        >
          {renderFooter()}
        </div>
      )}

      {/* Pagination Container */}
      <div
        className="px-4 py-3 flex items-center justify-end text-xs shrink-0"
        style={{
          borderTop: "1px solid var(--outline-variant)",
          backgroundColor: "var(--surface-lowest)",
          color: "var(--on-surface-variant)",
        }}
      >
        <span className="mr-4">Rows per page: </span>
        <select
          className="border-none bg-transparent mr-6 focus:ring-0 cursor-pointer font-medium"
          style={{ color: "var(--on-surface)" }}
        >
          <option>20</option>
          <option>50</option>
          <option>100</option>
        </select>
        <span>{data.length > 0 ? `1-${data.length}` : "0"} of {data.length}</span>
      </div>
    </div>
  );
}
