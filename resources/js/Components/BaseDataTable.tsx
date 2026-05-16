import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState, Fragment } from "react";
import { useTheme } from "@/Contexts/ThemeContext";
import Pagination from "@/Components/Pagination";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  FileX2,
  FileDown,
  FileText,
  Search,
  Plus,
} from "lucide-react";
import {
  DS_card,
  DS_tableWrapper,
  DS_tableBase,
  DS_tableHead,
  DS_tableRow,
  DS_tableTd,
  DS_tableTh,
  DS_sectionHeader,
  DS_searchInput,
  DS_filterBtn,
  DS_btnSecondary,
} from "@/lib/DS";

// ─── Types ───────────────────────────────────────────────────────

export interface FilterTab {
  key: string;
  label: string;
  count?: number;
  dotColor?: string; // e.g. "bg-green-400"
}

export interface PaginationMeta {
  links: { url: string | null; label: string; active: boolean }[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface BaseDataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  pagination?: PaginationMeta;

  // Loading
  isLoading?: boolean;

  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Filter pills
  filterTabs?: FilterTab[];
  activeFilter?: string;
  onFilterChange?: (key: string) => void;

  // Customization
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: { label: string; onClick: () => void };

  // Header
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  exportEnabled?: boolean;

  // Inline Expansion
  renderExpandedRow?: (data: T) => React.ReactNode;
  expandedRowId?: string | number | null;
}

// ─── Skeleton Row ────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className={`h-4 rounded-lg ${
              isDark ? "bg-gray-700" : "bg-gray-100"
            } ${i === 0 ? "w-3/4" : i % 2 === 0 ? "w-1/2" : "w-2/3"}`}
          />
          {i === 0 && (
            <div
              className={`h-3 rounded-lg mt-2 w-1/2 ${
                isDark ? "bg-gray-800" : "bg-gray-100/80"
              }`}
            />
          )}
        </td>
      ))}
    </tr>
  );
}

// ─── Empty State ─────────────────────────────────────────────────

function EmptyState({
  icon,
  message,
  description,
  action,
  isDark,
  isRTL,
}: {
  icon?: React.ReactNode;
  message?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  isDark: boolean;
  isRTL: boolean;
}) {
  return (
    <tr>
      <td colSpan={100} className="px-6 py-20 text-center">
        <div className="flex flex-col items-center justify-center gap-4 max-w-sm mx-auto">
          {/* Icon container */}
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center ${
              isDark
                ? "bg-gray-800 text-gray-600"
                : "bg-gray-50 text-gray-300"
            }`}
          >
            {icon || (
              <FileX2 className="w-10 h-10" />
            )}
          </div>

          {/* Text */}
          <div className={isRTL ? "text-right" : "text-center"}>
            <p
              className={`text-base font-bold ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {message || (isRTL ? "لا توجد بيانات" : "No data found")}
            </p>
            {description && (
              <p
                className={`text-sm mt-1 ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {description}
              </p>
            )}
          </div>

          {/* CTA Button */}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-dark text-white text-sm font-bold rounded-xl hover:bg-brand-dark/90 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {action.label}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export default function BaseDataTable<T extends { id?: number | string }>({
  columns,
  data,
  pagination,
  isLoading = false,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filterTabs,
  activeFilter,
  onFilterChange,
  emptyMessage,
  emptyDescription,
  emptyIcon,
  emptyAction,
  title,
  subtitle,
  headerAction,
  exportEnabled = false,
  renderExpandedRow,
  expandedRowId,
}: BaseDataTableProps<T>) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const getExportUrl = (format: "csv" | "pdf") => {
    const url = new URL(window.location.href);
    url.searchParams.set("export", format);
    return url.toString();
  };

  const rows = table.getRowModel().rows;
  const colCount = columns.length;

  return (
    <div className={DS_card}>
      {/* ── Toolbar: Search + Filters + Actions ── */}
      {(title || headerAction || exportEnabled || filterTabs || onSearchChange) && (
        <div className={DS_sectionHeader(isRTL)}>
          
          {/* Title block */}
          {title && (
            <div className={`${isRTL ? "text-right" : "text-left"} mb-2 md:mb-0`}>
              <h1 className={`text-lg md:text-xl font-black tracking-tight ${isDark ? "text-white" : "text-[#0f2044]"}`}>
                {title}
              </h1>
              {subtitle && (
                <p className={`text-[10px] md:text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Search Input */}
          {onSearchChange && (
            <div className="relative w-full md:max-w-xs group">
              <span className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#f5b800] transition-colors`}>
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder || (isRTL ? "بحث سريع..." : "Quick Search...")}
                className={`${DS_searchInput} ${isRTL ? "pr-11" : "pl-11"}`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
          )}

          {/* Filter Pills */}
          {filterTabs && onFilterChange && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 md:py-0">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onFilterChange(tab.key)}
                  className={`${DS_filterBtn(activeFilter === tab.key)} whitespace-nowrap flex items-center gap-2`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      activeFilter === tab.key 
                        ? "bg-white/20 text-white" 
                        : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Actions: export + primary CTA */}
          <div className={`flex flex-col sm:flex-row items-stretch md:items-center gap-2 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
            {exportEnabled && (
              <a href={getExportUrl("csv")} className={`${DS_btnSecondary} justify-center`}>
                <FileDown className="w-4 h-4" />
                {isRTL ? "تصدير" : "Export"}
              </a>
            )}
            {headerAction}
          </div>
        </div>
      )}

      {/* ── Table Wrapper ── */}
      <div className={DS_tableWrapper}>
          <table className={DS_tableBase}>
            {/* Sticky Header */}
            <thead className={DS_tableHead}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-100 dark:border-[#243460]">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={
                          canSort
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                        className={`${DS_tableTh(isRTL)} ${
                          canSort
                            ? "cursor-pointer select-none hover:text-[#0f2044] dark:hover:text-white"
                            : ""
                        }`}
                      >
                        <div
                          className={`flex items-center gap-1.5 ${
                            isRTL ? "flex-row-reverse justify-end" : ""
                          }`}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {canSort && (
                            <span className="opacity-50 flex-shrink-0">
                              {sorted === "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : sorted === "desc" ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronsUpDown className="w-3 h-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {/* Table Body */}
            <tbody>
              {/* Skeleton State */}
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} cols={colCount} />
                ))}

              {/* Empty State */}
              {!isLoading && rows.length === 0 && (
                <EmptyState
                  icon={emptyIcon}
                  message={emptyMessage}
                  description={emptyDescription}
                  action={emptyAction}
                  isDark={isDark}
                  isRTL={isRTL}
                />
              )}

              {/* Data Rows */}
              {!isLoading &&
                rows.map((row, rowIndex) => (
                  <Fragment key={row.id}>
                    <tr className={DS_tableRow}>
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={`${DS_tableTd} ${
                            isRTL ? "text-right" : "text-left"
                          }`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Expanded Row */}
                    {expandedRowId === row.original.id &&
                      renderExpandedRow && (
                        <tr
                          className={
                            isDark ? "bg-gray-800/80" : "bg-gray-50/50"
                          }
                        >
                          <td
                            colSpan={columns.length}
                            className="px-4 py-0 border-none"
                          >
                            <div className="overflow-hidden animate-in slide-in-from-top-2 duration-300">
                              {renderExpandedRow(row.original)}
                            </div>
                          </td>
                        </tr>
                      )}
                  </Fragment>
                ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        {pagination && pagination.last_page > 1 && (
          <div className="px-5 py-3.5 border-t border-gray-100 dark:border-[#243460] bg-[#0f2044]/[0.02] dark:bg-transparent">
            <div
              className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isRTL ? "sm:flex-row-reverse" : ""
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {isRTL
                  ? `عرض ${pagination.from ?? 0}–${pagination.to ?? 0} من ${pagination.total} سجل`
                  : `Showing ${pagination.from ?? 0}–${pagination.to ?? 0} of ${pagination.total} records`}
              </p>
              <Pagination links={pagination.links} />
            </div>
          </div>
        )}
      </div>
  );
}

// ─── Helper: Action Button ─────────────────────────────────────────

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  color?: "blue" | "indigo" | "red" | "green" | "yellow";
  icon?: React.ReactNode;
}

const colorMap = {
  blue: {
    light: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100",
    dark: "bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 border-blue-900/30",
  },
  indigo: {
    light: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100",
    dark: "bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/40 border-indigo-900/30",
  },
  red: {
    light: "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-100",
    dark: "bg-rose-900/20 text-rose-400 hover:bg-rose-900/40 border-rose-900/30",
  },
  green: {
    light: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100",
    dark: "bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40 border-emerald-900/30",
  },
  yellow: {
    light: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100",
    dark: "bg-amber-900/20 text-amber-400 hover:bg-amber-900/40 border-amber-900/30",
  },
};

export function ActionButton({
  label,
  onClick,
  color = "indigo",
  icon,
}: ActionButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 active:scale-95 ${
        isDark ? scheme.dark : scheme.light
      }`}
    >
      {icon && <span className="w-3.5 h-3.5">{icon}</span>}
      {label}
    </button>
  );
}

// ─── Helper: Status Badge ──────────────────────────────────────────

interface StatusBadgeProps {
  label: string;
  variant?: "green" | "yellow" | "red" | "gray" | "blue" | "orange";
  dot?: boolean;
  className?: string;
}

const badgeMap = {
  green: {
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dark: "bg-emerald-900/20 text-emerald-400 border-emerald-800/40",
    dot: "bg-emerald-500",
  },
  yellow: {
    light: "bg-amber-50 text-amber-700 border-amber-200",
    dark: "bg-amber-900/20 text-amber-400 border-amber-800/40",
    dot: "bg-amber-400",
  },
  red: {
    light: "bg-rose-50 text-rose-700 border-rose-200",
    dark: "bg-rose-900/20 text-rose-400 border-rose-800/40",
    dot: "bg-rose-500",
  },
  gray: {
    light: "bg-gray-100 text-gray-600 border-gray-200",
    dark: "bg-gray-700/60 text-gray-400 border-gray-600",
    dot: "bg-gray-400",
  },
  blue: {
    light: "bg-blue-50 text-blue-700 border-blue-200",
    dark: "bg-blue-900/20 text-blue-400 border-blue-800/40",
    dot: "bg-blue-500",
  },
  orange: {
    light: "bg-orange-50 text-orange-700 border-orange-200",
    dark: "bg-orange-900/20 text-orange-400 border-orange-800/40",
    dot: "bg-orange-500",
  },
};

export function StatusBadge({
  label,
  variant = "gray",
  dot = true,
  className = "",
}: StatusBadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const scheme = badgeMap[variant] || badgeMap.gray;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
        isDark ? scheme.dark : scheme.light
      } ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${scheme.dot}`}
        />
      )}
      {label}
    </span>
  );
}
