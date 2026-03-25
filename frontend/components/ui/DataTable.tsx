import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  return (
    <div
      style={{
        backgroundColor: "var(--surface-lowest)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        transition: "background-color 0.2s ease",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        {/* Header — zebra stripe: use surface-container-high */}
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="label-lg"
                style={{
                  textAlign: "left",
                  padding: "var(--spacing-4) var(--spacing-6)",
                  color: "var(--on-surface-variant)",
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  width: col.width,
                  borderBottom: "none",
                  backgroundColor: "var(--surface-lowest)",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body — Zebra striping per DESIGN.md: no 1px dividers */}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  textAlign: "center",
                  padding: "var(--spacing-16)",
                  color: "var(--on-surface-variant)",
                  fontSize: "0.875rem",
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                style={{
                  backgroundColor:
                    rowIndex % 2 === 0
                      ? "var(--surface-lowest)"
                      : "var(--surface-low)",
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background-color 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  if (onRowClick)
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "var(--surface-container)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    rowIndex % 2 === 0
                      ? "var(--surface-lowest)"
                      : "var(--surface-low)";
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="body-md"
                    style={{
                      padding: "var(--spacing-4) var(--spacing-6)",
                      color: "var(--on-surface)",
                      borderBottom: "none",
                    }}
                  >
                    {col.render
                      ? col.render(row)
                      : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
