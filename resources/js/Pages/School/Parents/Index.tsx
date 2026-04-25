import { useState, useMemo } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import PrintReportHeader from "@/Components/PrintReportHeader";
import useTranslation from "@/hooks/useTranslation";
import { motion } from "framer-motion";
import {
  Users, CheckCircle2, UserX, UserPlus, Baby, Printer, X,
} from "lucide-react";
import {
  DS_card, DS_pageWrapper, DS_pageTitle, DS_statLabel, DS_statValue,
  DS_avatar, DS_tableWrapper, DS_tableBase, DS_tableHead, DS_tableRow, DS_tableTd,
  DS_searchInput, DS_btnGold, DS_btnSecondary, DS_btnEdit, DS_btnDanger,
  DS_modalContainer, DS_modalHeaderTitle, DS_modalHeaderAccent, DS_modalClose, DS_modalBody,
  DS_inputCls, DS_labelCls, DS_cancelBtn, DS_childAvatar, DS_confirmModal,
  DS_statCard, DS_statIcon, DS_badge, DS_filterBtn, DS_tableTh,
  DS_modalHeader, DS_sectionHeader, DS_childItem, DS_submitBtn,
} from "@/lib/DS";

// ─── Types ───────────────────────────────────────────────────────
interface Student {
  id: number;
  name: string;
  national_id: string;
  image: string | null;
  classroom: string;
}

interface Guardian {
  id: number;
  name: string;
  name_en: string;
  national_id: string;
  phone: string;
  email: string | null;
  address: string | null;
  image: string | null;
  status: "active" | "inactive";
  students: Student[];
}

interface Props {
  auth: any;
  guardians: Guardian[];
  filters: { search?: string };
}

// ─── Print CSS ───────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

