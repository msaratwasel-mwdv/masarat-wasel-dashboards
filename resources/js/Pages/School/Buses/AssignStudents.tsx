import { useState, useEffect, useMemo, useRef } from "react";
import { Head, usePage, router, Link } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import Modal from "@/Components/Modal";
import { motion, AnimatePresence } from "framer-motion";
import PrintReportHeader from "@/Components/PrintReportHeader";
import axios from "axios";
import { 
    Bus as BusIcon, 
    ArrowRight, 
    ArrowLeft, 
    Search, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    Sunrise, 
    Sunset, 
    Info,
    Users,
    Printer,
    ChevronDown,
    ListOrdered,
    ArrowUp,
    ArrowDown,
    Sparkles,
    Loader2
} from "lucide-react";

// ─── Print CSS ───────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;
import {
    DS_pageWrapper,
    DS_pageTitle,
    DS_card,
    DS_searchInput,
    DS_btnGold,
    DS_modalHeader,
    DS_cancelBtn,
    DS_statCard,
    DS_statIcon,
    DS_statLabel,
    DS_statValue,
    DS_tableWrapper,
    DS_tableBase,
    DS_tableHead,
    DS_tableTh,
    DS_tableRow,
    DS_tableTd,
    DS_sectionHeader
} from "@/lib/DS";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
  capacity: number;
  route?: { id: number; name: string } | null;
  driver?: string | null;
  assistant?: string | null;
}

