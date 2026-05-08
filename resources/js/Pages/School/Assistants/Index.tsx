import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import { useTheme } from "@/Contexts/ThemeContext";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, User, PhoneCall, CheckCircle, XCircle, Eye, Edit2, CreditCard,
  Phone, Mail, MapPin, X, ArrowLeft, ChevronRight, Printer
} from "lucide-react";
import {
  DS_pageWrapper, DS_pageTitle, DS_card, DS_tableWrapper, DS_tableBase,
  DS_tableHead, DS_tableTh, DS_tableRow, DS_tableTd, DS_searchInput, DS_avatar,
  DS_modalContainer, DS_modalHeader, DS_modalHeaderTitle, DS_modalHeaderAccent,
  DS_modalClose, DS_modalBody, DS_modalFooter, DS_input, DS_label,
  DS_btnPrimary, DS_btnGold, DS_btnSecondary, DS_btnEdit, DS_btnDanger,
  DS_sectionHeader
} from "@/lib/DS";
import PrintReportHeader from "@/Components/PrintReportHeader";

// ─── Print CSS ──────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #assistants-print-area, #assistants-print-area * { visibility: visible !important; }
  #assistants-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

export default function AssistantsIndex({ auth, assistants, filters }: any) {
  const { t, isRtl: isRTL } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState(filters.search || "");

  // Modals State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewIdCardFront, setPreviewIdCardFront] = useState<string | null>(null);
  const [previewIdCardBack, setPreviewIdCardBack] = useState<string | null>(null);

  const { data, setData, post, processing, errors, reset, clearErrors } =
    useForm({
      _method: "put" as "put",
      first_name_ar: "", second_name_ar: "", third_name_ar: "", last_name_ar: "",
      first_name_en: "", second_name_en: "", third_name_en: "", last_name_en: "",
      national_id: "", email: "", phone: "",
      emergency_contact_name: "", emergency_contact_phone: "",
      status: "active",
      address: "",
      image: null as File | null,
      id_card_front_image: null as File | null,
      id_card_back_image: null as File | null,
    });

  const handleSearch = (e: any) => {
    e.preventDefault();
    router.get(route('school.assistants.index'), { search }, { preserveState: true });
  };

  const openEditModal = (assistant: any) => {
    setCurrentId(assistant.id);
    setPreviewImage(assistant.image ? `/storage/${assistant.image}` : null);
    setPreviewIdCardFront(assistant.id_card_front_image ? `/storage/${assistant.id_card_front_image}` : null);
    setPreviewIdCardBack(assistant.id_card_back_image ? `/storage/${assistant.id_card_back_image}` : null);
    setData({
      _method: "put",
      first_name_ar: assistant.first_name_ar || "", second_name_ar: assistant.second_name_ar || "",
      third_name_ar: assistant.third_name_ar || "", last_name_ar: assistant.last_name_ar || "",
      first_name_en: assistant.first_name_en || "", second_name_en: assistant.second_name_en || "",
      third_name_en: assistant.third_name_en || "", last_name_en: assistant.last_name_en || "",
      national_id: assistant.national_id || "", email: assistant.email || "", phone: assistant.phone || "",
      emergency_contact_name: assistant.emergency_contact_name || "",
      emergency_contact_phone: assistant.emergency_contact_phone || "",
      status: assistant.status || "active",
      address: assistant.address || "",
      image: null, id_card_front_image: null, id_card_back_image: null,
    });
    clearErrors(); setCurrentStep(1); setIsModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null); setPreviewIdCardFront(null); setPreviewIdCardBack(null);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("school.assistants.update", currentId!), {
      forceFormData: true,
      onSuccess: () => closeModal(),
    });
  };

  return (
    <SchoolAuthenticatedLayout user={auth.user} header={<h2 className={DS_pageTitle}>{isRTL ? "مشرفات الحافلات" : "Bus Supervisors"}</h2>}>
      <Head title={isRTL ? "مشرفات الحافلات" : "Bus Supervisors"} />
      <style>{PRINT_STYLES}</style>

      <div className={DS_pageWrapper}>
        <div className={DS_card}>
          {/* Toolbar */}
          <div className={DS_sectionHeader(isRTL)}>
            <div className="flex-1 min-w-[200px]">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder={isRTL ? "البحث بالاسم، الهوية، أو الجوال..." : "Search by name, ID, or phone..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={DS_searchInput}
                />
                <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              </form>
            </div>
            
            <button 
              onClick={handlePrint}
              className={DS_btnSecondary}
            >
                <Printer className="w-4 h-4" />
                {isRTL ? "طباعة القائمة" : "Print List"}
            </button>
          </div>

          {/* Table */}
          <div className={DS_tableWrapper}>
            <table className={DS_tableBase}>
              <thead className={DS_tableHead}>
                <tr>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "المشرفة" : "Supervisor"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "الرقم المدني" : "Civil ID"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "رقم الجوال" : "Phone"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "التواصل وقت الطوارئ" : "Emergency Contact"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "الحافلة" : "Assigned Bus"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "الحالة" : "Status"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {assistants.map((assistant: any) => (
                  <tr key={assistant.id} className={DS_tableRow}>
                    <td className={DS_tableTd}>
                      <div className="flex items-center gap-3">
                        <img src={assistant.image ? `/storage/${assistant.image}` : "/images/default-avatar.png"} alt="" className={DS_avatar} />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{isRTL ? assistant.name : (assistant.name_en || assistant.name)}</p>
                          <p className="text-xs text-gray-500">{assistant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${DS_tableTd} font-mono text-sm`}>{assistant.national_id || "—"}</td>
                    <td className={`${DS_tableTd} font-mono text-sm`}>{assistant.phone || "—"}</td>
                    <td className={DS_tableTd}>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700 dark:text-gray-300">{assistant.emergency_contact_name || "—"}</span>
                        {assistant.emergency_contact_phone && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                            <PhoneCall className="w-3 h-3" /> {assistant.emergency_contact_phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={DS_tableTd}>
                      {assistant.bus_number ? (
                        <span className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-bold text-xs rounded-full border border-yellow-100 dark:border-yellow-800">
                          {assistant.bus_number}
                        </span>
                      ) : (<span className="text-gray-400">—</span>)}
                    </td>
                    <td className={DS_tableTd}>
                      {assistant.status === 'active' ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs"><CheckCircle className="w-4 h-4" /> {isRTL ? "نشط" : "Active"}</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-500 font-bold text-xs"><XCircle className="w-4 h-4" /> {isRTL ? "غير نشط" : "Inactive"}</span>
                      )}
                    </td>
                    <td className={DS_tableTd}>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedAssistant(assistant); setShowDetailsModal(true); }} className={DS_btnEdit}><Eye size={16} /></button>
                        <button onClick={() => openEditModal(assistant)} className={DS_btnEdit}><Edit2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {assistants.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-bold">{isRTL ? "لا يوجد مشرفات حافلات مطابقات للبحث." : "No bus supervisors found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- View Details Modal --- */}
        <AnimatePresence>
            {showDetailsModal && selectedAssistant && (
                <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="3xl">
                    <div className={DS_modalContainer}>
                        <div className={DS_modalHeader(isRTL)}>
                            <div className="flex items-center gap-3">
                                <div className={DS_modalHeaderAccent} />
                                <h3 className={DS_modalHeaderTitle}>{isRTL ? "ملف المشرفة" : "Supervisor Dossier"}</h3>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className={DS_modalClose}><X size={18} /></button>
                        </div>
                        <div className={DS_modalBody}>
                            <div className="flex flex-col sm:flex-row gap-8">
                                <div className="flex-shrink-0 flex flex-col items-center">
                                    <div className="w-28 h-28 rounded-2xl overflow-hidden bg-[#0f2044]/5 border-2 border-gray-100 dark:border-[#243460] shadow-lg">
                                        {selectedAssistant.image ? <img src={`/storage/${selectedAssistant.image}`} className="w-full h-full object-cover" /> : <User className="m-auto mt-8 text-gray-300" size={40} />}
                                    </div>
                                    <h4 className="mt-4 text-sm font-black text-[#0f2044] dark:text-white text-center">{selectedAssistant.name}</h4>
                                    {selectedAssistant.name_en && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedAssistant.name_en}</p>}
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                    <div className="space-y-4">
                                        <InfoRow icon={<CreditCard size={14} />} label={isRTL ? "الرقم المدني" : "Civil ID"} value={selectedAssistant.national_id || "—"} isDark={isDark} />
                                        <InfoRow icon={<Mail size={14} />} label={isRTL ? "البريد" : "Email"} value={selectedAssistant.email || "—"} isDark={isDark} />
                                        <InfoRow icon={<Phone size={14} />} label={isRTL ? "الجوال" : "Phone"} value={selectedAssistant.phone || "—"} isDark={isDark} />
                                        <InfoRow icon={<MapPin size={14} />} label={isRTL ? "العنوان" : "Address"} value={selectedAssistant.address || "—"} isDark={isDark} />
                                    </div>
                                    <div className="space-y-4">
                                        <InfoRow icon={<Phone size={14} />} label={isRTL ? "جهة طوارئ" : "Emergency Contact"} value={selectedAssistant.emergency_contact_name || "—"} isDark={isDark} />
                                        <InfoRow icon={<Phone size={14} />} label={isRTL ? "هاتف الطوارئ" : "Emergency Phone"} value={selectedAssistant.emergency_contact_phone || "—"} isDark={isDark} highlight={true} />
                                    </div>
                                </div>
                            </div>
                            {/* Media Assets */}
                            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-[#243460]">
                                <h3 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] mb-6">{isRTL ? "المستندات والصور" : "Documentary Evidence"}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <MediaCard label={isRTL ? "الهوية (أمام)" : "ID Card Front"} src={selectedAssistant.id_card_front_image || selectedAssistant.assistant?.id_card_front_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الهوية (خلف)" : "ID Card Back"} src={selectedAssistant.id_card_back_image || selectedAssistant.assistant?.id_card_back_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الصورة الشخصية" : "Profile Photo"} src={selectedAssistant.image} isDark={isDark} isRTL={isRTL} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </AnimatePresence>

        {/* --- Edit Modal --- */}
        <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
            <div className={DS_modalContainer}>
                <div className={DS_modalHeader(isRTL)}>
                    <div className="flex items-center gap-3">
                        <div className={DS_modalHeaderAccent} />
                        <h3 className={DS_modalHeaderTitle}>{isRTL ? "تحديث بيانات المشرفة" : "Update Supervisor Info"}</h3>
                    </div>
                    <button onClick={closeModal} className={DS_modalClose}><ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} /></button>
                </div>

                {/* Stepper */}
                <div className="bg-[#0f2044]/5 dark:bg-[#0f2044]/30 px-10 py-6 border-b border-gray-100 dark:border-[#243460]">
                    <div className="relative flex items-center justify-between">
                        <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-[#243460]" />
                        <div className="absolute left-10 top-1/2 -translate-y-1/2 h-0.5 bg-[#f5b800] transition-all duration-500" style={{ width: currentStep === 1 ? '0%' : '100%' }} />
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg transition-all ${currentStep >= 1 ? 'bg-[#f5b800] text-[#0f2044]' : 'bg-white dark:bg-[#1a2845] text-gray-400'}`}>1</div>
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg transition-all ${currentStep >= 2 ? 'bg-[#f5b800] text-[#0f2044]' : 'bg-white dark:bg-[#1a2845] text-gray-400'}`}>2</div>
                    </div>
                    <div className="flex justify-between mt-3 px-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#0f2044] dark:text-[#f5b800]">{isRTL ? "الهوية الشخصية" : "Personal Identity"}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${currentStep === 2 ? 'text-[#0f2044] dark:text-[#f5b800]' : 'text-gray-400'}`}>{isRTL ? "بيانات العمل والطوارئ" : "Contact & Emergency"}</span>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div className={DS_modalBody}>
                        {currentStep === 1 && (
                            <motion.div initial={{ opacity: 0, x: isRTL ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                {/* Arabic Names */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-[#243460] pb-2">{isRTL ? "الاسم بناءً على الهوية (عربي)" : "Official Name (Arabic)"}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "الاسم الأول" : "First Name"}</label><input type="text" value={data.first_name_ar} onChange={(e) => setData("first_name_ar", e.target.value)} className={DS_input} required /><InputError message={errors.first_name_ar} /></div>
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "اسم الأب" : "Father Name"}</label><input type="text" value={data.second_name_ar} onChange={(e) => setData("second_name_ar", e.target.value)} className={DS_input} /></div>
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "اسم الجد" : "Grandfather"}</label><input type="text" value={data.third_name_ar} onChange={(e) => setData("third_name_ar", e.target.value)} className={DS_input} /></div>
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "الاسم الأخير" : "Last Name"}</label><input type="text" value={data.last_name_ar} onChange={(e) => setData("last_name_ar", e.target.value)} className={DS_input} required /><InputError message={errors.last_name_ar} /></div>
                                    </div>
                                </div>
                                {/* English Names */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-[#243460] pb-2">{isRTL ? "الاسم بناءً على الهوية (إنجليزي)" : "Official Name (English)"}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "الاسم الأول" : "First Name"}</label><input type="text" value={data.first_name_en} onChange={(e) => setData("first_name_en", e.target.value)} className={DS_input} dir="ltr" /></div>
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "اسم الأب" : "Father Name"}</label><input type="text" value={data.second_name_en} onChange={(e) => setData("second_name_en", e.target.value)} className={DS_input} dir="ltr" /></div>
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "اسم الجد" : "Grandfather"}</label><input type="text" value={data.third_name_en} onChange={(e) => setData("third_name_en", e.target.value)} className={DS_input} dir="ltr" /></div>
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "الاسم الأخير" : "Last Name"}</label><input type="text" value={data.last_name_en} onChange={(e) => setData("last_name_en", e.target.value)} className={DS_input} dir="ltr" /></div>
                                    </div>
                                </div>
                                {/* Profile photo */}
                                <div className="space-y-2">
                                    <label className={DS_label}>{isRTL ? "الصورة الشخصية" : "Profile Photo"}</label>
                                    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460]">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                                            {data.image ? <img src={URL.createObjectURL(data.image)} className="w-full h-full object-cover" /> : previewImage ? <img src={previewImage} className="w-full h-full object-cover" /> : <User size={18} className="text-gray-300 m-auto mt-3" />}
                                        </div>
                                        <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">{isRTL ? "اختيار ملف" : "Choose File"}<input type="file" className="hidden" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} /></label>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div initial={{ opacity: 0, x: isRTL ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "رقم الهوية" : "National ID"}</label><input type="text" value={data.national_id} onChange={(e) => setData("national_id", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required /><InputError message={errors.national_id} /></div>
                                    <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "رقم الجوال" : "Phone"}</label><input type="text" value={data.phone} onChange={(e) => setData("phone", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required /><InputError message={errors.phone} /></div>
                                    <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "البريد الإلكتروني" : "Email"}</label><input type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} className={DS_input} required /><InputError message={errors.email} /></div>
                                    <div className="space-y-1.5">
                                        <label className={DS_label}>{isRTL ? "الحالة" : "Status"}</label>
                                        <select value={data.status} onChange={(e) => setData("status", e.target.value)} className={DS_input}>
                                            <option value="active">{isRTL ? "نشط" : "Active"}</option>
                                            <option value="inactive">{isRTL ? "غير نشط" : "Inactive"}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className={DS_label}>{isRTL ? "العنوان" : "Registered Address"}</label>
                                    <input type="text" value={data.address} onChange={(e) => setData("address", e.target.value)} className={DS_input} />
                                </div>

                                {/* Emergency Contacts */}
                                <div className="p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-4">
                                    <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{isRTL ? "جهات اتصال الطوارئ" : "Emergency Contact Protocol"}</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "اسم جهة الطوارئ" : "Contact Name"}</label><input type="text" value={data.emergency_contact_name} onChange={(e) => setData("emergency_contact_name", e.target.value)} className={DS_input} required /></div>
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "رقم هاتف الطوارئ" : "Emergency Phone"}</label><input type="text" value={data.emergency_contact_phone} onChange={(e) => setData("emergency_contact_phone", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required /></div>
                                    </div>
                                </div>

                                {/* ID Card images */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={DS_label}>{isRTL ? "الهوية (أمام)" : "ID Card Front"}</label>
                                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460]">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                                                {data.id_card_front_image ? <img src={URL.createObjectURL(data.id_card_front_image)} className="w-full h-full object-cover" /> : previewIdCardFront ? <img src={previewIdCardFront} className="w-full h-full object-cover" /> : <CreditCard size={18} className="text-gray-300 m-auto mt-3" />}
                                            </div>
                                            <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">{isRTL ? "اختيار ملف" : "Choose File"}<input type="file" className="hidden" accept="image/*" onChange={(e) => setData("id_card_front_image", e.target.files?.[0] || null)} /></label>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={DS_label}>{isRTL ? "الهوية (خلف)" : "ID Card Back"}</label>
                                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460]">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                                                {data.id_card_back_image ? <img src={URL.createObjectURL(data.id_card_back_image)} className="w-full h-full object-cover" /> : previewIdCardBack ? <img src={previewIdCardBack} className="w-full h-full object-cover" /> : <CreditCard size={18} className="text-gray-300 m-auto mt-3" />}
                                            </div>
                                            <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">{isRTL ? "اختيار ملف" : "Choose File"}<input type="file" className="hidden" accept="image/*" onChange={(e) => setData("id_card_back_image", e.target.files?.[0] || null)} /></label>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className={DS_modalFooter(isRTL)}>
                        {currentStep === 2 && (
                            <button type="button" onClick={() => setCurrentStep(1)} className={DS_btnSecondary}>{isRTL ? "رجوع" : "Back"}</button>
                        )}
                        <div className="ml-auto flex items-center gap-3">
                            <button type="button" onClick={closeModal} className="text-xs font-bold text-gray-400 hover:text-[#0f2044] transition-colors">{isRTL ? "إلغاء" : "Cancel"}</button>
                            {currentStep === 1 ? (
                                <button type="button" onClick={() => setCurrentStep(2)} className={DS_btnPrimary}>{isRTL ? "متابعة" : "Continue"} <ChevronRight size={16} /></button>
                            ) : (
                                <button type="submit" disabled={processing} className={DS_btnGold}>{isRTL ? "حفظ التعديلات" : "Save Changes"}</button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
      </div>

    {/* --- Print Area --- */}
    <div id="assistants-print-area" className="hidden print:block">
        <PrintReportHeader 
          title={isRTL ? "تقرير مشرفات الحافلات المعينات" : "Assigned Bus Supervisors Report"}
          schoolName={auth.user.school?.name || ""}
          schoolLogo={auth.user.school?.logo ? `/storage/${auth.user.school.logo}` : null}
        />
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-right">{isRTL ? "المشرفة" : "Supervisor"}</th>
              <th className="border p-2 text-right">{isRTL ? "الرقم المدني" : "Civil ID"}</th>
              <th className="border p-2 text-right">{isRTL ? "رقم الجوال" : "Phone"}</th>
              <th className="border p-2 text-right">{isRTL ? "جهة طوارئ" : "Emergency Contact"}</th>
              <th className="border p-2 text-right">{isRTL ? "الحافلة" : "Assigned Bus"}</th>
              <th className="border p-2 text-right">{isRTL ? "الحالة" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {assistants.map((assistant: any) => (
              <tr key={assistant.id}>
                <td className="border p-1.5">
                  <div className="font-bold text-gray-900">{isRTL ? assistant.name : (assistant.name_en || assistant.name)}</div>
                  <div className="text-[9px] text-gray-500">{assistant.email}</div>
                </td>
                <td className="border p-1.5 font-mono text-gray-700">{assistant.national_id}</td>
                <td className="border p-1.5 font-mono text-gray-700">{assistant.phone}</td>
                <td className="border p-1.5 text-gray-700">
                  <div className="text-xs">{assistant.emergency_contact_name}</div>
                  <div className="text-[9px] font-mono">{assistant.emergency_contact_phone}</div>
                </td>
                <td className="border p-1.5 text-center text-gray-700">{assistant.bus_number || "—"}</td>
                <td className="border p-1.5 text-center text-gray-700">{assistant.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{isRTL ? "إجمالي المشرفات" : "Total Supervisors"}: {assistants.length}</p>
            <p>{isRTL ? "التوقيع الرسمي" : "Official Signature"}: ............................</p>
        </div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}

// ─── Sub-Components ───────────────────────────────────────
function InfoRow({ icon, label, value, isDark, highlight = false }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg ${highlight ? "bg-rose-500/10 text-rose-500" : isDark ? "bg-gray-800 text-gray-500" : "bg-[#0f2044]/5 text-[#0f2044]"}`}>{icon}</div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className={`text-xs font-black ${highlight ? "text-rose-500" : isDark ? "text-gray-200" : "text-[#0f2044]"} font-mono`}>{value}</span>
    </div>
  );
}

function MediaCard({ label, src, isDark, isRTL }: any) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <div className={`aspect-video rounded-2xl overflow-hidden border-2 ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"} group relative`}>
        {src ? (
          <a href={`/storage/${src}`} target="_blank" rel="noreferrer" className="w-full h-full block">
            <img src={`/storage/${src}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-[#0f2044]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Eye className="text-white" size={24} /></div>
          </a>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-300 uppercase italic">{isRTL ? "لا يوجد بيانات" : "No Data"}</div>
        )}
      </div>
    </div>
  );
}