// ─── Main Component ──────────────────────────────────────────────
export default function ParentsIndex({ auth, guardians, filters }: Props) {
  const { t, isRtl } = useTranslation();

  const [search, setSearch] = useState(filters.search || "");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Guardian | null>(null);
  const [childrenModal, setChildrenModal] = useState<Guardian | null>(null);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    _method: "post" as "post" | "put",
    name: "", name_en: "", national_id: "", phone: "", email: "", address: "",
    status: "active" as "active" | "inactive",
  });

  const handleSearch = (v: string) => {
    setSearch(v);
    router.get(route("school.parents.index"), { search: v }, { preserveState: true, replace: true });
  };

  const filtered = useMemo(() => {
    if (activeFilter === "active") return guardians.filter(g => g.status === "active");
    if (activeFilter === "inactive") return guardians.filter(g => g.status === "inactive");
    return guardians;
  }, [guardians, activeFilter]);

  const counts = {
    all: guardians.length,
    active: guardians.filter(g => g.status === "active").length,
    inactive: guardians.filter(g => g.status === "inactive").length,
  };

  const openAdd = () => { setIsEditing(false); setCurrentId(null); reset(); setData("_method", "post"); clearErrors(); setIsModalOpen(true); };
  const openEdit = (g: Guardian) => {
    setIsEditing(true); setCurrentId(g.id);
    setData({ _method: "put", name: g.name, name_en: g.name_en || "", national_id: g.national_id, phone: g.phone, email: g.email || "", address: g.address || "", status: g.status });
    clearErrors(); setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); reset(); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentId) {
      post(route("school.parents.update", currentId), { forceFormData: true, onSuccess: () => closeModal() });
    } else {
      post(route("school.parents.store"), { onSuccess: () => closeModal() });
    }
  };
  const confirmDelete = (g: Guardian) => { setDeleteTarget(g); setShowDeleteModal(true); };
  const handleDelete = () => {
    if (deleteTarget) {
      router.delete(route("school.parents.destroy", deleteTarget.id), {
        onSuccess: () => { setShowDeleteModal(false); setDeleteTarget(null); }
      });
    }
  };

  const stats = [
    { label: t("Total Parents"), val: counts.all,    icon: <Users className="w-5 h-5" />,        accent: "navy" as const },
    { label: t("Active"),        val: counts.active,  icon: <CheckCircle2 className="w-5 h-5" />, accent: "gold" as const },
    { label: t("Inactive"),      val: counts.inactive, icon: <UserX className="w-5 h-5" />,       accent: "red"  as const },
  ];

  const filterBtns = [
    { key: "all",      label: t("All")      },
    { key: "active",   label: t("Active")   },
    { key: "inactive", label: t("Inactive") },
  ];

  const tableHeaders = [
    t("Parent"), t("Civil ID"), t("Phone Number"), t("Email"), t("Status"), t("Children"), t("Actions"),
  ];

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={<h2 className={DS_pageTitle}>{t("Parents Management")}</h2>}
    >
      <Head title={t("Parents")} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area ─────────────────────────────────────────────── */}
      <div id="print-area" className="hidden print:block bg-white font-sans text-black w-full" dir="rtl">
        <PrintReportHeader
          title={t("Parents Report")}
          schoolName={auth.user?.school?.name || t("School name not available")}
          schoolLogo={auth.user?.school?.logo || null}
          printDate={`${t("Print Date")}: ${new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}`}
          schoolAdminText={t("School Admin")}
        />
        <div className="px-4">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                {["#", t("Parent"), t("Civil ID"), t("Phone Number"), t("Status")].map((h, i) => (
                  <th key={i} className={`border border-gray-300 p-3 text-right font-bold text-black ${i === 0 ? "w-12" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => (
                <tr key={g.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-3 text-center text-gray-700 font-semibold">{i + 1}</td>
                  <td className="border border-gray-300 p-3 font-bold text-gray-900">{g.name}</td>
                  <td className="border border-gray-300 p-3 font-mono text-gray-700">{g.national_id}</td>
                  <td className="border border-gray-300 p-3 font-mono text-gray-700" dir="ltr">{g.phone}</td>
                  <td className="border border-gray-300 p-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${g.status === "active" ? "bg-gray-100 text-black border-gray-400" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                      {g.status === "active" ? t("Active") : t("Inactive")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{t("Total Parents")}: {filtered.length}</p>
            <p>{t("Principal Signature")}: ............................</p>
          </div>
        </div>
      </div>

      {/* ── Main UI ─────────────────────────────────────────────────── */}
      <div className={DS_pageWrapper}>

        {/* Stat Cards */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map(s => (
            <div key={s.label} className={`${DS_statCard(s.accent)} ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className={DS_statIcon(s.accent)}>{s.icon}</div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <p className={DS_statLabel}>{s.label}</p>
                <p className={DS_statValue}>{s.val}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Table Card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={DS_card}>

          {/* Toolbar */}
          <div className={DS_sectionHeader(isRtl)}>
            <div className="flex-1 min-w-[200px]">
              <input type="text" value={search} onChange={e => handleSearch(e.target.value)} placeholder={t("Search by name, ID, phone...")} className={DS_searchInput} dir={isRtl ? "rtl" : "ltr"} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {filterBtns.map(f => (
                <button key={f.key} onClick={() => setActiveFilter(f.key)} className={DS_filterBtn(activeFilter === f.key)}>{f.label}</button>
              ))}
            </div>
            <button onClick={() => window.print()} className={DS_btnSecondary}>
              <Printer className="w-4 h-4" />{t("Print")}
            </button>
            <button onClick={openAdd} className={DS_btnGold}>
              <UserPlus className="w-4 h-4" />{t("+ Add Parent")}
            </button>
          </div>

          {/* Table */}
          <div className={DS_tableWrapper}>
            <table className={DS_tableBase}>
              <thead className={DS_tableHead}>
                <tr>{tableHeaders.map(h => <th key={h} className={DS_tableTh(isRtl)}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-bold">{t("No parents found")}</p>
                    </td>
                  </tr>
                ) : filtered.map(g => (
                  <tr key={g.id} className={DS_tableRow}>
                    {/* Name */}
                    <td className={DS_tableTd}>
                      <div className="flex items-center gap-3">
                        <div className={DS_avatar}>
                          {g.image ? <img src={`/storage/${g.image}`} alt={g.name} className="w-full h-full object-cover" /> : g.name.charAt(0)}
                        </div>
                        <div className={isRtl ? "text-right" : "text-left"}>
                          <p className="font-semibold text-[#0f2044] dark:text-white">{g.name}</p>
                          {g.name_en && <p className="text-xs text-gray-400">{g.name_en}</p>}
                        </div>
                      </div>
                    </td>
                    <td className={`${DS_tableTd} font-mono text-xs text-gray-500 dark:text-gray-400`}>{g.national_id}</td>
                    <td className={`${DS_tableTd} font-mono text-gray-700 dark:text-gray-300`}>{g.phone}</td>
                    <td className={`${DS_tableTd} text-gray-500 dark:text-gray-400 text-xs`}>{g.email || "—"}</td>
                    <td className={DS_tableTd}><span className={DS_badge(g.status === "active")}>{g.status === "active" ? t("Active") : t("Inactive")}</span></td>
                    <td className={DS_tableTd}>
                      <button onClick={() => setChildrenModal(g)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#f5b800]/10 text-[#7a5c00] dark:text-[#f5b800] text-xs font-bold hover:bg-[#f5b800]/20 transition-all">
                        <Baby className="w-3.5 h-3.5" /><span>{g.students.length}</span>
                      </button>
                    </td>
                    <td className={DS_tableTd}>
                      <div className={`flex gap-2 ${isRtl ? "justify-start" : "justify-end"}`}>
                        <button onClick={() => openEdit(g)} className={DS_btnEdit}>{t("Edit")}</button>
                        <button onClick={() => confirmDelete(g)} className={DS_btnDanger}>{t("Delete")}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* ── Add/Edit Modal ─────────────────────────────────────────── */}
      <Modal show={isModalOpen} onClose={closeModal} maxWidth="lg">
        <div className={DS_modalHeader(isRtl)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <h3 className="text-xl font-bold text-white">
                {isEditing ? t("Edit Parent") : t("Add New Parent")}
              </h3>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">{t("Name (Arabic)")} *</label>
              <input type="text" value={data.name} onChange={e => setData("name", e.target.value)} dir="rtl" required className={DS_searchInput} />
              <InputError message={errors.name} className="mt-1" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">{t("Name (English)")}</label>
              <input type="text" value={data.name_en} onChange={e => setData("name_en", e.target.value)} dir="ltr" className={DS_searchInput} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">{t("Civil ID")} *</label>
              <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value)} dir="ltr" required className={DS_searchInput} />
              <InputError message={errors.national_id} className="mt-1" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">{t("Phone Number")} *</label>
              <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value)} dir="ltr" required className={DS_searchInput} />
              <InputError message={errors.phone} className="mt-1" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">{t("Email")}</label>
              <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} dir="ltr" className={DS_searchInput} />
              <InputError message={errors.email} className="mt-1" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">{t("Address / House #")}</label>
              <input type="text" value={data.address} onChange={e => setData("address", e.target.value)} className={DS_searchInput} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">{t("Status")}</label>
              <select value={data.status} onChange={e => setData("status", e.target.value as any)} className={DS_searchInput}>
                <option value="active">{t("Active")}</option>
                <option value="inactive">{t("Inactive")}</option>
              </select>
            </div>
          </div>
          <div className={`flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 ${isRtl ? 'justify-start' : 'justify-end'}`}>
            <button type="button" onClick={closeModal} className={DS_cancelBtn}>{t("Cancel")}</button>
            <button type="submit" disabled={processing} className={DS_submitBtn(processing)}>
              {processing ? t("Saving...") : (isEditing ? t("Save Changes") : t("Add"))}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Children Modal ─────────────────────────────────────────── */}
      <Modal show={!!childrenModal} onClose={() => setChildrenModal(null)} maxWidth="lg">
        <div className={DS_modalHeader(isRtl)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
              <Baby className="w-5 h-5 text-white" />
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <h3 className="text-xl font-bold text-white">
                {t("Children of")}: {childrenModal?.name}
              </h3>
              <p className="text-[#7ba7e8] text-sm font-semibold mt-0.5">
                {childrenModal?.students.length} {t("student(s)")}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
          {childrenModal?.students.length === 0 ? (
            <p className="text-center text-gray-500 font-bold py-8">{t("No children registered")}</p>
          ) : childrenModal?.students.map(s => (
            <div key={s.id} className={DS_childItem(isRtl)}>
              <div className={DS_childAvatar}>
                {s.image ? <img src={`/storage/${s.image}`} alt={s.name} className="w-full h-full object-cover" /> : s.name.charAt(0)}
              </div>
              <div className={`flex-1 ${isRtl ? "text-right" : "text-left"}`}>
                <p className="font-bold text-sm text-[#0f2044] dark:text-white">{s.name}</p>
                <p className="text-xs font-semibold text-gray-500">{s.national_id} · {s.classroom}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ───────────────────────────────────── */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="sm">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-[#0f2044] dark:text-white mb-2">{t("Confirm Delete")}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-6">{t("The parent will be deactivated. Are you sure?")}</p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteModal(false)} className={`flex-1 py-3 ${DS_cancelBtn}`}>{t("Cancel")}</button>
            <button onClick={handleDelete} className="flex-1 py-3 rounded-[14px] bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow">{t("Delete")}</button>
          </div>
        </div>
      </Modal>
    </SchoolAuthenticatedLayout>
  );
}
