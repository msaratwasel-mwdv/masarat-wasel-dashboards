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
  Phone, Mail, MapPin, X, ArrowLeft, ChevronRight, Printer, MoreVertical, Trash2, FileText
} from "lucide-react";
import {
  DS_pageWrapper, DS_pageTitle, DS_card, DS_tableWrapper, DS_tableBase,
  DS_tableHead, DS_tableTh, DS_tableRow, DS_tableTd, DS_searchInput, DS_avatar,
  DS_modalContainer, DS_modalHeader, DS_modalHeaderTitle, DS_modalHeaderAccent,
  DS_modalClose, DS_modalBody, DS_modalFooter, DS_input, DS_label,
  DS_btnPrimary, DS_btnGold, DS_btnSecondary, DS_btnEdit, DS_btnDanger,
  DS_sectionHeader, DS_confirmModal, DS_cancelBtn, DS_badge, DS_labelCls
} from "@/lib/DS";
import PrintReportHeader from "@/Components/PrintReportHeader";
import Dropdown from "@/Components/Dropdown";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<any>(null);
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

  const handleDelete = () => {
    if (!assistantToDelete) return;
    router.delete(route("school.assistants.destroy", assistantToDelete.id), {
      preserveScroll: true,
      onSuccess: () => setShowDeleteModal(false),
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
                <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="2xl">
                    <div className={DS_modalHeader(isRTL)}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-[12px] overflow-hidden flex items-center justify-center border border-white/10">
                                {selectedAssistant?.image ? (
                                    <img src={`/storage/${selectedAssistant.image}`} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-white" />
                                )}
                            </div>
                            <div className={isRTL ? "text-right" : "text-left"}>
                                <h3 className="text-xl font-bold text-white">
                                    {!isRTL && selectedAssistant?.name_en ? selectedAssistant?.name_en : selectedAssistant?.name}
                                </h3>
                                <p className="text-[#7ba7e8] text-sm font-semibold">{selectedAssistant?.national_id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align={isRTL ? "left" : "right"} width="32" contentClasses="py-2 bg-white dark:bg-[#1a2845] shadow-2xl rounded-[16px] border border-gray-100 dark:border-[#243460]">
                                    <button onClick={() => { setShowDetailsModal(false); openEditModal(selectedAssistant); }} className="w-full px-4 py-2.5 text-sm font-bold text-[#0f2044] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-start flex items-center gap-2">
                                        <Edit2 className="w-4 h-4 text-blue-500" />
                                        {isRTL ? "تعديل" : "Edit"}
                                    </button>
                                    <button 
                                        onClick={() => { 
                                            setShowDetailsModal(false);
                                            setAssistantToDelete(selectedAssistant); 
                                            setShowDeleteModal(true); 
                                        }} 
                                        className="w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-start flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {isRTL ? "حذف" : "Delete"}
                                    </button>
                                </Dropdown.Content>
                            </Dropdown>
                            <button onClick={() => setShowDetailsModal(false)} className={DS_modalClose}><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
                        {/* Profile Card */}
                        <div className="flex items-center gap-6 p-6 rounded-[22px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="w-24 h-24 rounded-[22px] border-4 border-white dark:border-[#243460] overflow-hidden shadow-lg">
                                <img src={selectedAssistant.image ? `/storage/${selectedAssistant.image}` : "/images/default-avatar.png"} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-[#0f2044] dark:text-white mb-1">
                                    {!isRTL && selectedAssistant?.name_en ? selectedAssistant?.name_en : selectedAssistant?.name}
                                </h4>
                                <div className="flex items-center gap-3">
                                    <span className={DS_badge(selectedAssistant?.status === 'active')}>{selectedAssistant?.status === 'active' ? (isRTL ? "نشط" : "Active") : (isRTL ? "غير نشط" : "Inactive")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Grid Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                <div className="w-12 h-12 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600"><CreditCard className="w-6 h-6" /></div>
                                <div><p className={DS_labelCls}>{isRTL ? "الرقم المدني" : "Civil ID"}</p><p className="font-bold text-[#0f2044] dark:text-white">{selectedAssistant?.national_id || "—"}</p></div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                <div className="w-12 h-12 rounded-[14px] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600"><Phone className="w-6 h-6" /></div>
                                <div><p className={DS_labelCls}>{isRTL ? "الجوال" : "Phone"}</p><p className="font-bold text-[#0f2044] dark:text-white" dir="ltr">{selectedAssistant?.phone || "—"}</p></div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                <div className="w-12 h-12 rounded-[14px] bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600"><Mail className="w-6 h-6" /></div>
                                <div><p className={DS_labelCls}>{isRTL ? "البريد" : "Email"}</p><p className="font-bold text-[#0f2044] dark:text-white truncate">{selectedAssistant?.email || "—"}</p></div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                <div className="w-12 h-12 rounded-[14px] bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600"><MapPin className="w-6 h-6" /></div>
                                <div><p className={DS_labelCls}>{isRTL ? "العنوان" : "Address"}</p><p className="font-bold text-[#0f2044] dark:text-white truncate">{selectedAssistant?.address || "—"}</p></div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-4 p-4 rounded-[18px] bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20">
                                <div className="w-12 h-12 rounded-[14px] bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600"><PhoneCall className="w-6 h-6" /></div>
                                <div><p className="text-[10px] font-bold text-rose-400 mb-1 uppercase tracking-widest">{isRTL ? "جهة طوارئ" : "Emergency Contact"}</p><p className="font-bold text-rose-700 dark:text-rose-400">{selectedAssistant?.emergency_contact_name || "—"}</p></div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-[18px] bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20">
                                <div className="w-12 h-12 rounded-[14px] bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600"><PhoneCall className="w-6 h-6" /></div>
                                <div><p className="text-[10px] font-bold text-rose-400 mb-1 uppercase tracking-widest">{isRTL ? "هاتف الطوارئ" : "Emergency Phone"}</p><p className="font-bold text-rose-700 dark:text-rose-400" dir="ltr">{selectedAssistant?.emergency_contact_phone || "—"}</p></div>
                            </div>
                        </div>

                        {/* Media Assets */}
                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-[#243460]">
                            <h3 className="font-bold text-[#0f2044] dark:text-white flex items-center gap-2 mb-6">
                                <FileText className="w-5 h-5 text-[#f5b800]" /> {isRTL ? "المستندات والصور" : "Documentary Evidence"}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <MediaCard label={isRTL ? "الهوية (أمام)" : "ID Card Front"} src={selectedAssistant.id_card_front_image || selectedAssistant.assistant?.id_card_front_image} isDark={isDark} isRTL={isRTL} />
                                <MediaCard label={isRTL ? "الهوية (خلف)" : "ID Card Back"} src={selectedAssistant.id_card_back_image || selectedAssistant.assistant?.id_card_back_image} isDark={isDark} isRTL={isRTL} />
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

                <form onSubmit={submit}>
                    <div className={`${DS_modalBody} max-h-[75vh] overflow-y-auto space-y-8`}>
                        <div className="space-y-6">
                                {/* Profile photo */}
                                <div className="flex items-center gap-6 p-6 rounded-[22px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="w-24 h-24 rounded-[22px] border-4 border-white dark:border-[#243460] overflow-hidden shadow-lg flex-shrink-0 relative group bg-white">
                                        {data.image ? (
                                            <img src={URL.createObjectURL(data.image)} className="w-full h-full object-cover" />
                                        ) : previewImage ? (
                                            <img src={previewImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={32} className="text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                        )}
                                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{isRTL ? "تغيير" : "Change"}</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-black text-[#0f2044] dark:text-white mb-1">
                                            {isRTL ? "صورة الملف الشخصي" : "Profile Picture"}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed mb-3">
                                            {isRTL ? "يُفضل استخدام صورة بخلفية بيضاء أو رمادية فاتحة." : "A clear photo with a white or light gray background is recommended."}
                                        </p>
                                        <label className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white dark:bg-[#0f2044] border border-gray-200 dark:border-[#243460] text-xs font-bold text-[#0f2044] dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a2845] transition-all shadow-sm">
                                            {isRTL ? "اختيار صورة جديدة" : "Upload New Photo"}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                </div>
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
                            </div>

                            <div className="border-t border-gray-100 dark:border-[#243460] pt-6 space-y-6">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{isRTL ? "البيانات الإضافية والمستندات" : "Contact & Emergency"}</h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "الرقم المدني" : "Civil ID"}</label><input type="text" value={data.national_id} onChange={(e) => setData("national_id", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required /><InputError message={errors.national_id} /></div>
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
                            </div>
                    </div>

                    <div className={`${DS_modalFooter(isRTL)} !justify-between`}>
                        <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-[#0f2044] dark:hover:text-white transition-colors">{isRTL ? "إلغاء" : "Cancel"}</button>
                        <button type="submit" disabled={processing} className={DS_btnGold}>{isRTL ? "حفظ التعديلات" : "Save Changes"}</button>
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={DS_confirmModal}>
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-[#0f2044] dark:text-white mb-2 text-center">
              {isRTL ? "تأكيد الحذف" : "Confirm Deletion"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 text-center">
              {isRTL ? "هل أنت متأكد من أنك تريد حذف هذه المشرفة؟" : "Are you sure you want to delete this supervisor?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`flex-1 py-3 ${DS_cancelBtn}`}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-[14px] bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow"
              >
                {isRTL ? "نعم، احذف" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
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
