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
} from "lucide-react";
import EmptyState from "./EmptyState";

/* ═══════════════════════════════════════════════════════════════
   DataTable — Enhanced Component (Phase 4 Blueprint)
   Supports: tabs, selection, bulk actions, sticky footer,
   empty states, row actions, pagination, density, column toggle
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
  density = "comfortable",
  zebraStripe = false,
  columnToggle = false,
  exportable = true,
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

  const cellPadding = density === "compact" ? "px-3 py-2" : "px-4 py-3";
  const rowIds = useMemo(() => data.map(getRowId), [data, getRowId]);
  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  // ── Selection Handlers ────────────────────────────────────

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rowIds);
    }
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

  // ── Total column count for colSpan ────────────────────────

  const totalColSpan = visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  return (
    <div
      className="flex flex-col h-full w-full text-sm rounded-md"
      style={{ backgroundColor: "var(--surface-lowest)" }}
    >
      {/* ═══ Tabs ═══ */}
      {tabs && tabs.length > 0 && (
        <div
          className="flex items-center gap-1 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0"
          style={{ borderBottom: "1px solid var(--outline-variant)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange?.(tab.key)}
              className="text-xs font-semibold pb-2.5 pt-3 px-3 border-b-2 transition-colors flex items-center gap-1.5"
              style={{
                borderColor: tab.isActive ? "var(--primary)" : "transparent",
                color: tab.isActive ? "var(--primary)" : "var(--on-surface-variant)",
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                  style={{
                    backgroundColor: tab.isActive ? "var(--primary-fixed)" : "var(--surface-container-high)",
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

      {/* ═══ Bulk Actions Bar (shown when rows selected) ═══ */}
      {selectedIds.length > 0 && bulkActions && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 shrink-0"
          style={{
            backgroundColor: "var(--primary-fixed)",
            borderBottom: "1px solid var(--outline-variant)",
          }}
        >
          <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2 ml-2">
            {bulkActions.map((action, i) => (
              <button
                key={i}
                onClick={() => action.onClick(selectedIds)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{
                  border: `1px solid ${action.variant === "danger" ? "var(--error)" : "var(--outline-variant)"}`,
                  color: action.variant === "danger" ? "var(--error)" : "var(--on-surface)",
                  backgroundColor: "var(--surface-lowest)",
                }}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedIds([])}
            className="ml-auto text-xs font-medium flex items-center gap-1 transition-colors"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}

      {/* ═══ Table Action Bar ═══ */}
      {selectedIds.length === 0 && (
        <div
          className="flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ borderBottom: "1px solid var(--outline-variant)" }}
        >
          <div className="flex items-center gap-2">
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
            {exportable && (
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{
                  border: "1px solid var(--outline-variant)",
                  backgroundColor: "var(--surface-lowest)",
                  color: "var(--on-surface)",
                }}
              >
                <Download className="h-3 w-3" />
                Export
              </button>
            )}

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

            {columnToggle && (
              <div className="relative">
                <button
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{
                    border: "1px solid var(--outline-variant)",
                    backgroundColor: "var(--surface-lowest)",
                    color: "var(--on-surface)",
                  }}
                >
                  <Columns className="h-3 w-3" />
                  Columns
                </button>

                {showColumnMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 z-30 rounded-lg shadow-lg py-1 min-w-[180px]"
                    style={{
                      backgroundColor: "var(--surface-lowest)",
                      border: "1px solid var(--outline-variant)",
                    }}
                  >
                    {columns
                      .filter((col) => col.hideable !== false)
                      .map((col) => {
                        const key = String(col.accessorKey);
                        const isVisible = !hiddenColumns.has(key);
                        return (
                          <button
                            key={key}
                            onClick={() => toggleColumn(key)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors text-left"
                            style={{ color: "var(--on-surface)" }}
                          >
                            <span
                              className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                              style={{
                                borderColor: isVisible ? "var(--primary)" : "var(--outline-variant)",
                                backgroundColor: isVisible ? "var(--primary)" : "transparent",
                              }}
                            >
                              {isVisible && <Check className="h-3 w-3 text-white" />}
                            </span>
                            {col.header}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
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
              className="flex items-center justify-center py-16 text-sm"
              style={{ color: "var(--on-surface-variant)" }}
            >
              No data available
            </div>
          )
        ) : (
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
                {selectable && (
                  <th
                    className={`${cellPadding} w-12 text-center`}
                    style={{ borderRight: "1px solid var(--outline-variant)" }}
                  >
                    <input
                      type="checkbox"
                      className="rounded"
                      style={{ accentColor: "var(--primary)" }}
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleAll}
                    />
                  </th>
                )}
                {visibleColumns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`${cellPadding} text-xs font-semibold whitespace-nowrap`}
                    style={{
                      color: "var(--on-surface-variant)",
                      borderRight: "1px solid var(--outline-variant)",
                      width: col.width,
                      textAlign: col.align || "left",
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
                {rowActions && (
                  <th
                    className={`${cellPadding} text-xs font-semibold w-10`}
                    style={{
                      color: "var(--on-surface-variant)",
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
                    className={`transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                    style={{
                      borderBottom: "1px solid var(--outline-variant)",
                      backgroundColor: isSelected
                        ? "var(--primary-fixed)"
                        : zebraStripe && rowIndex % 2 === 1
                        ? "var(--surface-low)"
                        : undefined,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.backgroundColor = "var(--surface-container-high)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.backgroundColor =
                          zebraStripe && rowIndex % 2 === 1 ? "var(--surface-low)" : "";
                    }}
                  >
                    {selectable && (
                      <td
                        className={`${cellPadding} text-center`}
                        style={{ borderRight: "1px solid var(--outline-variant)" }}
                      >
                        <input
                          type="checkbox"
                          className="rounded"
                          style={{ accentColor: "var(--primary)" }}
                          checked={isSelected}
                          onChange={() => toggleRow(rowId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    {visibleColumns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        className={`${cellPadding} text-xs truncate max-w-[200px]`}
                        style={{
                          color: "var(--on-surface)",
                          borderRight: "1px solid var(--outline-variant)",
                          textAlign: col.align || "left",
                        }}
                      >
                        {col.cell ? col.cell(row) : (row as any)[col.accessorKey]}
                      </td>
                    ))}
                    {rowActions && (
                      <td
                        className={`${cellPadding} text-center relative`}
                        style={{ borderRight: "1px solid var(--outline-variant)" }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRowAction(activeRowAction === rowId ? null : rowId);
                          }}
                          className="outline-none transition-colors"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeRowAction === rowId && (
                          <div
                            className="absolute right-0 top-full mt-1 z-20 rounded-lg shadow-lg py-1 min-w-[160px]"
                            style={{
                              backgroundColor: "var(--surface-lowest)",
                              border: "1px solid var(--outline-variant)",
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
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors text-left"
                                style={{
                                  color: action.destructive ? "var(--error)" : "var(--on-surface)",
                                }}
                              >
                                {action.icon || (action.destructive && <Trash2 className="h-3 w-3" />)}
                                {action.label}
                              </button>
                            ))}
                          </div>
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

      {/* ═══ Sticky Aggregate Footer (Phase 4.2) ═══ */}
      {stickyFooter && stickyFooter.length > 0 && (
        <div
          className="sticky bottom-0 z-10 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs font-semibold shrink-0"
          style={{
            backgroundColor: "var(--surface-low)",
            borderTop: "1px solid var(--outline-variant)",
            color: "var(--on-surface)",
          }}
        >
          {stickyFooter.map((agg, i) => (
            <span key={i} className="tabular-nums">
              <span style={{ color: "var(--on-surface-variant)" }}>{agg.label}: </span>
              {agg.value}
            </span>
          ))}
        </div>
      )}

      {/* ═══ Legacy Footer (backward compat) ═══ */}
      {renderFooter && !stickyFooter && (
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

      {/* ═══ Pagination ═══ */}
      <div
        className="px-4 py-2.5 flex items-center justify-between text-xs shrink-0"
        style={{
          borderTop: "1px solid var(--outline-variant)",
          backgroundColor: "var(--surface-lowest)",
          color: "var(--on-surface-variant)",
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
              className="border-none bg-transparent focus:ring-0 cursor-pointer font-medium"
              style={{ color: "var(--on-surface)" }}
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
                className="p-1 rounded transition-colors disabled:opacity-30"
                style={{ color: "var(--on-surface)" }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="tabular-nums font-medium px-1" style={{ color: "var(--on-surface)" }}>
                {currentPage ?? 1}
              </span>
              <button
                onClick={() => onPageChange((currentPage ?? 1) + 1)}
                disabled={
                  totalCount !== undefined &&
                  (currentPage ?? 1) * (controlledPageSize ?? 20) >= totalCount
                }
                className="p-1 rounded transition-colors disabled:opacity-30"
                style={{ color: "var(--on-surface)" }}
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
