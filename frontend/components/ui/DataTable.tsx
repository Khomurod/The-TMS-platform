"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  ChevronsUpDown,
  MoreVertical,
  Download,
  Filter,
  Columns,
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

  // Toolbar: Filter
  onFilterClick?: () => void;
  filterCount?: number;

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
  onFilterClick,
  filterCount,
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

  // ── CSV Export ─────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const headers = visibleColumns.map((col) => col.header);
    const rows = data.map((row) =>
      visibleColumns.map((col) => {
        const val = (row as Record<string, unknown>)[col.accessorKey as string];
        const str = val === null || val === undefined ? "" : String(val);
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      })
    );
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, visibleColumns]);

  return (
    <div className={`dt-wrapper flex flex-col h-full w-full${density === "comfortable" ? " dt-comfortable" : ""}`}>
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
              className={`dt-tab${tab.isActive ? " dt-tab--active" : ""}`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="dt-tab-badge tabular-nums">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ═══ Bulk Actions Bar ═══ */}
      {selectedIds.length > 0 && bulkActions && (
        <div className="dt-bulk-bar">
          <span className="dt-bulk-count">
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
            className="dt-bulk-clear"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}

      {/* ═══ Table Action Bar ═══ */}
      {selectedIds.length === 0 && (
        <div className="dt-toolbar">
          <div className="flex items-center gap-2">
            {onFilterClick && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={onFilterClick}
                aria-label={filterCount ? `Filter (${filterCount} active)` : "Filter"}
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
                {!!filterCount && filterCount > 0 && (
                  <span
                    className="dt-tab-badge tabular-nums"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--on-primary)",
                      marginLeft: "2px",
                    }}
                  >
                    {filterCount}
                  </span>
                )}
              </button>
            )}
            {toolbarLeft}
          </div>

          <div className="flex items-center gap-2">
            {exportable && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleExport}
                aria-label="Export data as CSV"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            )}

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
                    <div className="dt-col-menu">
                      <div className="dt-col-menu-label">Toggle Columns</div>
                      {columns
                        .filter((col) => col.hideable !== false)
                        .map((col) => {
                          const key = String(col.accessorKey);
                          const isVisible = !hiddenColumns.has(key);
                          return (
                            <button
                              key={key}
                              onClick={() => toggleColumn(key)}
                              className="dt-menu-item"
                            >
                              <span className={`dt-col-check ${isVisible ? "dt-col-check--on" : "dt-col-check--off"}`}>
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
            <div className="dt-empty">
              No data available
            </div>
          )
        ) : (
          <table className="dt-table">
            <thead className="sticky top-0 z-10">
              <tr>
                {selectable && (
                  <th className="dt-th dt-th--check">
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
                    className={`dt-th${col.align === "center" ? " dt-th--center" : col.align === "right" ? " dt-th--right" : ""}`}
                    style={{ width: col.width }}
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
                  <th className="dt-th" style={{ width: "40px" }} />
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
                    className={[
                      "dt-row",
                      isSelected ? "dt-row--selected" : "",
                      zebraStripe ? "dt-row--zebra" : "",
                      onRowClick ? "cursor-pointer" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    {selectable && (
                      <td className="dt-td--check">
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
                        className={`dt-td${col.align === "center" ? " dt-td--center" : col.align === "right" ? " dt-td--right" : ""}`}
                      >
                        {col.cell ? col.cell(row) : (row as any)[col.accessorKey]}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="dt-td--actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRowAction(activeRowAction === rowId ? null : rowId);
                          }}
                          className="dt-row-action-btn focus-ring"
                          aria-label="Row actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeRowAction === rowId && (
                          <>
                            <div className="fixed inset-0 z-15" onClick={() => setActiveRowAction(null)} />
                            <div className="dt-col-menu">
                              {rowActions.map((action, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(row);
                                    setActiveRowAction(null);
                                  }}
                                  className={`dt-menu-item${action.destructive ? " dt-menu-item--danger" : ""}`}
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
        <div className="dt-agg-footer tabular-nums">
          {stickyFooter.map((agg, i) => (
            <span key={i}>
              <span className="dt-agg-label">{agg.label}:{" "}</span>
              {agg.value}
            </span>
          ))}
        </div>
      )}

      {/* ═══ Legacy Footer ═══ */}
      {renderFooter && !stickyFooter && (
        <div className="dt-agg-footer">
          {renderFooter()}
        </div>
      )}

      {/* ═══ Pagination ═══ */}
      <div className="dt-pagination">
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
              className="dt-page-select focus-ring"
              value={controlledPageSize ?? 20}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {onPageChange && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange((currentPage ?? 1) - 1)}
                disabled={(currentPage ?? 1) <= 1}
                className="dt-page-btn focus-ring"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span
                className="tabular-nums"
                style={{ fontWeight: 500, padding: "0 4px", color: "var(--on-surface)" }}
              >
                {currentPage ?? 1}
              </span>
              <button
                onClick={() => onPageChange((currentPage ?? 1) + 1)}
                disabled={
                  totalCount !== undefined &&
                  (currentPage ?? 1) * (controlledPageSize ?? 20) >= totalCount
                }
                className="dt-page-btn focus-ring"
                aria-label="Next page"
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
