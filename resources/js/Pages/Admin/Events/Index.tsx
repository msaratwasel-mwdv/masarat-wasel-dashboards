import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import BaseDataTable, {
  ActionButton,
  StatusBadge,
  type FilterTab,
  type PaginationMeta,
} from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  Newspaper,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Plus,
  Printer,
  Archive
} from "lucide-react";
import { useTheme } from "@/Contexts/ThemeContext";
import {
  DS_pageTitle,
  DS_btnGold,
  DS_btnSecondary,
  DS_statCard,
  DS_statIcon,
  DS_statLabel,
  DS_statValue2,
} from "@/lib/DS";
import PrintReportHeader from "@/Components/PrintReportHeader";

// ─── Print CSS ──────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #events-print-area, #events-print-area * { visibility: visible !important; }
  #events-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

interface Event {
  id: number;
  title_ar: string;
  title_en: string;
  type: string;
  event_date: string | null;
  is_published: boolean;
  image: string | null;
}

interface Props {
  events: {
    data: Event[];
    links: PaginationMeta["links"];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  counts: {
    all: number;
    published: number;
    draft: number;
    news: number;
  };
  filters: {
    search: string;
  };
}

export default function Index({ events, counts, filters }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  // --- State ---
  const [search, setSearch] = useState(filters.search || "");

  // --- Search & Filter ---
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.get(
          route("admin.events.index"),
          { search: value },
          { preserveState: true, replace: true }
        );
      }, 300),
    []
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const getEventTypeName = (type: string) => {
    if (isRTL) {
        switch (type) {
            case "news": return "أخبار";
            case "workshop": return "ورشة عمل";
            case "bus_photos": return "صور حافلات";
            case "activity": return "نشاط";
            default: return type;
        }
    }
    return type.toUpperCase();
  }

  // --- Columns ---
  const columnHelper = createColumnHelper<Event>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("title_ar", {
        header: isRTL ? "العنوان" : "Title",
        cell: (info) => {
          const event = info.row.original;
          return (
            <div className="flex items-center gap-3">
              {event.image ? (
                <img src={event.image} alt={event.title_ar} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className={isRTL ? "text-right" : "text-left"}>
                <div className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"} line-clamp-1`}>
                  {isRTL ? event.title_ar : event.title_en}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{getEventTypeName(event.type)}</div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("event_date", {
        header: isRTL ? "التاريخ" : "Date",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold">
              {info.getValue() ? new Date(info.getValue()!).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : '—'}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("is_published", {
        header: isRTL ? "الحالة" : "Status",
        cell: (info) => (
          <StatusBadge
            label={info.getValue() ? (isRTL ? "منشور" : "Published") : (isRTL ? "مسودة" : "Draft")}
            variant={info.getValue() ? "green" : "gray"}
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
          const event = info.row.original;
          return (
            <div className={`flex gap-2 ${isRTL ? "justify-start" : "justify-end"}`}>
              <Link href={route("admin.events.edit", event.id)}>
                <ActionButton label={isRTL ? "تعديل" : "Edit"} color="indigo" />
              </Link>
              <ActionButton
                label={isRTL ? "حذف" : "Delete"}
                color="red"
                onClick={() => {
                  if (confirm(isRTL ? "هل أنت متأكد من الحذف؟" : "Are you sure?")) {
                    router.delete(route("admin.events.destroy", event.id));
                  }
                }}
              />
            </div>
          );
        },
      }),
    ],
    [isRTL, isDark]
  );

  const pagination: PaginationMeta = {
    links: events.links,
    current_page: events.current_page,
    last_page: events.last_page,
    per_page: events.per_page,
    total: events.total,
    from: events.from,
    to: events.to,
  };

  const handlePrint = () => window.print();

  return (
    <AuthenticatedLayout>
      <Head title={isRTL ? "إدارة الفعاليات والأخبار" : "Events & News Management"} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area (hidden on screen, visible on print) ── */}
      <div id="events-print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
        <PrintReportHeader
          title={isRTL ? "تقرير الفعاليات والأخبار" : "Events & News Report"}
          schoolName={isRTL ? "إدارة شركة مسارات واصل" : "Masarat Wasel Company"}
          schoolLogo={null}
          printDate={`${isRTL ? "تاريخ الطباعة" : "Print Date"}: ${new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}`}
          schoolAdminText={isRTL ? "إدارة المنصة" : "Platform Admin"}
        />
        {/* Print Table */}
        <div className="px-4">
          <table className="w-full border-collapse border border-gray-300 text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1.5 text-right font-bold w-8 text-black">#</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "العنوان" : "Title"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "النوع" : "Type"}</th>
                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{isRTL ? "التاريخ" : "Date"}</th>
                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{isRTL ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {events.data.map((event, i) => (
                <tr key={event.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center text-gray-700 font-semibold">{i + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{isRTL ? event.title_ar : event.title_en}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{getEventTypeName(event.type)}</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-700 font-mono">
                    {event.event_date ? new Date(event.event_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : "—"}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      event.is_published ? "bg-gray-100 text-black border-gray-400" : "bg-gray-50 text-gray-400 border-gray-200"
                    }`}>
                      {event.is_published ? (isRTL ? "منشور" : "Published") : (isRTL ? "مسودة" : "Draft")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{isRTL ? "إجمالي السجلات" : "Total Records"}: {events.data.length}</p>
            <p>{isRTL ? "توقيع مدير الشركة" : "Company Manager Signature"}: ............................</p>
          </div>
        </div>
      </div>

      <div className={`pb-8 space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        
        {/* ── Page Header ── */}
        <div className={isRTL ? "text-right" : "text-left"}>
          <h1 className={DS_pageTitle}>{isRTL ? "الفعاليات والأخبار" : "News & Events"}</h1>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">
            {isRTL ? "إدارة محتوى المنتدى المصغر والأخبار العامة" : "Manage mini-forum and public news content"}
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: isRTL ? "إجمالي السجلات" : "Total Events", value: counts.all, icon: <Newspaper className="w-5 h-5" />, accent: "navy" as const },
            { label: isRTL ? "منشور ومتاح" : "Published", value: counts.published, icon: <CheckCircle2 className="w-5 h-5" />, accent: "green" as const },
            { label: isRTL ? "مسودة" : "Drafts", value: counts.draft, icon: <Archive className="w-5 h-5" />, accent: "gold" as const },
            { label: isRTL ? "الأخبار الصحفية" : "News Releases", value: counts.news, icon: <TrendingUp className="w-5 h-5" />, accent: "blue" as const },
          ].map((stat, i) => (
            <motion.div key={i} whileHover={{ y: -2 }} className={`${DS_statCard(stat.accent)} ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={DS_statIcon(stat.accent)}>{stat.icon}</div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className={DS_statLabel}>{stat.label}</p>
                <p className={DS_statValue2(stat.accent)}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <BaseDataTable<Event>
            columns={columns}
            data={events.data}
            pagination={pagination}
            exportEnabled={true}
            headerAction={
              <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button onClick={handlePrint} className={DS_btnSecondary}>
                  <Printer className="w-4 h-4" />
                  {isRTL ? "طباعة" : "Print"}
                </button>
                <Link href={route("admin.events.create")} className={DS_btnGold}>
                  <Plus className="w-4 h-4" />
                  {isRTL ? "إضافة فعالية جديدة" : "Add New Event"}
                </Link>
              </div>
            }
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder={isRTL ? "ابحث بعنوان الفعالية..." : "Search event title..."}
            emptyMessage={isRTL ? "لا توجد فعاليات" : "No Events"}
            emptyDescription={isRTL ? "لم تقم بإضافة أي فعاليات بعد." : "No events added yet."}
            emptyIcon={<Newspaper className="w-10 h-10" />}
            emptyAction={{
              label: isRTL ? "إضافة فعالية" : "Add Event",
              onClick: () => router.visit(route("admin.events.create")),
            }}
          />
        </motion.div>
      </div>
    </AuthenticatedLayout>
  );
}
