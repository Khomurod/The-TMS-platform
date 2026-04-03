"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  ChevronsUpDown,
  MoreVertical,
  Download,
  Filter,
  Columns,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  X,
  AlignJustify,
  List,
} from "lucide-react";
import EmptyState from "./EmptyState";

/* ═══════════════════════════════════════════════════════════════
   DataTable — Enterprise Operations Grid
   Dense, tables-first design with tabs, selection, bulk actions,
   sticky footer, density toggle, column chooser, pagination.
   ═══════════════════════════════════════════════════════════════ */

// ── Public Types ─────────────────────────────────────────────

export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  hideable?: boolean;
  defaultHidden?: boolean;
}

export interface TabDef {
  label: string;
  key: string;
  count?: number;
  isActive: boolean;
}

export interface BulkActionDef {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: "default" | "danger";
}

export interface RowActionDef<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  destructive?: boolean;
}

export interface StickyFooterItem {
  label: string;
  value: string;
  format?: "currency" | "number" | "miles" | "percentage";
}

export interface EmptyStateDef {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  learnMoreHref?: string;
}

interface DataTableProps<T> {
  // Data
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;

  // Tab-Based Segmentation
  tabs?: TabDef[];
  onTabChange?: (tabKey: string) => void;

  // Selection & Bulk Actions
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: BulkActionDef[];
  getRowId?: (row: T) => string;

  // Sticky Footer
  stickyFooter?: StickyFooterItem[];

  // Empty State
  emptyState?: EmptyStateDef;

  // Legacy Footer (backward compat)
  renderFooter?: () => React.ReactNode;

  // Display
  density?: "compact" | "comfortable";
  zebraStripe?: boolean;
  columnToggle?: boolean;
  exportable?: boolean;

  // Toolbar slots
  toolbarLeft?: React.ReactNode;
  primaryAction?: React.ReactNode;

  // Row Interactions
  onRowClick?: (row: T) => void;
  rowActions?: RowActionDef<T>[];

  // Pagination
  pageSize?: number;
  pageSizeOptions?: number[];
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

// ── Component ────────────────────────────────────────────────

export default function DataTable<T>({
  data,
  columns,
  isLoading = false,
  tabs,
  onTabChange,
  selectable = true,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  bulkActions,
  getRowId = (row: any) => row.id ?? String(data.indexOf(row)),
  stickyFooter,
  emptyState,
  renderFooter,
  density: initialDensity = "compact",
  zebraStripe = false,
  columnToggle = false,
  exportable = true,
  toolbarLeft,
  primaryAction,
  onRowClick,
  rowActions,
  pageSize: controlledPageSize,
  pageSizeOptions = [20, 50, 100],
  totalCount,
  currentPage,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  // ── Internal State ──────────────────────────────────────

  const [density, setDensity] = useState(initialDensity);
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const selectedIds = controlledSelectedIds ?? internalSelectedIds;
  const setSelectedIds = onSelectionChange ?? setInternalSelectedIds;

  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    const hidden = new Set<string>();
    columns.forEach((col) => {
      if (col.defaultHidden) hidden.add(String(col.accessorKey));
    });
    return hidden;
  });

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [activeRowAction, setActiveRowAction] = useState<string | null>(null);

  const visibleColumns = useMemo(
    () => columns.filter((col) => !hiddenColumns.has(String(col.accessorKey))),
    [columns, hiddenColumns]
  );

  const isCompact = density === "compact";
  const cellPy = isCompact ? "6px" : "10px";
  const cellPx = "12px";
  const rowIds = useMemo(() => data.map(getRowId), [data, getRowId]);
  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  // ── Selection Handlers ────────────────────────────────────

