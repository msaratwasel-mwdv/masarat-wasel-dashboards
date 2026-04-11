import { useState, useEffect, useMemo } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";

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
    icon: string;
  }) => {
    if (items.length === 0) return null;
    return (
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${color}`}>
          {icon} {title} ({items.length})
        </p>
        <ul className="space-y-1 max-h-36 overflow-y-auto">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5">
              <span className="font-medium text-slate-800 dark:text-white">{item.label}</span>
              {item.sub && <span className="text-xs text-slate-400">{item.sub}</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 text-brand-yellow flex items-center justify-center text-xl">
            🚌
          </div>
          <div>
            <h2 className="font-black text-slate-800 dark:text-white text-lg">
              {isRtl ? "تأكيد التعيينات" : "Confirm Assignments"}
            </h2>
            <p className="text-xs text-slate-500">
              {isRtl ? "الباص: " : "Bus: "}
              <strong>{bus.bus_number} — {bus.plate_number}</strong>
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {!hasChanges ? (
            <div className="py-10 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-bold text-slate-600 dark:text-slate-400">
                {isRtl ? "لا توجد تغييرات للحفظ" : "No changes to save"}
              </p>
            </div>
          ) : (
            <>
              {/* CONFLICTS WARNING */}
              {(changes.forthMoved.length > 0 || changes.backMoved.length > 0) && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-amber-700 dark:text-amber-400 font-bold text-sm mb-1">
                    ⚠️ {isRtl ? "تحذير: تنازع في التعيين" : "Warning: Assignment Conflict"}
                  </p>
                  <p className="text-amber-600 dark:text-amber-500 text-xs">
                    {isRtl
                      ? "بعض الطلاب معيّنون حالياً لباص آخر وسيتم نقلهم."
                      : "Some students are currently on another bus and will be moved."}
                  </p>
                </div>
              )}

              {/* Forth (Morning) changes */}
              <div className="space-y-3">
                <p className="text-sm font-black text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  🌅 {isRtl ? "رحلة الذهاب" : "Forth Trip"}
                </p>
                <Section
                  title={isRtl ? "إضافة" : "Adding"}
                  color="text-emerald-600 dark:text-emerald-400"
                  icon="➕"
                  items={changes.forthAdded.map((s) => ({ label: s.name, sub: s.national_id }))}
                />
                <Section
                  title={isRtl ? "إزالة" : "Removing"}
                  color="text-red-500 dark:text-red-400"
                  icon="➖"
                  items={changes.forthRemoved.map((s) => ({ label: s.name, sub: s.national_id }))}
                />
                <Section
                  title={isRtl ? "نقل من باص آخر" : "Moving from another bus"}
                  color="text-amber-600 dark:text-amber-400"
                  icon="🔄"
                  items={changes.forthMoved.map((m) => ({ label: m.student.name, sub: `من ${m.from}` }))}
                />
              </div>

              {/* Back (Afternoon) changes */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <p className="text-sm font-black text-orange-600 dark:text-orange-400 flex items-center gap-2">
                  🌇 {isRtl ? "رحلة الإياب" : "Back Trip"}
                </p>
                <Section
                  title={isRtl ? "إضافة" : "Adding"}
                  color="text-emerald-600 dark:text-emerald-400"
                  icon="➕"
                  items={changes.backAdded.map((s) => ({ label: s.name, sub: s.national_id }))}
                />
                <Section
                  title={isRtl ? "إزالة" : "Removing"}
                  color="text-red-500 dark:text-red-400"
                  icon="➖"
                  items={changes.backRemoved.map((s) => ({ label: s.name, sub: s.national_id }))}
                />
                <Section
                  title={isRtl ? "نقل من باص آخر" : "Moving from another bus"}
                  color="text-amber-600 dark:text-amber-400"
                  icon="🔄"
                  items={changes.backMoved.map((m) => ({ label: m.student.name, sub: `من ${m.from}` }))}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {isRtl ? "إلغاء" : "Cancel"}
          </button>
          {hasChanges && (
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-brand-yellow text-slate-900 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isRtl ? "تأكيد الحفظ" : "Confirm & Save"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssignStudents() {
  const { auth, buses, students, selectedBusId: initialBusId, flash } =
    usePage().props as unknown as PageProps;
  const { isRtl } = useTranslation();

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

    // Moved = added but was already on a DIFFERENT bus
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
    <SchoolAuthenticatedLayout user={auth.user}>
      <Head title={isRtl ? "تعيين الطلاب للباصات" : "Assign Bus Students"} />

      {/* Confirm Modal */}
      <AnimatePresence>
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
      </AnimatePresence>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
              {isRtl ? "تعيين الطلاب للباصات" : "Assign Bus Students"} 🚌
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isRtl ? "اختر باصاً وعيّن الطلاب لرحلة الذهاب والإياب" : "Select a bus and assign students for forth & back trips"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Change summary badge */}
            {hasChanges && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${hasConflicts ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400" : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400"}`}
              >
                {hasConflicts ? "⚠️" : "📝"}
                {hasConflicts
                  ? (isRtl ? "يوجد تنازع — راجع قبل الحفظ" : "Conflict detected — review first")
                  : (isRtl ? `${Object.values(changes).flat().length} تغييرات معلّقة` : `${Object.values(changes).flat().length} pending changes`)}
              </motion.div>
            )}

            <button
              onClick={handleReviewClick}
              disabled={!selectedBusId || !hasChanges}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-brand-yellow text-slate-900 shadow-lg shadow-brand-yellow/20 hover:shadow-brand-yellow/40 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isRtl ? "مراجعة وحفظ" : "Review & Save"}
            </button>
          </div>
        </div>

        {/* Success flash */}
        <AnimatePresence>
          {savedFlash && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold text-sm flex items-center gap-3"
            >
              <span className="text-xl">✅</span> {savedFlash}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* ── Left Panel ─────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Bus Selector */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                {isRtl ? "اختر الباص" : "Select Bus"}
              </label>
              <select
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-yellow outline-none"
              >
                <option value="">{isRtl ? "— اختر باصاً —" : "— Select a bus —"}</option>
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
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <h3 className="font-black text-slate-800 dark:text-white text-sm">{isRtl ? "تفاصيل الباص" : "Bus Details"}</h3>
                {[
                  { label: isRtl ? "رقم الباص" : "Bus No.", value: selectedBus.bus_number },
                  { label: isRtl ? "اللوحة" : "Plate", value: selectedBus.plate_number },
                  { label: isRtl ? "المسار" : "Route", value: selectedBus.route?.name ?? "—" },
                  { label: isRtl ? "السائق" : "Driver", value: selectedBus.driver ?? "—" },
                  { label: isRtl ? "المساعد" : "Assistant", value: selectedBus.assistant ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800 dark:text-white text-right max-w-[55%] truncate">{value}</span>
                  </div>
                ))}

                {/* Capacity meter */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-500">{isRtl ? "الإشغال" : "Occupancy"}</span>
                    <span className={overCapacity ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}>
                      {uniqueTotal} / {selectedBus.capacity}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full transition-colors ${overCapacity ? "bg-red-500" : "bg-emerald-500"}`}
                      animate={{ width: `${Math.min((uniqueTotal / (selectedBus.capacity || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  {overCapacity && (
                    <p className="text-xs text-red-500 font-bold mt-1.5">⚠️ {isRtl ? "تجاوز السعة!" : "Over capacity!"}</p>
                  )}
                </div>

                {/* Changes preview mini */}
                {hasChanges && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <p className="text-xs font-bold text-slate-500 uppercase">{isRtl ? "التغييرات المعلّقة" : "Pending Changes"}</p>
                    {changes.forthAdded.length > 0 && <p className="text-xs text-emerald-600">➕ {isRtl ? "ذهاب" : "Forth"}: +{changes.forthAdded.length}</p>}
                    {changes.forthRemoved.length > 0 && <p className="text-xs text-red-500">➖ {isRtl ? "ذهاب" : "Forth"}: -{changes.forthRemoved.length}</p>}
                    {changes.forthMoved.length > 0 && <p className="text-xs text-amber-600">🔄 {isRtl ? "نقل ذهاب" : "Forth moved"}: {changes.forthMoved.length}</p>}
                    {changes.backAdded.length > 0 && <p className="text-xs text-emerald-600">➕ {isRtl ? "إياب" : "Back"}: +{changes.backAdded.length}</p>}
                    {changes.backRemoved.length > 0 && <p className="text-xs text-red-500">➖ {isRtl ? "إياب" : "Back"}: -{changes.backRemoved.length}</p>}
                    {changes.backMoved.length > 0 && <p className="text-xs text-amber-600">🔄 {isRtl ? "نقل إياب" : "Back moved"}: {changes.backMoved.length}</p>}
                  </div>
                )}

                {/* Legend */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  {[
                    { color: "bg-blue-400", label: isRtl ? "ذهاب فقط" : "Forth only" },
                    { color: "bg-orange-400", label: isRtl ? "إياب فقط" : "Back only" },
                    { color: "bg-purple-400", label: isRtl ? "ذهاب + إياب" : "Both trips" },
                    { color: "bg-amber-400", label: isRtl ? "على باص آخر" : "On another bus" },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={`w-3 h-3 rounded-sm ${color} inline-block flex-shrink-0`} /> {label}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right Panel: Students ───────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative flex-1 max-w-xs">
                    <svg className={`absolute w-4 h-4 text-slate-400 top-1/2 -translate-y-1/2 ${isRtl ? "right-3" : "left-3"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder={isRtl ? "اسم، هوية، كود..." : "Name, ID, code..."}
                      className={`w-full py-2 ${isRtl ? "pr-9 pl-4" : "pl-9 pr-4"} text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-yellow`}
                    />
                  </div>
                  <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs font-bold flex-shrink-0">
                    {(["all", "male", "female"] as const).map((g) => (
                      <button key={g} onClick={() => setGenderFilter(g)}
                        className={`px-3 py-2 transition-colors ${genderFilter === g ? "bg-brand-yellow text-slate-900" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                      >
                        {g === "all" ? (isRtl ? "الكل" : "All") : g === "male" ? (isRtl ? "ذكر" : "Male") : (isRtl ? "أنثى" : "Female")}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 text-xs font-bold flex-shrink-0">
                  <button onClick={toggleAllForth} className="text-blue-500 hover:text-blue-700">
                    {allForthSelected ? (isRtl ? "إلغاء ذهاب" : "Deselect Forth") : (isRtl ? "كل ذهاب" : "All Forth")}
                  </button>
                  <span className="text-slate-300">|</span>
                  <button onClick={toggleAllBack} className="text-orange-500 hover:text-orange-700">
                    {allBackSelected ? (isRtl ? "إلغاء إياب" : "Deselect Back") : (isRtl ? "كل إياب" : "All Back")}
                  </button>
                </div>
              </div>

              {/* Students grid */}
              <div className="p-4">
                {!selectedBusId ? (
                  <div className="py-20 text-center">
                    <div className="text-5xl mb-3">🚌</div>
                    <p className="font-bold text-slate-500">{isRtl ? "اختر باصاً للبدء" : "Select a bus to get started"}</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-16 text-center text-slate-500">{isRtl ? "لا يوجد طلاب" : "No students found"}</div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredStudents.map((student) => {
                      const isForth = forthStudentIds.includes(student.id);
                      const isBack  = backStudentIds.includes(student.id);
                      const both = isForth && isBack;

                      // Conflict: student is on a DIFFERENT forth or back bus
                      const forthConflict = student.forth_bus_id && student.forth_bus_id !== selectedBusId && isForth;
                      const backConflict  = student.back_bus_id  && student.back_bus_id  !== selectedBusId && isBack;

                      const borderColor = both
                        ? "border-purple-400 bg-purple-50 dark:bg-purple-900/10"
                        : isForth
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/10"
                        : isBack
                        ? "border-orange-400 bg-orange-50 dark:bg-orange-900/10"
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/50";

                      return (
                        <div key={student.id} className={`relative p-4 rounded-xl border-2 transition-all ${borderColor}`}>
                          {/* Conflict badge */}
                          {(forthConflict || backConflict) && (
                            <span className="absolute top-2 right-2 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded-full">
                              ⚠️
                            </span>
                          )}

                          <div className="mb-3">
                            <p className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{student.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{student.national_id || student.student_code || "—"}</p>
                          </div>

                          <div className="flex gap-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <label className="flex items-center gap-1.5 cursor-pointer group">
                              <input type="checkbox" checked={isForth} onChange={() => toggleForth(student.id)}
                                className="rounded border-slate-300 text-blue-500 focus:ring-blue-400 cursor-pointer"
                              />
                              <span className={`text-xs font-bold transition-colors group-hover:text-blue-600 ${isForth ? "text-blue-600" : "text-slate-500"}`}>
                                {isRtl ? "ذهاب" : "Forth"} 🌅
                              </span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer group">
                              <input type="checkbox" checked={isBack} onChange={() => toggleBack(student.id)}
                                className="rounded border-slate-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                              />
                              <span className={`text-xs font-bold transition-colors group-hover:text-orange-600 ${isBack ? "text-orange-600" : "text-slate-500"}`}>
                                {isRtl ? "إياب" : "Back"} 🌇
                              </span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedBusId && filteredStudents.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/30">
                  <span>{isRtl ? "الطلاب المعروضون" : "Shown"}: {filteredStudents.length}</span>
                  <span>
                    🌅 <strong className="text-blue-500">{forthStudentIds.length}</strong>
                    {"  ·  "}
                    🌇 <strong className="text-orange-500">{backStudentIds.length}</strong>
                    {"  ·  "}
                    {isRtl ? "إجمالي فريد" : "Unique"}: <strong className={overCapacity ? "text-red-500" : "text-emerald-500"}>{uniqueTotal}</strong>
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
