import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { useTheme } from "@/Contexts/ThemeContext";
import Pagination from "@/Components/Pagination";

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
  emptyIcon?: React.ReactNode;

  // Header
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode; // e.g. "+ Add" button
  exportEnabled?: boolean; // Enable CSV/PDF export buttons
}

// ─── Component ───────────────────────────────────────────────────

export default function BaseDataTable<T extends { id?: number | string }>({
  columns,
  data,
  pagination,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filterTabs,
  activeFilter,
  onFilterChange,
  emptyMessage,
  emptyIcon,
  title,
  subtitle,
  headerAction,
  exportEnabled = false,
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

  // ── Handlers ──
  const getExportUrl = (format: "csv" | "pdf") => {
    // Retain current query string (search, sorting, active tabs) and append export=format
    const url = new URL(window.location.href);
    url.searchParams.set("export", format);
    return url.toString();
  };

  // ── Filter pill styling ──
  const filterBtnClass = (key: string) =>
    `px-3 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
      activeFilter === key
        ? isDark
          ? "bg-brand-dark text-brand-yellow border-brand-dark shadow-md"
          : "bg-brand-dark text-white border-brand-dark shadow-md"
        : isDark
        ? "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
    }`;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      {(title || headerAction || exportEnabled) && (
        <div
          className={`flex flex-wrap gap-4 justify-between items-center ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          {title && (
            <div className={isRTL ? "text-right" : ""}>
              <h1
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-brand-dark"
                }`}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className={`text-sm mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {subtitle}
                </p>
              )}
            </div>
          )}
          <div className={`flex gap-3 items-center ${isRTL ? "flex-row-reverse" : ""}`}>
            {exportEnabled && (
              <div className="flex gap-2">
                <a
                  href={getExportUrl("csv")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    isDark
                      ? "bg-emerald-900/30 text-emerald-400 border-emerald-900 hover:bg-emerald-900/60"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Excel (CSV)
                </a>
                <a
                  href={getExportUrl("pdf")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    isDark
                      ? "bg-red-900/30 text-red-400 border-red-900 hover:bg-red-900/60"
                      : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  PDF
                </a>
              </div>
            )}
            {headerAction}
          </div>
        </div>
      )}

      {/* ── Controls: Filters + Search ── */}
      {(filterTabs || onSearchChange) && (
        <div
          className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
            isRTL ? "sm:flex-row-reverse" : ""
          }`}
        >
          {filterTabs && onFilterChange && (
            <div className="flex gap-2 flex-wrap">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={filterBtnClass(tab.key)}
                  onClick={() => onFilterChange(tab.key)}
                >
                  {tab.dotColor && (
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${tab.dotColor} ${
                        isRTL ? "ml-1" : "mr-1"
                      }`}
                    />
                  )}
                  {tab.label}
                  {tab.count !== undefined && ` (${tab.count})`}
                </button>
              ))}
            </div>
          )}
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm">
              <svg
                className={`w-4 h-4 absolute top-2.5 ${
                  isRTL ? "right-3" : "left-3"
                } text-gray-400`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder || (isRTL ? "بحث..." : "Search...")}
                className={`w-full ${
                  isRTL ? "pr-9 pl-4" : "pl-9 pr-4"
                } py-2 text-sm rounded-lg border focus:ring-2 focus:ring-brand-dark focus:border-transparent transition ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    : "bg-white border-gray-200"
                }`}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div
        className={`${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
        } overflow-hidden shadow-sm sm:rounded-2xl border`}
      >
        <div className="overflow-x-auto">
          <table
            className={`min-w-full divide-y ${
              isDark ? "divide-gray-700" : "divide-gray-200"
            }`}
          >
            <thead className={isDark ? "bg-gray-900/50" : "bg-gray-50"}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
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
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        } ${isRTL ? "text-right" : "text-left"} ${
                          canSort ? "cursor-pointer select-none hover:text-brand-dark" : ""
                        }`}
                      >
                        <div
                          className={`flex items-center gap-1 ${
                            isRTL ? "flex-row-reverse" : ""
                          }`}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {canSort && (
                            <span className="text-[10px]">
                              {sorted === "asc"
                                ? "▲"
                                : sorted === "desc"
                                ? "▼"
                                : "⇅"}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody
              className={`${
                isDark
                  ? "bg-gray-800 divide-gray-700"
                  : "bg-white divide-gray-200"
              } divide-y`}
            >
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      {emptyIcon || (
                        <svg
                          className="w-12 h-12 mb-3 opacity-50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                      <p className="text-sm font-medium">
                        {emptyMessage || (isRTL ? "لا توجد بيانات." : "No data found.")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`${
                      isDark
                        ? "hover:bg-gray-700/50"
                        : "hover:bg-blue-50/30"
                    } transition-colors duration-200`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`px-4 py-3 whitespace-nowrap ${
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination + Info ── */}
        {pagination && pagination.last_page > 1 && (
          <div
            className={`px-4 py-3 border-t ${
              isDark ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50/50"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p
                className={`text-xs ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {isRTL
                  ? `عرض ${pagination.from || 0} إلى ${pagination.to || 0} من ${pagination.total}`
                  : `Showing ${pagination.from || 0} to ${pagination.to || 0} of ${pagination.total}`}
              </p>
              <Pagination links={pagination.links} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper: Action Button ───────────────────────────────────────

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  color?: "blue" | "indigo" | "red" | "green" | "yellow";
}

const colorMap = {
  blue: {
    light: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    dark: "bg-blue-900/30 text-blue-400 hover:bg-blue-900/60",
  },
  indigo: {
    light: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    dark: "bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/60",
  },
  red: {
    light: "bg-red-50 text-red-700 hover:bg-red-100",
    dark: "bg-red-900/30 text-red-400 hover:bg-red-900/60",
  },
  green: {
    light: "bg-green-50 text-green-700 hover:bg-green-100",
    dark: "bg-green-900/30 text-green-400 hover:bg-green-900/60",
  },
  yellow: {
    light: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
    dark: "bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/60",
  },
};

export function ActionButton({ label, onClick, color = "indigo" }: ActionButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
        isDark ? scheme.dark : scheme.light
      }`}
    >
      {label}
    </button>
  );
}

// ─── Helper: Status Badge ────────────────────────────────────────

interface StatusBadgeProps {
  label: string;
  variant?: "green" | "yellow" | "red" | "gray" | "blue";
}

const badgeMap = {
  green: {
    light: "bg-green-100 text-green-800 border-green-200",
    dark: "bg-green-900/30 text-green-400 border-green-800",
  },
  yellow: {
    light: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dark: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
  },
  red: {
    light: "bg-red-100 text-red-800 border-red-200",
    dark: "bg-red-900/30 text-red-400 border-red-800",
  },
  gray: {
    light: "bg-gray-100 text-gray-600 border-gray-200",
    dark: "bg-gray-700 text-gray-400 border-gray-600",
  },
  blue: {
    light: "bg-blue-100 text-blue-800 border-blue-200",
    dark: "bg-blue-900/30 text-blue-400 border-blue-800",
  },
};

export function StatusBadge({ label, variant = "gray" }: StatusBadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const scheme = badgeMap[variant] || badgeMap.gray;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
        isDark ? scheme.dark : scheme.light
      }`}
    >
      {label}
    </span>
  );
}