  const toggleAll = useCallback(() => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(rowIds);
  }, [allSelected, rowIds, setSelectedIds]);

  const toggleRow = useCallback(
    (id: string) => {
      setSelectedIds(
        selectedIds.includes(id)
          ? selectedIds.filter((x) => x !== id)
          : [...selectedIds, id]
      );
    },
    [selectedIds, setSelectedIds]
  );

  // ── Column Toggle ────────────────────────────────────────

  const toggleColumn = useCallback(
    (key: string) => {
      setHiddenColumns((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    []
  );

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{
        backgroundColor: "var(--surface-lowest)",
        fontSize: "12px",
        borderRadius: "var(--radius-lg)",
      }}
    >
      {/* ═══ Tabs ═══ */}
      {tabs && tabs.length > 0 && (
        <div
          className="flex items-center gap-0 overflow-x-auto whitespace-nowrap shrink-0"
          style={{
            borderBottom: "1px solid var(--outline-variant)",
            paddingLeft: "16px",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange?.(tab.key)}
              className="flex items-center gap-1.5 transition-colors"
              style={{
                padding: "10px 14px",
                fontSize: "12px",
                fontWeight: tab.isActive ? 600 : 500,
                color: tab.isActive ? "var(--primary)" : "var(--on-surface-variant)",
                borderBottom: tab.isActive ? "2px solid var(--primary)" : "2px solid transparent",
                background: "transparent",
                border: "none",
                borderBottomWidth: "2px",
                borderBottomStyle: "solid",
                borderBottomColor: tab.isActive ? "var(--primary)" : "transparent",
                cursor: "pointer",
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: tab.isActive ? "var(--primary-fixed)" : "var(--surface-container)",
                    color: tab.isActive ? "var(--primary)" : "var(--on-surface-variant)",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ═══ Bulk Actions Bar ═══ */}
      {selectedIds.length > 0 && bulkActions && (
        <div
          className="flex items-center gap-3 shrink-0"
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--primary-fixed)",
            borderBottom: "1px solid var(--outline-variant)",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)" }}>
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2 ml-2">
            {bulkActions.map((action, i) => (
              <button
                key={i}
                onClick={() => action.onClick(selectedIds)}
                className={action.variant === "danger" ? "btn btn-danger btn-sm" : "btn btn-secondary btn-sm"}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedIds([])}
            className="ml-auto flex items-center gap-1 transition-colors"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--on-surface-variant)",
            }}
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}

      {/* ═══ Table Action Bar ═══ */}
      {selectedIds.length === 0 && (
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: "6px 16px",
            borderBottom: "1px solid var(--outline-variant)",
          }}
        >
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary btn-sm">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </button>
            {toolbarLeft}
          </div>

          <div className="flex items-center gap-2">
            {exportable && (
              <button className="btn btn-secondary btn-sm">
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            )}

            <button
              className="btn btn-soft btn-sm"
            >
              <Bookmark className="h-3.5 w-3.5" />
              Save view
            </button>

            {/* Density Toggle */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setDensity(d => d === "compact" ? "comfortable" : "compact")}
              title={`Switch to ${isCompact ? "comfortable" : "compact"} density`}
            >
              {isCompact ? <AlignJustify className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
              {isCompact ? "Compact" : "Comfortable"}
            </button>

            {columnToggle && (
              <div className="relative">
                <button
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  className="btn btn-secondary btn-sm"
                >
                  <Columns className="h-3.5 w-3.5" />
                  Columns
                </button>

                {showColumnMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowColumnMenu(false)} />
                    <div
                      className="absolute right-0 top-full mt-1 z-30 rounded-md py-1 min-w-[200px]"
                      style={{
                        backgroundColor: "var(--surface-lowest)",
                        border: "1px solid var(--outline-variant)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        style={{
                          padding: "6px 12px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--on-surface-variant)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          borderBottom: "1px solid var(--outline-variant)",
                        }}
                      >
                        Toggle Columns
                      </div>
                      {columns
                        .filter((col) => col.hideable !== false)
                        .map((col) => {
                          const key = String(col.accessorKey);
                          const isVisible = !hiddenColumns.has(key);
                          return (
                            <button
                              key={key}
                              onClick={() => toggleColumn(key)}
                              className="w-full flex items-center gap-2 text-left transition-colors"
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                fontWeight: 500,
                                color: "var(--on-surface)",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-low)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                              <span
                                className="flex items-center justify-center shrink-0"
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  borderRadius: "3px",
                                  border: `1.5px solid ${isVisible ? "var(--primary)" : "var(--outline-variant)"}`,
                                  backgroundColor: isVisible ? "var(--primary)" : "transparent",
                                }}
                              >
                                {isVisible && <Check className="h-2.5 w-2.5 text-white" />}
                              </span>
                              {col.header}
                            </button>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            )}

            {primaryAction}
          </div>
        </div>
      )}

      {/* ═══ Scrollable Table Area ═══ */}
      <div className="flex-1 overflow-auto min-h-0">
        {data.length === 0 && !isLoading ? (
          emptyState ? (
            <EmptyState {...emptyState} />
          ) : (
            <div
              className="flex items-center justify-center py-16"
              style={{ color: "var(--on-surface-variant)", fontSize: "13px" }}
            >
              No data available
            </div>
          )
        ) : (
          <table
            className="w-full text-left min-w-max"
            style={{ borderCollapse: "collapse" }}
          >
            <thead
              className="sticky top-0 z-10"
              style={{
                backgroundColor: "var(--surface-low)",
                boxShadow: "inset 0 -1px 0 var(--outline-variant)",
              }}
            >
              <tr>
                {selectable && (
                  <th
                    style={{
                      padding: `8px ${cellPx}`,
                      width: "40px",
                      textAlign: "center",
                      borderRight: "1px solid var(--outline-variant)",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ accentColor: "var(--primary)", cursor: "pointer" }}
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleAll}
                    />
                  </th>
                )}
                {visibleColumns.map((col, idx) => (
                  <th
                    key={idx}
                    style={{
                      padding: `8px ${cellPx}`,
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--on-surface-variant)",
                      whiteSpace: "nowrap",
                      borderRight: "1px solid var(--outline-variant)",
                      width: col.width,
                      textAlign: col.align || "left",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <div className="flex items-center gap-1.5 cursor-pointer">
                      <ChevronsUpDown
                        className="h-3 w-3 shrink-0"
                        style={{ color: "var(--outline)" }}
                      />
                      {col.header}
                    </div>
                  </th>
                ))}
                {rowActions && (
                  <th
                    style={{
                      padding: `8px ${cellPx}`,
                      width: "40px",
                      borderRight: "1px solid var(--outline-variant)",
                    }}
                  />
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => {
                const rowId = getRowId(row);
                const isSelected = selectedIds.includes(rowId);
                return (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick?.(row)}
                    className={onRowClick ? "cursor-pointer" : ""}
                    style={{
                      borderBottom: "1px solid var(--outline-variant)",
                      backgroundColor: isSelected
                        ? "var(--primary-fixed)"
                        : zebraStripe && rowIndex % 2 === 1
                        ? "var(--surface-low)"
                        : undefined,
                      transition: "background-color 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.backgroundColor = "var(--surface-low)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.backgroundColor =
                          zebraStripe && rowIndex % 2 === 1 ? "var(--surface-low)" : "";
                    }}
                  >
                    {selectable && (
                      <td
                        style={{
                          padding: `${cellPy} ${cellPx}`,
                          textAlign: "center",
                          borderRight: "1px solid var(--outline-variant)",
                        }}
                      >
                        <input
                          type="checkbox"
                          style={{ accentColor: "var(--primary)", cursor: "pointer" }}
                          checked={isSelected}
                          onChange={() => toggleRow(rowId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    {visibleColumns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        style={{
                          padding: `${cellPy} ${cellPx}`,
                          fontSize: "12px",
                          color: "var(--on-surface)",
                          borderRight: "1px solid var(--outline-variant)",
                          textAlign: col.align || "left",
                          maxWidth: "220px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col.cell ? col.cell(row) : (row as any)[col.accessorKey]}
                      </td>
                    ))}
                    {rowActions && (
                      <td
                        style={{
                          padding: `${cellPy} ${cellPx}`,
                          textAlign: "center",
                          borderRight: "1px solid var(--outline-variant)",
                          position: "relative",
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRowAction(activeRowAction === rowId ? null : rowId);
                          }}
                          className="focus-ring"
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--on-surface-variant)",
                            padding: "2px",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeRowAction === rowId && (
                          <>
                            <div className="fixed inset-0 z-15" onClick={() => setActiveRowAction(null)} />
                            <div
                              className="absolute right-0 top-full mt-1 z-20 rounded-md py-1 min-w-[160px]"
                              style={{
                                backgroundColor: "var(--surface-lowest)",
                                border: "1px solid var(--outline-variant)",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              }}
                            >
                              {rowActions.map((action, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(row);
                                    setActiveRowAction(null);
                                  }}
                                  className="w-full flex items-center gap-2 text-left transition-colors"
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: action.destructive ? "var(--error)" : "var(--on-surface)",
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-low)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                >
                                  {action.icon || (action.destructive && <Trash2 className="h-3 w-3" />)}
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ═══ Sticky Aggregate Footer ═══ */}
      {stickyFooter && stickyFooter.length > 0 && (
        <div
          className="sticky bottom-0 z-10 flex flex-wrap gap-x-6 gap-y-1 shrink-0"
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--surface-low)",
            borderTop: "1px solid var(--outline-variant)",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--on-surface)",
          }}
        >
          {stickyFooter.map((agg, i) => (
            <span key={i} className="tabular-nums">
              <span style={{ color: "var(--on-surface-variant)", fontWeight: 500 }}>
                {agg.label}:{" "}
              </span>
              {agg.value}
            </span>
          ))}
        </div>
      )}

      {/* ═══ Legacy Footer ═══ */}
      {renderFooter && !stickyFooter && (
        <div
          className="flex w-full shrink-0"
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--surface-low)",
            borderTop: "1px solid var(--outline-variant)",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--on-surface)",
          }}
        >
          {renderFooter()}
        </div>
      )}

      {/* ═══ Pagination ═══ */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          padding: "6px 16px",
          borderTop: "1px solid var(--outline-variant)",
          backgroundColor: "var(--surface-lowest)",
          color: "var(--on-surface-variant)",
          fontSize: "12px",
        }}
      >
        <span className="tabular-nums">
          {totalCount !== undefined
            ? `${data.length > 0 ? ((currentPage ?? 1) - 1) * (controlledPageSize ?? 20) + 1 : 0}–${Math.min(
                (currentPage ?? 1) * (controlledPageSize ?? 20),
                totalCount
              )} of ${totalCount}`
            : `${data.length} rows`}
        </span>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              className="focus-ring"
              style={{
                border: "none",
                background: "transparent",
                color: "var(--on-surface)",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "12px",
              }}
              value={controlledPageSize ?? 20}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {onPageChange && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange((currentPage ?? 1) - 1)}
                disabled={(currentPage ?? 1) <= 1}
                className="focus-ring"
                style={{
                  padding: "3px",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--on-surface)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  opacity: (currentPage ?? 1) <= 1 ? 0.3 : 1,
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span
                className="tabular-nums"
                style={{
                  fontWeight: 500,
                  padding: "0 4px",
                  color: "var(--on-surface)",
                }}
              >
                {currentPage ?? 1}
              </span>
              <button
                onClick={() => onPageChange((currentPage ?? 1) + 1)}
                disabled={
                  totalCount !== undefined &&
                  (currentPage ?? 1) * (controlledPageSize ?? 20) >= totalCount
                }
                className="focus-ring"
                style={{
                  padding: "3px",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--on-surface)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  opacity: totalCount !== undefined &&
                    (currentPage ?? 1) * (controlledPageSize ?? 20) >= totalCount ? 0.3 : 1,
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
