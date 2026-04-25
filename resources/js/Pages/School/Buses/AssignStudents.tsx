import { useState, useEffect, useMemo } from "react";
import { Head, usePage, router, Link } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import Modal from "@/Components/Modal";
import { motion, AnimatePresence } from "framer-motion";
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
    Users
} from "lucide-react";
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
                <Sunrise className="w-4 h-4" /> {isRtl ? "الرحلة الصباحية (ذهاب)" : "Morning Trip (Forth)"}
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
                <Sunset className="w-4 h-4" /> {isRtl ? "الرحلة المسائية (إياب)" : "Afternoon Trip (Back)"}
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
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

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

  return (
    <SchoolAuthenticatedLayout user={auth.user} header={<h2 className={DS_pageTitle}>{isRtl ? "تعيين الطلاب للحافلات" : "Assign Students to Buses"}</h2>}>
      <Head title={isRtl ? "تعيين الطلاب للحافلات" : "Assign Bus Students"} />

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

      <div className={DS_pageWrapper}>
        {/* Header Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
            <Link
                href={route('school.buses.index')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-[#0f2044] dark:hover:text-white transition-all bg-white dark:bg-[#1a2845] rounded-[14px] shadow-sm border border-gray-100 dark:border-[#243460] self-start"
            >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {t('Back to Buses')}
            </Link>

            <div className="flex items-center gap-3">
            {/* Change summary badge */}
            {hasChanges && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-[14px] text-xs font-bold border ${hasConflicts ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400" : "bg-[#f5b800]/10 border-[#f5b800]/20 text-[#0f2044] dark:text-[#f5b800]"}`}
                >
                {hasConflicts ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                {hasConflicts
                    ? (isRtl ? "يوجد تنازع — راجع قبل الحفظ" : "Conflict detected — review first")
                    : (isRtl ? `${Object.values(changes).flat().length} تغييرات معلّقة` : `${Object.values(changes).flat().length} pending changes`)}
                </motion.div>
            )}

            <button
                onClick={handleReviewClick}
                disabled={!selectedBusId || !hasChanges}
                className={DS_btnGold + " disabled:opacity-50 disabled:cursor-not-allowed"}
            >
                <CheckCircle2 className="w-4 h-4" />
                {isRtl ? "مراجعة وحفظ" : "Review & Save"}
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
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: isRtl ? "إجمالي الطلاب" : "Total Students", val: uniqueTotal, icon: <Users className="w-5 h-5" />, accent: "navy" as const },
              { label: isRtl ? "الصباحي (ذهاب)" : "Morning Trip", val: forthStudentIds.length, icon: <Sunrise className="w-5 h-5" />, accent: "blue" as const },
              { label: isRtl ? "المسائي (إياب)" : "Afternoon Trip", val: backStudentIds.length, icon: <Sunset className="w-5 h-5" />, accent: "gold" as const },
              { label: isRtl ? "المقاعد المتاحة" : "Available Seats", val: selectedBus ? Math.max(0, selectedBus.capacity - uniqueTotal) : 0, icon: <BusIcon className="w-5 h-5" />, accent: overCapacity ? "red" as const : "green" as const },
            ].map(s => (
              <div key={s.label} className={`${DS_statCard(s.accent)} ${isRtl ? "flex-row-reverse" : ""}`}>
                <div className={DS_statIcon(s.accent)}>{s.icon}</div>
                <div className={isRtl ? "text-right" : "text-left"}>
                  <p className={DS_statLabel}>{s.label}</p>
                  <p className={DS_statValue}>{s.val}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* ── Left Panel ─────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Bus Selector */}
            <div className={DS_card + " p-5"}>
              <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">
                {isRtl ? "اختر الحافلة" : "Select Bus"}
              </label>
              <select
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value ? Number(e.target.value) : "")}
                className={DS_searchInput}
              >
                <option value="">{isRtl ? "— اختر حافلة —" : "— Select a bus —"}</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.bus_number} ({bus.plate_number})
                  </option>
                ))}
              </select>
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
                      { color: "bg-[#0f2044] border-[#0f2044] shadow-sm", label: isRtl ? "صباحي فقط (ذهاب)" : "Morning only" },
                      { color: "bg-[#f5b800] border-[#f5b800] shadow-sm", label: isRtl ? "مسائي فقط (إياب)" : "Afternoon only" },
                      { color: "bg-gradient-to-r from-[#0f2044] to-[#f5b800] shadow-sm", label: isRtl ? "ذهاب + إياب" : "Both trips" },
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
              <div className="p-4 border-b border-gray-100 dark:border-[#243460] flex flex-wrap gap-4 items-center justify-between bg-gray-50/50 dark:bg-[#0f2044]/5">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative flex-1 max-w-sm">
                    <Search className={`absolute w-4 h-4 text-gray-400 top-1/2 -translate-y-1/2 ${isRtl ? "right-3" : "left-3"}`} />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder={isRtl ? "البحث عن طالب (الاسم، الرقم المدني)..." : "Search student (Name, Civil ID)..."}
                      className={`${DS_searchInput} ${isRtl ? "pr-10" : "pl-10"}`}
                    />
                  </div>
                  <div className="flex rounded-[14px] bg-[#0f2044]/5 dark:bg-[#0f2044]/30 p-1">
                    {(["all", "male", "female"] as const).map((g) => (
                      <button key={g} onClick={() => setGenderFilter(g)}
                        className={`px-4 py-1.5 rounded-[10px] text-xs font-bold transition-all ${genderFilter === g ? "bg-white dark:bg-[#0f2044] text-[#0f2044] dark:text-[#f5b800] shadow-sm" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"}`}
                      >
                        {g === "all" ? (isRtl ? "الكل" : "All") : g === "male" ? (isRtl ? "بنين" : "Male") : (isRtl ? "بنات" : "Female")}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 text-xs font-bold flex-shrink-0">
                  <button onClick={toggleAllForth} className="text-[#0f2044] dark:text-[#7ba7e8] hover:opacity-70 bg-[#0f2044]/10 dark:bg-[#0f2044]/30 px-3 py-1.5 rounded-[10px] transition-all">
                    {allForthSelected ? (isRtl ? "إلغاء الصباحي" : "Deselect Morning") : (isRtl ? "تحديد الكل (صباحي)" : "Select All Morning")}
                  </button>
                  <button onClick={toggleAllBack} className="text-[#7a5c00] dark:text-[#f5b800] hover:opacity-70 bg-[#f5b800]/20 px-3 py-1.5 rounded-[10px] transition-all">
                    {allBackSelected ? (isRtl ? "إلغاء المسائي" : "Deselect Afternoon") : (isRtl ? "تحديد الكل (مسائي)" : "Select All Afternoon")}
                  </button>
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
                  <div className={DS_tableWrapper + " max-h-[700px] overflow-y-auto"}>
                    <table className={DS_tableBase}>
                        <thead className={`${DS_tableHead} sticky top-0 z-10 shadow-sm shadow-[#0f2044]/5`}>
                            <tr>
                                <th className={DS_tableTh(isRtl)}>{isRtl ? "الطالب" : "Student"}</th>
                                <th className={DS_tableTh(isRtl)}>{isRtl ? "الرقم المدني" : "Civil ID"}</th>
                                <th className={DS_tableTh(isRtl) + " text-center"}>{isRtl ? "الصباحي (ذهاب)" : "Morning (Forth)"}</th>
                                <th className={DS_tableTh(isRtl) + " text-center"}>{isRtl ? "المسائي (إياب)" : "Afternoon (Back)"}</th>
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
                                        <td className={DS_tableTd}>
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
                                            <label className={`inline-flex items-center justify-center p-2 rounded-[12px] cursor-pointer transition-all border ${isForth ? 'bg-[#0f2044]/5 border-[#0f2044]/20 dark:bg-[#0f2044]/30 dark:border-[#7ba7e8]/30 shadow-inner' : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                                <input type="checkbox" checked={isForth} onChange={() => toggleForth(student.id)}
                                                    className="w-4 h-4 rounded-[4px] border-gray-300 text-[#0f2044] focus:ring-[#0f2044] cursor-pointer"
                                                />
                                            </label>
                                        </td>
                                        <td className={`${DS_tableTd} text-center`}>
                                            <label className={`inline-flex items-center justify-center p-2 rounded-[12px] cursor-pointer transition-all border ${isBack ? 'bg-[#f5b800]/10 border-[#f5b800]/30 shadow-inner' : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                                <input type="checkbox" checked={isBack} onChange={() => toggleBack(student.id)}
                                                    className="w-4 h-4 rounded-[4px] border-gray-300 text-[#f5b800] focus:ring-[#f5b800] cursor-pointer"
                                                />
                                            </label>
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