interface Student {
  id: number;
  name: string;
  student_code: string;
  national_id: string;
  gender: string;
  forth_bus_id: number | null;
  back_bus_id: number | null;
  forth_stop_order?: number;
  back_stop_order?: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

interface ChangeSet {
  forthAdded: Student[];
  forthRemoved: Student[];
  forthMoved: { student: Student; from: string }[];
  backAdded: Student[];
  backRemoved: Student[];
  backMoved: { student: Student; from: string }[];
}

interface PageProps {
  buses: Bus[];
  students: Student[];
  selectedBusId?: string | number;
  flash?: { success?: string; error?: string };
  auth: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function busName(buses: Bus[], id: number | null) {
  if (!id) return "—";
  return buses.find((b) => b.id === id)?.bus_number ?? `#${id}`;
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────
function ConfirmModal({
  changes,
  bus,
  onConfirm,
  onCancel,
  isSubmitting,
  isRtl,
}: {
  changes: ChangeSet;
  bus: Bus;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isRtl: boolean;
}) {
  const hasChanges =
    changes.forthAdded.length > 0 ||
    changes.forthRemoved.length > 0 ||
    changes.forthMoved.length > 0 ||
    changes.backAdded.length > 0 ||
    changes.backRemoved.length > 0 ||
    changes.backMoved.length > 0;

  const Section = ({
    title,
    items,
    color,
    icon,
  }: {
    title: string;
    items: { label: string; sub?: string }[];
    color: string;
    icon: React.ReactNode;
  }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2 ${color}`}>
          {icon} {title} ({items.length})
        </p>
        <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-[#0f2044]/20 rounded-[12px] px-3 py-2 border border-gray-100 dark:border-[#243460]">
              <span className="font-bold text-[#0f2044] dark:text-white">{item.label}</span>
              {item.sub && <span className="text-xs font-semibold text-gray-400">{item.sub}</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Modal show={true} onClose={onCancel} maxWidth="lg">
      <div className={DS_modalHeader(isRtl)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
            <BusIcon className="w-5 h-5 text-white" />
          </div>
          <div className={isRtl ? "text-right" : "text-left"}>
            <h3 className="text-xl font-bold text-white">
              {isRtl ? "تأكيد التعيينات" : "Confirm Assignments"}
            </h3>
            <p className="text-[#7ba7e8] text-sm font-semibold mt-0.5">
              {isRtl ? "الباص: " : "Bus: "} {bus.bus_number} — {bus.plate_number}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
        {!hasChanges ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-[#0f2044] dark:text-gray-300">
              {isRtl ? "لا توجد تغييرات للحفظ" : "No changes to save"}
            </p>
          </div>
        ) : (
          <>
            {/* CONFLICTS WARNING */}
            {(changes.forthMoved.length > 0 || changes.backMoved.length > 0) && (
              <div className="p-4 rounded-[16px] bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                <p className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm mb-1">
                  <AlertTriangle className="w-4 h-4" /> {isRtl ? "تحذير: تنازع في التعيين" : "Warning: Assignment Conflict"}
                </p>
                <p className="text-red-500 text-xs font-semibold">
                  {isRtl
                    ? "بعض الطلاب معيّنون حالياً لباص آخر وسيتم نقلهم."
                    : "Some students are currently on another bus and will be moved."}
                </p>
              </div>
            )}

            {/* Forth (Morning) changes */}
            <div className="space-y-2">
              <p className="text-sm font-black text-[#0f2044] dark:text-[#7ba7e8] flex items-center gap-2 mb-3 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 p-2 rounded-[12px]">
                <Sunrise className="w-4 h-4" /> {isRtl ? "رحلة ذهاب" : "Forth Trip"}
              </p>
              <Section
                title={isRtl ? "إضافة" : "Adding"}
                color="text-emerald-600 dark:text-emerald-400"
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                items={changes.forthAdded.map((s) => ({ label: s.name, sub: s.national_id }))}
              />
              <Section
                title={isRtl ? "إزالة" : "Removing"}
                color="text-red-500 dark:text-red-400"
                icon={<XCircle className="w-3.5 h-3.5" />}
                items={changes.forthRemoved.map((s) => ({ label: s.name, sub: s.national_id }))}
              />
              <Section
                title={isRtl ? "نقل من باص آخر" : "Moving from another bus"}
                color="text-orange-600 dark:text-orange-400"
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                items={changes.forthMoved.map((m) => ({ label: m.student.name, sub: `من ${m.from}` }))}
              />
            </div>

            {/* Back (Afternoon) changes */}
            <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-5">
              <p className="text-sm font-black text-[#f5b800] flex items-center gap-2 mb-3 bg-[#f5b800]/10 p-2 rounded-[12px]">
                <Sunset className="w-4 h-4" /> {isRtl ? "رحلة عودة" : "Return Trip"}
              </p>
              <Section
                title={isRtl ? "إضافة" : "Adding"}
                color="text-emerald-600 dark:text-emerald-400"
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                items={changes.backAdded.map((s) => ({ label: s.name, sub: s.national_id }))}
              />
              <Section
                title={isRtl ? "إزالة" : "Removing"}
                color="text-red-500 dark:text-red-400"
                icon={<XCircle className="w-3.5 h-3.5" />}
                items={changes.backRemoved.map((s) => ({ label: s.name, sub: s.national_id }))}
              />
              <Section
                title={isRtl ? "نقل من باص آخر" : "Moving from another bus"}
                color="text-orange-600 dark:text-orange-400"
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                items={changes.backMoved.map((m) => ({ label: m.student.name, sub: `من ${m.from}` }))}
              />
            </div>
          </>
        )}
      </div>

      <div className={`flex gap-3 px-6 py-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1a2845] ${isRtl ? 'justify-start' : 'justify-end'}`}>
        <button onClick={onCancel} className={DS_cancelBtn}>
          {isRtl ? "إلغاء" : "Cancel"}
        </button>
        {hasChanges && (
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`px-6 py-2.5 rounded-[14px] text-sm font-bold shadow transition-all flex items-center gap-2 ${
                isSubmitting ? "bg-gray-400 text-white cursor-not-allowed" : "bg-[#f5b800] hover:bg-[#e0a900] text-[#0f2044]"
            }`}
          >
            {isRtl ? "تأكيد الحفظ" : "Confirm & Save"}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── Stop Order Management Modal ─────────────────────────────────────────────
function StopOrderModal({
  bus,
  students,
  isOpen,
  onClose,
  isRtl,
}: {
  bus: Bus;
  students: Student[];
  isOpen: boolean;
  onClose: () => void;
  isRtl: boolean;
}) {
  const [tripType, setTripType] = useState<"morning" | "afternoon">("morning");
  const [orderedList, setOrderedList] = useState<Student[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStatusMsg(null);
      return;
    }
    const filtered = students.filter((s) =>
      tripType === "morning" ? s.forth_bus_id === bus.id : s.back_bus_id === bus.id
    );

    const sorted = [...filtered].sort((a, b) => {
      const orderA = tripType === "morning" ? (a.forth_stop_order || 9999) : (a.back_stop_order || 9999);
      const orderB = tripType === "morning" ? (b.forth_stop_order || 9999) : (b.back_stop_order || 9999);
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, "ar");
    });

    setOrderedList(sorted);
    setStatusMsg(null);
  }, [isOpen, tripType, students, bus.id]);

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...orderedList];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    setOrderedList(next);
  };

  const moveDown = (index: number) => {
    if (index >= orderedList.length - 1) return;
    const next = [...orderedList];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    setOrderedList(next);
  };

  const handleOptimize = async () => {
    if (orderedList.length < 2) {
      setStatusMsg({
        type: "error",
        text: isRtl ? "يجب أن يكون هناك طالبان على الأقل في هذا المسار" : "At least 2 students required to optimize",
      });
      return;
    }
    setIsOptimizing(true);
    setStatusMsg(null);

    try {
      const res = await axios.post("/school/buses/optimize-route", {
        bus_id: bus.id,
        trip_type: tripType,
      });

      if (res.data && res.data.success && res.data.ordered_students) {
        const orderMap = new Map<number, number>();
        res.data.ordered_students.forEach((item: { student_id: number; order: number }) => {
          orderMap.set(item.student_id, item.order);
        });

        const reordered = [...orderedList].sort((a, b) => {
          const ordA = orderMap.get(a.id) ?? 9999;
          const ordB = orderMap.get(b.id) ?? 9999;
          return ordA - ordB;
        });

        setOrderedList(reordered);
        setStatusMsg({
          type: "success",
          text: isRtl ? "تم ترتيب المحطات ذكياً وفق Google Maps مع مراعاة الزحام الحقيقي!" : "Route optimized smartly with Google Maps traffic!",
        });
      } else {
        setStatusMsg({
          type: "error",
          text: res.data?.message || (isRtl ? "فشل طلب التحسين" : "Optimization request failed"),
        });
      }
    } catch (e: any) {
      setStatusMsg({
        type: "error",
        text: e.response?.data?.message || (isRtl ? "حدث خطأ أثناء الاتصال بجوجل ماب" : "Error connecting to Google Maps"),
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    setStatusMsg(null);

    try {
      const orders = orderedList.map((s, idx) => ({
        student_id: s.id,
        order: idx + 1,
      }));

      const res = await axios.post("/school/buses/save-stop-order", {
        bus_id: bus.id,
        trip_type: tripType,
        orders,
      });

      if (res.data && res.data.success) {
        setStatusMsg({
          type: "success",
          text: isRtl ? "تم حفظ ترتيب المحطات وتثبيته بنجاح!" : "Stop order saved successfully!",
        });
        setTimeout(() => {
          router.reload({ only: ["students"] });
          onClose();
        }, 800);
      }
    } catch (e: any) {
      setStatusMsg({
        type: "error",
        text: e.response?.data?.message || (isRtl ? "تعذر حفظ الترتيب" : "Failed to save stop order"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
      <div className={DS_modalHeader(isRtl)}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[12px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0f2044] dark:text-white">
              {isRtl ? "ترتيب تسلسل الطلاب في المسار (من الأول للأخير)" : "Student Route Sequence (1st to Last)"}
            </h3>
            <p className="text-xs font-semibold text-gray-500">
              {bus.bus_number} — {bus.plate_number} • {isRtl ? "حدد ترتيب صعود ونزول الطلاب بالتسلسل" : "Set pickup/drop-off order"}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
          <XCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 dark:bg-[#0f2044]/30 p-3 rounded-[16px] border border-gray-200 dark:border-[#243460]">
          <div className="flex bg-white dark:bg-[#1a2845] rounded-[12px] p-1 shadow-sm border border-gray-200 dark:border-[#243460] w-full sm:w-auto">
            <button
              onClick={() => setTripType("morning")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tripType === "morning"
                  ? "bg-[#0f2044] text-white shadow"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
              }`}
            >
              <Sunrise className="w-4 h-4 text-[#7ba7e8]" />
              {isRtl ? "رحلة الصباح (ذهاب)" : "Morning (Forth)"}
            </button>
            <button
              onClick={() => setTripType("afternoon")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tripType === "afternoon"
                  ? "bg-[#f5b800] text-[#0f2044] shadow"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
              }`}
            >
              <Sunset className="w-4 h-4 text-[#0f2044]" />
              {isRtl ? "رحلة المساء (عودة)" : "Afternoon (Return)"}
            </button>
          </div>

          <button
            onClick={handleOptimize}
            disabled={isOptimizing || orderedList.length < 2}
            className={`w-full sm:w-auto px-4 py-2 rounded-[12px] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
              isOptimizing || orderedList.length < 2
                ? "bg-gray-200 text-gray-400 dark:bg-gray-800 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none"
            }`}
          >
            {isOptimizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isRtl ? "جارٍ التحسين عبر Google..." : "Optimizing via Google..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isRtl ? "تحسين الترتيب عبر Google Maps" : "Optimize with Google Maps"}</span>
              </>
            )}
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-[12px] text-xs font-bold flex items-center gap-2 border ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:border-red-800"
            }`}
          >
            {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {orderedList.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-bold text-sm">
              {isRtl ? "لا يوجد طلاب مخصصين لهذه الحافلة في هذا التوقيت" : "No students assigned to this trip"}
            </div>
          ) : (
            orderedList.map((student, idx) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 rounded-[14px] bg-gray-50 dark:bg-[#0f2044]/20 border border-gray-100 dark:border-[#243460] hover:border-gray-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[#0f2044] dark:text-white">{student.name}</h4>
                    <p className="text-[11px] text-gray-400 font-mono">{student.student_code || student.national_id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-[8px] hover:bg-gray-200 dark:hover:bg-[#1a2845] text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                    title={isRtl ? "تحريك لأعلى" : "Move up"}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === orderedList.length - 1}
                    className="p-1.5 rounded-[8px] hover:bg-gray-200 dark:hover:bg-[#1a2845] text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                    title={isRtl ? "تحريك لأسفل" : "Move down"}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-[#243460] bg-gray-50/50 dark:bg-[#1a2845] ${isRtl ? "justify-start" : "justify-end"}`}>
        <button onClick={onClose} className={DS_cancelBtn}>
          {isRtl ? "إغلاق" : "Close"}
        </button>
        {orderedList.length > 0 && (
          <button
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="px-6 py-2 rounded-[12px] text-sm font-bold bg-[#f5b800] hover:bg-[#e0a900] text-[#0f2044] shadow transition-all flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isRtl ? "حفظ الترتيب" : "Save Sequence"}</span>
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssignStudents() {
  const { auth, buses, students, selectedBusId: initialBusId, flash } =
    usePage().props as unknown as PageProps;
  const { t, isRtl } = useTranslation();

  const [selectedBusId, setSelectedBusId] = useState<number | "">(
    initialBusId ? Number(initialBusId) : buses.length > 0 ? buses[0].id : ""
  );
  const [forthStudentIds, setForthStudentIds] = useState<number[]>([]);
  const [backStudentIds, setBackStudentIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStopOrderModal, setShowStopOrderModal] = useState(false);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  // Custom Dropdown State
  const [isBusDropdownOpen, setIsBusDropdownOpen] = useState(false);
  const [busSearchQuery, setBusSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setIsBusDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBuses = useMemo(() => {
      return buses.filter(b => 
          b.bus_number.toLowerCase().includes(busSearchQuery.toLowerCase()) || 
          b.plate_number.toLowerCase().includes(busSearchQuery.toLowerCase()) ||
          (b.driver && b.driver.toLowerCase().includes(busSearchQuery.toLowerCase()))
      );
  }, [buses, busSearchQuery]);

  const selectedBus = useMemo(() => buses.find((b) => b.id === selectedBusId), [buses, selectedBusId]);

  // Sync selections when bus changes
  useEffect(() => {
    if (!selectedBusId) { setForthStudentIds([]); setBackStudentIds([]); return; }
    setForthStudentIds(students.filter((s) => s.forth_bus_id === selectedBusId).map((s) => s.id));
    setBackStudentIds(students.filter((s) => s.back_bus_id === selectedBusId).map((s) => s.id));
  }, [selectedBusId, students]);

  // Show flash on success
  useEffect(() => {
    if (flash?.success) { setSavedFlash(flash.success); const t = setTimeout(() => setSavedFlash(null), 4000); return () => clearTimeout(t); }
  }, [flash]);

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => {
      const matchSearch = !q || s.name.toLowerCase().includes(q) ||
        (s.student_code && s.student_code.toLowerCase().includes(q)) ||
        (s.national_id && s.national_id.toLowerCase().includes(q));
      return matchSearch && (genderFilter === "all" || s.gender === genderFilter);
    });
  }, [students, search, genderFilter]);

  // ── Compute change sets ────────────────────────────────────────────────────
  const changes = useMemo((): ChangeSet => {
    if (!selectedBusId) return { forthAdded: [], forthRemoved: [], forthMoved: [], backAdded: [], backRemoved: [], backMoved: [] };

    const originalForth = students.filter((s) => s.forth_bus_id === selectedBusId).map((s) => s.id);
    const originalBack  = students.filter((s) => s.back_bus_id  === selectedBusId).map((s) => s.id);

    const forthAddedIds   = forthStudentIds.filter((id) => !originalForth.includes(id));
    const forthRemovedIds = originalForth.filter((id) => !forthStudentIds.includes(id));
    const backAddedIds    = backStudentIds.filter((id) => !originalBack.includes(id));
    const backRemovedIds  = originalBack.filter((id) => !backStudentIds.includes(id));

    const getStudent = (id: number) => students.find((s) => s.id === id)!;

    const forthAdded: Student[] = [];
    const forthMoved: { student: Student; from: string }[] = [];
    forthAddedIds.forEach((id) => {
      const s = getStudent(id);
      if (s.forth_bus_id && s.forth_bus_id !== selectedBusId)
        forthMoved.push({ student: s, from: busName(buses, s.forth_bus_id) });
      else forthAdded.push(s);
    });

    const backAdded: Student[] = [];
    const backMoved: { student: Student; from: string }[] = [];
    backAddedIds.forEach((id) => {
      const s = getStudent(id);
      if (s.back_bus_id && s.back_bus_id !== selectedBusId)
        backMoved.push({ student: s, from: busName(buses, s.back_bus_id) });
      else backAdded.push(s);
    });

    return {
      forthAdded,
      forthRemoved: forthRemovedIds.map(getStudent),
      forthMoved,
      backAdded,
      backRemoved: backRemovedIds.map(getStudent),
      backMoved,
    };
  }, [selectedBusId, forthStudentIds, backStudentIds, students, buses]);

  const hasChanges = Object.values(changes).some((arr) => arr.length > 0);
  const hasConflicts = changes.forthMoved.length > 0 || changes.backMoved.length > 0;

  const toggleForth = (id: number) =>
    setForthStudentIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleBack = (id: number) =>
    setBackStudentIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const allForthSelected = filteredStudents.length > 0 && filteredStudents.every((s) => forthStudentIds.includes(s.id));
  const allBackSelected  = filteredStudents.length > 0 && filteredStudents.every((s) => backStudentIds.includes(s.id));
  const toggleAllForth = () => setForthStudentIds(allForthSelected ? [] : filteredStudents.map((s) => s.id));
  const toggleAllBack  = () => setBackStudentIds(allBackSelected ? [] : filteredStudents.map((s) => s.id));

  const uniqueTotal = new Set([...forthStudentIds, ...backStudentIds]).size;
  const overCapacity = selectedBus && selectedBus.capacity > 0 && uniqueTotal > selectedBus.capacity;

  const handleReviewClick = () => { if (!selectedBusId) return; setShowConfirm(true); };

  const handleConfirm = () => {
    setIsSubmitting(true);
    router.post(
      route("school.buses.students.save"),
      { bus_id: selectedBusId, forth_student_ids: forthStudentIds, back_student_ids: backStudentIds },
      { onFinish: () => { setIsSubmitting(false); setShowConfirm(false); } }
    );
  };

  const handlePrint = () => window.print();

  return (
    <SchoolAuthenticatedLayout user={auth.user} header={<h2 className={DS_pageTitle}>{isRtl ? "تعيين الطلاب للحافلات" : "Assign Students to Buses"}</h2>}>
      <Head title={isRtl ? "تعيين الطلاب للحافلات" : "Assign Bus Students"} />
      <style>{PRINT_STYLES}</style>

      {/* Print Area */}
      {selectedBus && (
        <div id="print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRtl ? "rtl" : "ltr"}>
          <PrintReportHeader 
            title={isRtl ? "تقرير تعيين الطلاب للحافلة" : "Bus Student Assignments Report"}
            schoolName={auth.user?.school?.name || (isRtl ? "إدارة المدرسة" : "School Admin")}
            schoolLogo={auth.user?.school?.logo || null}
            printDate={`${isRtl ? "تاريخ الطباعة" : "Print Date"}: ${new Date().toLocaleDateString(isRtl ? "ar-SA" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' })}`}
            schoolAdminText={isRtl ? "إدارة المدرسة" : "School Admin"}
          />

          <div className="px-4 mb-6 mt-4 flex justify-between items-end border-b-2 border-gray-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{isRtl ? "بيانات الحافلة" : "Bus Details"}</h3>
              <p className="text-sm font-bold mt-2 text-gray-700">{isRtl ? "الحافلة:" : "Bus:"} {selectedBus.bus_number} — {selectedBus.plate_number}</p>
              <p className="text-sm font-bold mt-1 text-gray-700">{isRtl ? "السائق:" : "Driver:"} {selectedBus.driver ?? "—"}</p>
              <p className="text-sm font-bold mt-1 text-gray-700">{isRtl ? "المشرف:" : "Assistant:"} {selectedBus.assistant ?? "—"}</p>
              <p className="text-sm font-bold mt-1 text-gray-700">{isRtl ? "المسار:" : "Route:"} {selectedBus.route?.name ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-700">{isRtl ? "سعة الحافلة:" : "Bus Capacity:"} {selectedBus.capacity}</p>
              <p className="text-sm font-bold mt-1 text-gray-700">{isRtl ? "إجمالي الطلاب المخصصين:" : "Total Assigned:"} {uniqueTotal}</p>
              <p className="text-sm font-bold mt-1 text-emerald-600">{isRtl ? "رحلة ذهاب:" : "Forth:"} {forthStudentIds.length}</p>
              <p className="text-sm font-bold mt-1 text-yellow-600">{isRtl ? "رحلة عودة:" : "Return:"} {backStudentIds.length}</p>
            </div>
          </div>

          <div className="px-4">
            <table className="w-full border-collapse border border-gray-300 text-[10px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1.5 text-center font-bold w-8 text-black">#</th>
                  <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRtl ? "اسم الطالب" : "Student Name"}</th>
                  <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRtl ? "الرقم المدني" : "Civil ID"}</th>
                  <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{isRtl ? "رحلة ذهاب" : "Forth"}</th>
                  <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{isRtl ? "رحلة عودة" : "Return"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.filter(s => forthStudentIds.includes(s.id) || backStudentIds.includes(s.id)).map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-300">
                    <td className="border border-gray-300 p-1.5 text-center text-gray-700 font-semibold">{i + 1}</td>
                    <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{s.name}</td>
                    <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{s.national_id || s.student_code || "—"}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-bold text-gray-900">{forthStudentIds.includes(s.id) ? "✓" : "—"}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-bold text-gray-900">{backStudentIds.includes(s.id) ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && selectedBus && (
        <ConfirmModal
          changes={changes}
          bus={selectedBus}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          isSubmitting={isSubmitting}
          isRtl={isRtl}
        />
      )}

      {/* Stop Order Modal */}
      {showStopOrderModal && selectedBus && (
        <StopOrderModal
          bus={selectedBus}
          students={students}
          isOpen={showStopOrderModal}
          onClose={() => setShowStopOrderModal(false)}
          isRtl={isRtl}
        />
      )}

      <div className={DS_pageWrapper}>
        {/* Header Actions (Sticky) */}
        <div className="sticky top-2 sm:top-[10px] z-40 bg-white/95 dark:bg-[#0b1428]/95 backdrop-blur-xl p-3 sm:p-4 rounded-[16px] sm:rounded-[20px] shadow-lg border border-gray-100 dark:border-[#243460] mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
                href={route('school.buses.index')}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0f2044] dark:hover:text-white transition-all bg-gray-50 dark:bg-[#1a2845] rounded-[10px] sm:rounded-[14px] shadow-sm border border-gray-200 dark:border-[#243460]"
            >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span className="hidden sm:inline">{t('Back to Buses')}</span>
            </Link>

            <div className="flex flex-wrap items-center justify-end gap-2 flex-1">
            {/* Change summary badge */}
            {hasChanges && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-[10px] sm:rounded-[14px] text-[10px] sm:text-xs font-bold border ${hasConflicts ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400" : "bg-[#f5b800]/10 border-[#f5b800]/20 text-[#0f2044] dark:text-[#f5b800]"}`}
                >
                {hasConflicts ? <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" /> : <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                <span className="hidden sm:inline">
                    {hasConflicts
                        ? (isRtl ? "يوجد تنازع — راجع قبل الحفظ" : "Conflict detected — review first")
                        : (isRtl ? `${Object.values(changes).flat().length} تغييرات معلّقة` : `${Object.values(changes).flat().length} pending changes`)}
                </span>
                <span className="sm:hidden">
                    {hasConflicts ? (isRtl ? "يوجد تنازع" : "Conflict") : `${Object.values(changes).flat().length}`}
                </span>
                </motion.div>
            )}

            {selectedBus && (
                <>
                    <button
                        onClick={() => setShowStopOrderModal(true)}
                        className="p-2 sm:px-4 sm:py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-[10px] sm:rounded-[14px] font-bold text-sm transition-all flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800 shadow-sm"
                    >
                        <ListOrdered className="w-4 h-4 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="hidden sm:inline">{isRtl ? "ترتيب الطلاب في المسار" : "Order Route Students"}</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="p-2 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#0f2044] dark:hover:bg-[#1a2845] text-gray-700 dark:text-gray-300 rounded-[10px] sm:rounded-[14px] font-bold text-sm transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-[#243460]"
                    >
                        <Printer className="w-4 h-4 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{isRtl ? "طباعة السجل" : "Print Roster"}</span>
                    </button>
                </>
            )}

            <button
                onClick={handleReviewClick}
                disabled={!selectedBusId || !hasChanges}
                className={`flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-[10px] sm:rounded-[14px] text-xs sm:text-sm font-bold shadow-md transition-all ${
                    !selectedBusId || !hasChanges 
                    ? "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed" 
                    : "bg-[#f5b800] hover:bg-[#e0a900] text-[#0f2044]"
                }`}
            >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{isRtl ? "مراجعة وحفظ" : "Review & Save"}</span>
                <span className="sm:hidden">{isRtl ? "حفظ" : "Save"}</span>
            </button>
            </div>
        </div>

        {/* Success flash */}
        <AnimatePresence>
          {savedFlash && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 mb-4 rounded-[16px] bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold text-sm flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5" /> {savedFlash}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        {selectedBusId && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: isRtl ? "إجمالي الطلاب" : "Total Students", val: uniqueTotal, icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />, accent: "navy" as const },
              { label: isRtl ? "رحلة ذهاب" : "Forth", val: forthStudentIds.length, icon: <Sunrise className="w-4 h-4 sm:w-5 sm:h-5" />, accent: "blue" as const },
              { label: isRtl ? "رحلة عودة" : "Return", val: backStudentIds.length, icon: <Sunset className="w-4 h-4 sm:w-5 sm:h-5" />, accent: "gold" as const },
              { label: isRtl ? "المقاعد المتاحة" : "Available Seats", val: selectedBus ? Math.max(0, selectedBus.capacity - uniqueTotal) : 0, icon: <BusIcon className="w-4 h-4 sm:w-5 sm:h-5" />, accent: overCapacity ? "red" as const : "green" as const },
            ].map(s => (
              <div key={s.label} className={`${DS_statCard(s.accent)} !p-3 sm:!p-5 ${isRtl ? "flex-row-reverse" : ""}`}>
                <div className={`${DS_statIcon(s.accent)} !w-8 !h-8 sm:!w-12 sm:!h-12 flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                <div className={`${isRtl ? "text-right" : "text-left"} min-w-0`}>
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-500 line-clamp-1 break-words leading-tight mb-1">{s.label}</p>
                  <p className="text-lg sm:text-2xl font-black text-[#0f2044] dark:text-white leading-none">{s.val}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* ── Left Panel ─────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Bus Selector */}
            <div className={DS_card + " !overflow-visible p-6 border-2 border-transparent hover:border-[#7ba7e8]/30 transition-colors bg-gradient-to-br from-white to-gray-50/50 dark:from-[#1a2845] dark:to-[#0f2044]"} ref={dropdownRef}>
              <label className="flex items-center gap-2 text-sm font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-wider mb-4">
                <BusIcon className="w-5 h-5 text-[#f5b800]" />
                {isRtl ? "البحث أو اختيار الحافلة" : "Search or Select Bus"}
              </label>
              
              <div className="relative">
                  <div className="relative flex items-center">
                      <Search className={`absolute w-5 h-5 text-gray-400 ${isRtl ? 'right-4' : 'left-4'}`} />
                      <input
                          type="text"
                          value={isBusDropdownOpen ? busSearchQuery : (selectedBus ? `${selectedBus.bus_number} (${selectedBus.plate_number})` : '')}
                          onChange={(e) => {
                              setBusSearchQuery(e.target.value);
                              setIsBusDropdownOpen(true);
                          }}
                          onClick={() => {
                              setBusSearchQuery('');
                              setIsBusDropdownOpen(true);
                          }}
                          placeholder={isRtl ? "اكتب للبحث أو اختر من القائمة..." : "Type to search or select from list..."}
                          className={`w-full bg-white dark:bg-[#0b1428] border-2 text-gray-900 dark:text-white font-bold text-lg rounded-[16px] py-4 ${isRtl ? 'pr-12 pl-12' : 'pl-12 pr-12'} transition-all shadow-sm focus:ring-0 ${isBusDropdownOpen ? 'border-[#7ba7e8] ring-4 ring-[#7ba7e8]/20' : 'border-gray-200 dark:border-[#243460] cursor-pointer'}`}
                      />
                      <button 
                          type="button"
                          onClick={() => {
                              if (!isBusDropdownOpen) setBusSearchQuery('');
                              setIsBusDropdownOpen(!isBusDropdownOpen);
                          }}
                          className={`absolute ${isRtl ? 'left-3' : 'right-3'} p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a2845] transition-colors`}
                      >
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isBusDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                  </div>

                  <AnimatePresence>
                      {isBusDropdownOpen && (
                          <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] rounded-[16px] shadow-2xl overflow-hidden"
                          >
                              <div className="max-h-64 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                  {filteredBuses.length > 0 ? (
                                      filteredBuses.map((bus) => (
                                          <button
                                              key={bus.id}
                                              onClick={() => {
                                                  setSelectedBusId(bus.id);
                                                  setIsBusDropdownOpen(false);
                                                  setBusSearchQuery('');
                                              }}
                                              className={`w-full text-start px-4 py-3 rounded-[12px] transition-colors flex flex-col gap-1 ${
                                                  selectedBusId === bus.id 
                                                  ? 'bg-[#0f2044] text-white shadow-md' 
                                                  : 'hover:bg-gray-50 dark:hover:bg-white/5 text-[#0f2044] dark:text-gray-200'
                                              }`}
                                          >
                                              <span className="font-bold flex items-center justify-between">
                                                  {bus.bus_number}
                                                  {selectedBusId === bus.id && <CheckCircle2 className="w-4 h-4 text-[#f5b800]" />}
                                              </span>
                                              <span className={`text-xs font-semibold ${selectedBusId === bus.id ? 'text-gray-300' : 'text-gray-500'}`}>
                                                  {bus.plate_number} {bus.driver ? `• ${bus.driver}` : ''}
                                              </span>
                                          </button>
                                      ))
                                  ) : (
                                      <div className="py-6 text-center text-gray-500 text-sm font-bold flex flex-col items-center gap-2">
                                          <BusIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                          {isRtl ? "لا توجد حافلات مطابقة للبحث" : "No buses match your search"}
                                      </div>
                                  )}
                              </div>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
            </div>

            {/* Bus Details */}
            {selectedBus && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={DS_card + " p-6 flex flex-col gap-6"}
              >
                <div>
                  <h3 className="font-black text-[#0f2044] dark:text-white text-xl flex items-center gap-2 mb-1">
                    <BusIcon className="w-5 h-5 text-[#f5b800]" />
                    {selectedBus.bus_number}
                  </h3>
                  <p className="text-sm font-bold text-gray-500">{selectedBus.plate_number}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0f2044]/5 dark:bg-[#0f2044]/20 p-3.5 rounded-[16px] border border-[#0f2044]/10 dark:border-[#243460]">
                    <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">{isRtl ? "المسار" : "Route"}</span>
                    <span className="block text-sm font-black text-[#0f2044] dark:text-white truncate">{selectedBus.route?.name ?? "—"}</span>
                  </div>
                  <div className="bg-[#0f2044]/5 dark:bg-[#0f2044]/20 p-3.5 rounded-[16px] border border-[#0f2044]/10 dark:border-[#243460]">
                    <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">{isRtl ? "السائق" : "Driver"}</span>
                    <span className="block text-sm font-black text-[#0f2044] dark:text-white truncate">{selectedBus.driver ?? "—"}</span>
                  </div>
                  <div className="col-span-2 bg-[#f5b800]/10 dark:bg-[#f5b800]/5 p-3.5 rounded-[16px] border border-[#f5b800]/20">
                    <span className="block text-[10px] font-extrabold text-[#d49f00] dark:text-[#f5b800]/70 uppercase tracking-wider mb-1">{isRtl ? "المشرف" : "Assistant"}</span>
                    <span className="block text-sm font-black text-[#7a5c00] dark:text-[#f5b800] truncate">{selectedBus.assistant ?? "—"}</span>
                  </div>
                </div>

                {/* Order Students on Route Button */}
                <button
                  type="button"
                  onClick={() => setShowStopOrderModal(true)}
                  className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-[14px] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800 shadow-sm hover:shadow"
                >
                  <ListOrdered className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{isRtl ? "ترتيب الطلاب في المسار (1، 2، 3...)" : "Order Students (1, 2, 3...)"}</span>
                </button>

                {/* Capacity meter */}
                <div className="bg-gray-50 dark:bg-[#0f2044]/10 p-5 rounded-[20px] border border-gray-100 dark:border-[#243460]">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                        <span className="block text-xs font-bold text-gray-500 uppercase">{isRtl ? "معدل الإشغال" : "Occupancy"}</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className={`text-4xl font-black ${overCapacity ? "text-red-600 dark:text-red-400" : "text-[#0f2044] dark:text-white"}`}>{uniqueTotal}</span>
                            <span className="text-lg font-bold text-gray-400">/ {selectedBus.capacity}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-[#1a2845] flex items-center justify-center shadow-sm border border-gray-100 dark:border-[#243460]">
                        <span className="text-xl">👥</span>
                    </div>
                  </div>
                  
                  <div className="h-3 bg-gray-200 dark:bg-[#243460] rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      className={`h-full rounded-full transition-all duration-500 ${overCapacity ? "bg-red-500" : "bg-gradient-to-r from-[#f5b800] to-[#e0a900]"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((uniqueTotal / (selectedBus.capacity || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  {overCapacity && (
                    <p className="text-xs text-red-500 font-bold mt-3 bg-red-50 dark:bg-red-900/20 p-2 rounded-[8px] flex items-center gap-1.5 border border-red-100 dark:border-red-900/30">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {isRtl ? "تحذير: تم تجاوز سعة الحافلة!" : "Warning: Over capacity!"}
                    </p>
                  )}
                </div>

                {/* Legend */}
                <div className="pt-2">
                  <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">{isRtl ? "دليل الألوان" : "Color Legend"}</span>
                  <div className="space-y-2.5">
                    {[
                      { color: "bg-[#0f2044] border-[#0f2044] shadow-sm", label: isRtl ? "رحلة ذهاب فقط" : "Forth only" },
                      { color: "bg-[#f5b800] border-[#f5b800] shadow-sm", label: isRtl ? "رحلة عودة فقط" : "Back only" },
                      { color: "bg-gradient-to-r from-[#0f2044] to-[#f5b800] shadow-sm", label: isRtl ? "رحلة ذهاب وعودة" : "Both trips" },
                      { color: "bg-red-400 border-red-500 shadow-sm", label: isRtl ? "معين لحافلة أخرى" : "Assigned to another bus" },
                    ].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-gray-300">
                        <span className={`w-4 h-4 rounded-[6px] border ${color} inline-block flex-shrink-0`} /> {label}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right Panel: Students ───────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className={DS_card}>
              {/* Toolbar */}
              <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-[#243460] flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center justify-between bg-gray-50/50 dark:bg-[#0f2044]/5">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:flex-1 min-w-0">
                  <div className="relative w-full sm:max-w-xs flex-1">
                    <Search className={`absolute w-4 h-4 text-gray-400 top-1/2 -translate-y-1/2 ${isRtl ? "right-3" : "left-3"}`} />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder={isRtl ? "البحث عن طالب..." : "Search student..."}
                      className={`${DS_searchInput} w-full ${isRtl ? "pr-10" : "pl-10"}`}
                    />
                  </div>
                  <div className="flex w-full sm:w-auto overflow-x-auto custom-scrollbar rounded-[14px] bg-[#0f2044]/5 dark:bg-[#0f2044]/30 p-1 flex-shrink-0">
                    {(["all", "male", "female"] as const).map((g) => (
                      <button key={g} onClick={() => setGenderFilter(g)}
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-[10px] text-xs font-bold transition-all whitespace-nowrap ${genderFilter === g ? "bg-white dark:bg-[#1a2845] text-[#0f2044] dark:text-[#f5b800] shadow-md border border-gray-200 dark:border-[#f5b800]/50" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white border border-transparent"}`}
                      >
                        {g === "all" ? (isRtl ? "الكل" : "All") : g === "male" ? (isRtl ? "بنين" : "Male") : (isRtl ? "بنات" : "Female")}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-4 w-full lg:w-auto flex-shrink-0">
                  <button onClick={toggleAllForth} className="flex-1 lg:flex-none text-[#0f2044] dark:text-[#7ba7e8] hover:opacity-70 bg-[#0f2044]/10 dark:bg-[#0f2044]/30 px-2 sm:px-3 py-2 sm:py-1.5 rounded-[10px] transition-all text-[10px] sm:text-xs font-bold text-center flex items-center justify-center">
                    {allForthSelected ? (isRtl ? "إلغاء الكل ذهاب" : "Clear Forth") : (isRtl ? "تحديد الكل ذهاب" : "All Forth")}
                  </button>
                  <button onClick={toggleAllBack} className="flex-1 lg:flex-none text-[#7a5c00] dark:text-[#f5b800] hover:opacity-70 bg-[#f5b800]/20 px-2 sm:px-3 py-2 sm:py-1.5 rounded-[10px] transition-all text-[10px] sm:text-xs font-bold text-center flex items-center justify-center">
                    {allBackSelected ? (isRtl ? "إلغاء الكل عودة" : "Clear Back") : (isRtl ? "تحديد الكل عودة" : "All Back")}
                  </button>
                  {selectedBus && (
                    <button
                      type="button"
                      onClick={() => setShowStopOrderModal(true)}
                      className="flex-1 lg:flex-none text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-3 py-2 sm:py-1.5 rounded-[10px] transition-all text-[10px] sm:text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm"
                      title={isRtl ? "ترتيب الطلاب في المسار من الأول للأخير" : "Order students from first to last"}
                    >
                      <ListOrdered className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{isRtl ? "ترتيب المسار" : "Order Route"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Students Table */}
              <div className="p-0 border-t border-gray-100 dark:border-[#243460]">
                {!selectedBusId ? (
                  <div className="py-24 text-center">
                    <div className="w-20 h-20 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0f2044] dark:text-[#7ba7e8]">
                        <BusIcon className="w-10 h-10" />
                    </div>
                    <p className="font-bold text-gray-500 text-lg">{isRtl ? "الرجاء اختيار حافلة للبدء في تعيين الطلاب" : "Select a bus to start assigning students"}</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-20 text-center text-gray-500 font-bold text-lg">{isRtl ? "لا يوجد طلاب متطابقين مع البحث" : "No students found"}</div>
                ) : (
                  <div className={DS_tableWrapper + " !mx-0 px-2 sm:px-4 max-h-[700px] overflow-y-auto"}>
                    <table className={DS_tableBase}>
                        <thead className={`${DS_tableHead} sticky top-0 z-10 shadow-sm shadow-[#0f2044]/5`}>
                            <tr>
                                <th className={`${DS_tableTh(isRtl)} px-2 sm:px-4 min-w-[150px]`}>{isRtl ? "الطالب" : "Student"}</th>
                                <th className={DS_tableTh(isRtl)}>{isRtl ? "الرقم المدني" : "Civil ID"}</th>
                                <th className={DS_tableTh(isRtl) + " text-center"}>{isRtl ? "رحلة ذهاب" : "Forth"}</th>
                                <th className={DS_tableTh(isRtl) + " text-center"}>{isRtl ? "رحلة عودة" : "Back"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => {
                                const isForth = forthStudentIds.includes(student.id);
                                const isBack  = backStudentIds.includes(student.id);
                                const forthConflict = student.forth_bus_id && student.forth_bus_id !== selectedBusId && isForth;
                                const backConflict  = student.back_bus_id  && student.back_bus_id  !== selectedBusId && isBack;

                                return (
                                    <tr key={student.id} className={DS_tableRow}>
                                        <td className={`${DS_tableTd} px-2 sm:px-4`}>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-[#0f2044] dark:text-white text-sm">{student.name}</span>
                                                {(forthConflict || backConflict) && (
                                                    <span className="w-fit text-[10px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded-[6px] shadow-sm flex items-center gap-1 border border-red-200 dark:border-red-900/30">
                                                        <AlertTriangle className="w-3 h-3" /> {isRtl ? "تضارب حافلة أخرى" : "Conflict with another bus"}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`${DS_tableTd} font-mono text-xs font-semibold text-gray-500`}>
                                            {student.national_id || student.student_code || "—"}
                                        </td>
                                        <td className={`${DS_tableTd} text-center`}>
                                            <button 
                                                onClick={() => toggleForth(student.id)}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f2044] focus:ring-offset-2 ${isForth ? 'bg-[#0f2044] dark:bg-[#7ba7e8]' : 'bg-gray-200 dark:bg-[#1a2845] border border-gray-300 dark:border-[#243460]'}`}
                                            >
                                                <span className={`${isForth ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'} inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mx-1`} />
                                            </button>
                                        </td>
                                        <td className={`${DS_tableTd} text-center`}>
                                            <button 
                                                onClick={() => toggleBack(student.id)}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5b800] focus:ring-offset-2 ${isBack ? 'bg-[#f5b800]' : 'bg-gray-200 dark:bg-[#1a2845] border border-gray-300 dark:border-[#243460]'}`}
                                            >
                                                <span className={`${isBack ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'} inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mx-1`} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedBusId && filteredStudents.length > 0 && (
                <div className="px-5 py-4 border-t border-gray-100 dark:border-[#243460] flex flex-wrap gap-4 justify-between items-center text-xs text-gray-500 bg-gray-50 dark:bg-[#0f2044]/20 font-bold rounded-b-[20px]">
                  <span>{isRtl ? "الطلاب المعروضون" : "Shown"}: {filteredStudents.length}</span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[#0f2044] dark:text-[#7ba7e8]"><Sunrise className="w-4 h-4" /> {forthStudentIds.length}</span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1 text-[#d49f00] dark:text-[#f5b800]"><Sunset className="w-4 h-4" /> {backStudentIds.length}</span>
                    <span className="text-gray-300">|</span>
                    <span>{isRtl ? "الإجمالي الفعلي" : "Unique"}: <span className={`text-sm ${overCapacity ? "text-red-500" : "text-emerald-600"}`}>{uniqueTotal}</span></span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
