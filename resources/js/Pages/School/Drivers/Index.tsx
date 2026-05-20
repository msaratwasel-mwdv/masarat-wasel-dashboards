import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import { useTheme } from "@/Contexts/ThemeContext";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, User, FileText, CheckCircle, XCircle, Eye, Edit2, CreditCard,
  Phone, Mail, MapPin, Calendar, X, ArrowLeft, ChevronRight, Printer,
  MoreVertical, Trash2, Briefcase, Upload, Loader2
} from "lucide-react";
import {
  DS_pageWrapper, DS_pageTitle, DS_card, DS_tableWrapper, DS_tableBase,
  DS_tableHead, DS_tableTh, DS_tableRow, DS_tableTd, DS_searchInput, DS_avatar,
  DS_modalContainer, DS_modalHeader, DS_modalHeaderTitle, DS_modalHeaderAccent,
  DS_modalClose, DS_modalBody, DS_modalFooter, DS_input, DS_select, DS_label,
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
  #drivers-print-area, #drivers-print-area * { visibility: visible !important; }
  #drivers-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

export const getDriverName = (driver: any, isRTL: boolean) => {
  if (!driver) return "";
  if (isRTL) {
    return driver.name || driver.name_en || driver.email;
  } else {
    return driver.name_en || driver.name || driver.email;
  }
};

export default function DriversIndex({ auth, drivers, filters }: any) {
  const { t, isRtl: isRTL } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState(filters.search || "");

  // Modals State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<any>(null);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewLicenseFront, setPreviewLicenseFront] = useState<string | null>(null);
  const [previewLicenseBack, setPreviewLicenseBack] = useState<string | null>(null);
  const [previewIdCardFront, setPreviewIdCardFront] = useState<string | null>(null);
  const [previewIdCardBack, setPreviewIdCardBack] = useState<string | null>(null);

  const { data, setData, post, processing, errors, reset, clearErrors } =
    useForm({
      _method: "put" as "put",
      first_name_ar: "", last_name_ar: "",
      first_name_en: "", last_name_en: "",
      national_id: "", email: "", phone: "",
      license_number: "", license_expiry_date: "",
      address: "",
      image: null as File | null,
      license_front_image: null as File | null,
      license_back_image: null as File | null,
      id_card_front_image: null as File | null,
      id_card_back_image: null as File | null,
      remove_image: false,
      remove_license_front_image: false,
      remove_license_back_image: false,
      remove_id_card_front_image: false,
      remove_id_card_back_image: false,
    });

  const IS_EXPIRED = (date: string | undefined | null) => date && new Date(date) < new Date();

  const handleSearch = (e: any) => {
    e.preventDefault();
    router.get(route('school.drivers.index'), { search }, { preserveState: true });
  };

  const openEditModal = (driver: any) => {
    setCurrentId(driver.id);
    setPreviewImage(driver.image ? `/storage/${driver.image}` : null);
    setPreviewLicenseFront(driver.license_front_image ? `/storage/${driver.license_front_image}` : null);
    setPreviewLicenseBack(driver.license_back_image ? `/storage/${driver.license_back_image}` : null);
    setPreviewIdCardFront(driver.id_card_front_image ? `/storage/${driver.id_card_front_image}` : null);
    setPreviewIdCardBack(driver.id_card_back_image ? `/storage/${driver.id_card_back_image}` : null);
    setData({
      _method: "put",
      first_name_ar: driver.first_name_ar || "", last_name_ar: driver.last_name_ar || "",
      first_name_en: driver.first_name_en || "", last_name_en: driver.last_name_en || "",
      national_id: driver.national_id || "", email: driver.email || "", phone: driver.phone || "",
      license_number: driver.license_number || driver.driver?.license_number || "",
      license_expiry_date: driver.license_expiry_date || driver.driver?.license_expiry_date || "",
      address: driver.address || "",
      image: null, license_front_image: null, license_back_image: null,
      id_card_front_image: null, id_card_back_image: null,
      remove_image: false,
      remove_license_front_image: false,
      remove_license_back_image: false,
      remove_id_card_front_image: false,
      remove_id_card_back_image: false,
    });
    clearErrors(); setCurrentStep(1); setIsModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null); setPreviewLicenseFront(null); setPreviewLicenseBack(null);
    setPreviewIdCardFront(null); setPreviewIdCardBack(null);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("school.drivers.update", currentId!), {
      forceFormData: true,
      onSuccess: () => closeModal(),
    });
  };

  const handleDelete = () => {
    if (!driverToDelete) return;
    router.delete(route("school.drivers.destroy", driverToDelete.id), {
      preserveScroll: true,
      onSuccess: () => setShowDeleteModal(false),
    });
  };

  return (
    <SchoolAuthenticatedLayout user={auth.user} header={<h2 className={DS_pageTitle}>{isRTL ? "سائقو الحافلات" : "Bus Drivers"}</h2>}>
      <Head title={isRTL ? "السائقون" : "Drivers"} />
      <style>{PRINT_STYLES}</style>

      <div className={DS_pageWrapper}>
        <div className={DS_card}>
          {/* Toolbar */}
          <div className={DS_sectionHeader(isRTL)}>
            <div className="w-full md:flex-1 md:max-w-md">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  placeholder={isRTL ? "البحث بالاسم، الهوية، أو الجوال..." : "Search by name, ID, or phone..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${DS_searchInput} ${isRTL ? 'pr-10' : 'pl-10'} w-full`}
                />
                <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              </form>
            </div>
            
            <button 
              onClick={handlePrint}
              className="w-full md:w-auto justify-center px-5 py-2.5 bg-[#0f2044] hover:bg-[#1a2845] text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition-all"
            >
                <Printer className="w-4 h-4 text-[#f5b800]" />
                {isRTL ? "طباعة القائمة" : "Print List"}
            </button>
          </div>

          {/* Table */}
          <div className={`${DS_tableWrapper} !mx-0 px-2 sm:px-4`}>
            <table className={DS_tableBase}>
              <thead className={DS_tableHead}>
                <tr>
                  <th className={`${DS_tableTh(isRTL)} px-2 sm:px-4`}>{isRTL ? "السائق" : "Driver"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "الرقم المدني" : "Civil ID"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "رقم الجوال" : "Phone"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "رقم الرخصة" : "License No."}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "الحافلة" : "Assigned Bus"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "الحالة" : "Status"}</th>
                  <th className={`${DS_tableTh(isRTL)} px-2 sm:px-4`}>{isRTL ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver: any) => (
                  <tr key={driver.id} className={DS_tableRow}>
                    <td className={`${DS_tableTd} px-2 sm:px-4`}>
                      <div className="flex items-center gap-3">
                        <img src={driver.image ? `/storage/${driver.image}` : "/images/default-avatar.png"} alt="" className={DS_avatar} />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {getDriverName(driver, isRTL)}
                          </p>
                          {isRTL ? (
                            driver.name_en && driver.name_en !== driver.name && (
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{driver.name_en}</p>
                            )
                          ) : (
                            driver.name && driver.name !== driver.name_en && (
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{driver.name}</p>
                            )
                          )}
                          <p className="text-xs text-gray-500">{driver.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${DS_tableTd} font-mono text-sm`}>{driver.national_id || "—"}</td>
                    <td className={`${DS_tableTd} font-mono text-sm`}>{driver.phone || "—"}</td>
                    <td className={DS_tableTd}>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700 dark:text-gray-300">{driver.license_number || "—"}</span>
                        {driver.license_expiry_date && (
                          <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {driver.license_expiry_date}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={DS_tableTd}>
                      {driver.bus_number ? (
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-full border border-blue-100 dark:border-blue-800">
                          {driver.bus_number}
                        </span>
                      ) : (<span className="text-gray-400">—</span>)}
                    </td>
                    <td className={DS_tableTd}>
                      {driver.status === 'active' ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs"><CheckCircle className="w-4 h-4" /> {isRTL ? "نشط" : "Active"}</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-500 font-bold text-xs"><XCircle className="w-4 h-4" /> {isRTL ? "غير نشط" : "Inactive"}</span>
                      )}
                    </td>
                    <td className={`${DS_tableTd} px-2 sm:px-4`}>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedDriver(driver); setShowDetailsModal(true); }} className={DS_btnEdit}><Eye size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {drivers.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-bold">{isRTL ? "لا يوجد سائقين مطابقين للبحث." : "No drivers found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- View Details Modal --- */}
        <AnimatePresence>
            {showDetailsModal && selectedDriver && (
                <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="3xl">
                    <div className={DS_modalHeader(isRTL)}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-[12px] overflow-hidden flex items-center justify-center border border-white/10">
                                {selectedDriver?.image ? (
                                    <img src={`/storage/${selectedDriver.image}`} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-white" />
                                )}
                            </div>
                            <div className={isRTL ? "text-right" : "text-left"}>
                                <h3 className="text-xl font-bold text-white">
                                    {!isRTL && selectedDriver?.name_en ? selectedDriver?.name_en : selectedDriver?.name}
                                </h3>
                                <p className="text-[#7ba7e8] text-sm font-semibold">{selectedDriver?.national_id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowDetailsModal(false)} className={DS_modalClose}><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto max-h-[85vh] bg-gray-50/50 dark:bg-[#0b1428]">
                        
                        {/* Profile Sidebar */}
                        <div className="w-full lg:w-1/3 flex-shrink-0">
                            <div className="sticky top-0 bg-white dark:bg-[#152342] border border-gray-100 dark:border-[#243460] rounded-[24px] p-6 shadow-sm flex flex-col items-center text-center">
                                <div className="relative w-32 h-32 mb-5">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-[22px] blur-lg opacity-20 dark:opacity-40"></div>
                                    <div className="relative w-full h-full rounded-[22px] border-4 border-white dark:border-[#152342] overflow-hidden shadow-xl bg-gray-100 dark:bg-gray-800">
                                        <img src={selectedDriver.image ? `/storage/${selectedDriver.image}` : "/images/default-avatar.png"} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2">
                                        <span className={DS_badge(selectedDriver?.status === 'active')}>{selectedDriver?.status === 'active' ? (isRTL ? "نشط" : "Active") : (isRTL ? "غير نشط" : "Inactive")}</span>
                                    </div>
                                </div>
                                <h4 className="text-2xl font-black text-[#0f2044] dark:text-white mb-1">
                                    {getDriverName(selectedDriver, isRTL)}
                                </h4>
                                {selectedDriver && (isRTL ? selectedDriver.name_en : selectedDriver.name) && (isRTL ? selectedDriver.name_en : selectedDriver.name) !== getDriverName(selectedDriver, isRTL) && (
                                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                                        {isRTL ? selectedDriver.name_en : selectedDriver.name}
                                    </p>
                                )}
                                
                                {/* Quick Contact Info */}
                                <div className="w-full space-y-3 mt-4 pt-6 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/30 group">
                                        <Phone className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                                        <span className="font-mono text-sm font-bold truncate text-gray-700 dark:text-gray-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors" dir="ltr">{selectedDriver?.phone || "—"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl transition-colors hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30 group">
                                        <Mail className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-bold truncate text-gray-600 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{selectedDriver?.email || "—"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="w-full lg:w-2/3 space-y-6">
                            
                            {/* Grid Info */}
                            <div className="bg-white dark:bg-[#152342] border border-gray-100 dark:border-[#243460] rounded-[24px] p-6 shadow-sm">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
                                    <User className="text-[#f5b800]" size={16} />
                                    {isRTL ? "المعلومات الأساسية" : "Basic Information"}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-all hover:border-blue-200 dark:hover:border-blue-800">
                                        <div className="w-12 h-12 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600"><CreditCard className="w-6 h-6" /></div>
                                        <div><p className={DS_labelCls}>{isRTL ? "الرقم المدني" : "Civil ID"}</p><p className="font-bold text-[#0f2044] dark:text-white font-mono">{selectedDriver?.national_id || "—"}</p></div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-all hover:border-purple-200 dark:hover:border-purple-800">
                                        <div className="w-12 h-12 rounded-[14px] bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600"><MapPin className="w-6 h-6" /></div>
                                        <div><p className={DS_labelCls}>{isRTL ? "العنوان" : "Address"}</p><p className="font-bold text-[#0f2044] dark:text-white truncate">{selectedDriver?.address || "—"}</p></div>
                                    </div>
                                </div>
                            </div>

                            {/* Driving Credentials */}
                            <div className="bg-white dark:bg-[#152342] border border-gray-100 dark:border-[#243460] rounded-[24px] p-6 shadow-sm">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
                                    <Briefcase className="text-[#f5b800]" size={16} />
                                    {isRTL ? "بيانات الرخصة" : "Driving Credentials"}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-all hover:border-cyan-200 dark:hover:border-cyan-800">
                                        <div className="w-12 h-12 rounded-[14px] bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-600"><FileText className="w-6 h-6" /></div>
                                        <div><p className={DS_labelCls}>{isRTL ? "رقم الرخصة" : "License Serial"}</p><p className="font-bold text-[#0f2044] dark:text-white font-mono">{selectedDriver?.license_number || selectedDriver?.driver?.license_number || "—"}</p></div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-all hover:border-rose-200 dark:hover:border-rose-800">
                                        <div className="w-12 h-12 rounded-[14px] bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600"><Calendar className="w-6 h-6" /></div>
                                        <div><p className={DS_labelCls}>{isRTL ? "تاريخ الانتهاء" : "Expiry Date"}</p><p className={`font-bold font-mono ${IS_EXPIRED(selectedDriver?.license_expiry_date || selectedDriver?.driver?.license_expiry_date) ? "text-red-500" : "text-[#0f2044] dark:text-white"}`}>{selectedDriver?.license_expiry_date || selectedDriver?.driver?.license_expiry_date || "—"}</p></div>
                                    </div>
                                </div>
                            </div>

                            {/* Media Assets */}
                            <div className="bg-white dark:bg-[#152342] border border-gray-100 dark:border-[#243460] rounded-[24px] p-6 shadow-sm">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
                                    <FileText className="text-[#f5b800]" size={16} />
                                    {isRTL ? "المستندات والصور المرفقة" : "Documentary Evidence"}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <MediaCard label={isRTL ? "الرخصة (أمام)" : "License Front"} src={selectedDriver.license_front_image || selectedDriver.driver?.license_front_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الرخصة (خلف)" : "License Back"} src={selectedDriver.license_back_image || selectedDriver.driver?.license_back_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الهوية (أمام)" : "ID Card Front"} src={selectedDriver.id_card_front_image || selectedDriver.driver?.id_card_front_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الهوية (خلف)" : "ID Card Back"} src={selectedDriver.id_card_back_image || selectedDriver.driver?.id_card_back_image} isDark={isDark} isRTL={isRTL} />
                                </div>
                            </div>

                        </div>
                    </div>
                </Modal>
            )}
        </AnimatePresence>

        {/* --- Edit Modal --- */}
        <Modal show={isModalOpen} onClose={closeModal} maxWidth="4xl">
            <div className={DS_modalContainer}>
                <div className={DS_modalHeader(isRTL)}>
                    <div className="flex items-center gap-3">
                        <div className={DS_modalHeaderAccent} />
                        <h3 className={DS_modalHeaderTitle}>{isRTL ? "تحديث بيانات السائق" : "Update Driver Info"}</h3>
                    </div>
                    <button onClick={closeModal} className={DS_modalClose}><X size={18} /></button>
                </div>
                <form onSubmit={submit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 max-h-[78vh]">
                        {/* §1 The Names */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#243460] pb-2">
                                <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] flex items-center gap-2">
                                    <User size={14} className="text-[#f5b800]" />
                                    {isRTL ? "الأسماء الرسمية" : "Official Names"}
                                </h4>
                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">
                                    {isRTL ? "* مطلوب عربي أو إنجليزي" : "* Req: Arabic or English"}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Arabic Panel */}
                                <div className="p-3 bg-gray-50/50 dark:bg-[#0f2044]/10 rounded-xl border border-gray-100/80 dark:border-[#243460]/40 space-y-3">
                                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider">{isRTL ? "البيانات بالعربية" : "ARABIC DOSSIER"}</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "الاسم الأول" : "First Name"} {!data.first_name_en && !data.last_name_en && <span className="text-rose-500">*</span>}</label>
                                            <input type="text" value={data.first_name_ar} onChange={e => setData("first_name_ar", e.target.value)} className={DS_input} dir="rtl" required={!data.first_name_en && !data.last_name_en} />
                                            <InputError message={errors.first_name_ar} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "الاسم الأخير" : "Last Name"} {!data.first_name_en && !data.last_name_en && <span className="text-rose-500">*</span>}</label>
                                            <input type="text" value={data.last_name_ar} onChange={e => setData("last_name_ar", e.target.value)} className={DS_input} dir="rtl" required={!data.first_name_en && !data.last_name_en} />
                                            <InputError message={errors.last_name_ar} />
                                        </div>
                                    </div>
                                </div>
                                {/* English Panel */}
                                <div className="p-3 bg-gray-50/50 dark:bg-[#0f2044]/10 rounded-xl border border-gray-100/80 dark:border-[#243460]/40 space-y-3">
                                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider">{isRTL ? "البيانات بالإنجليزية" : "ENGLISH DOSSIER"}</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "الاسم الأول" : "First Name"} {!data.first_name_ar && !data.last_name_ar && <span className="text-rose-500">*</span>}</label>
                                            <input type="text" value={data.first_name_en} onChange={e => setData("first_name_en", e.target.value)} className={DS_input} dir="ltr" required={!data.first_name_ar && !data.last_name_ar} />
                                            <InputError message={errors.first_name_en} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "الاسم الأخير" : "Last Name"} {!data.first_name_ar && !data.last_name_ar && <span className="text-rose-500">*</span>}</label>
                                            <input type="text" value={data.last_name_en} onChange={e => setData("last_name_en", e.target.value)} className={DS_input} dir="ltr" required={!data.first_name_ar && !data.last_name_ar} />
                                            <InputError message={errors.last_name_en} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* §2 Personal Identity */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-2 flex items-center gap-2">
                                <CreditCard size={14} className="text-[#f5b800]" />
                                {isRTL ? "الهوية الشخصية والمرفقات" : "Personal Identity & Documents"}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Col: Inputs & Profile photo */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "الرقم المدني / الإقامة" : "Civil ID / Iqama"} <span className="text-rose-500">*</span></label>
                                            <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required />
                                            <InputError message={errors.national_id} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "رقم الجوال" : "Phone Number"} <span className="text-rose-500">*</span></label>
                                            <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" placeholder="5XXXXXXXX" required />
                                            <InputError message={errors.phone} />
                                        </div>
                                    </div>
                                    {/* Profile photo upload directly next/under */}
                                    <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-[#243460] flex items-center justify-center overflow-hidden bg-white dark:bg-[#0f2044] flex-shrink-0 relative group">
                                            {data.image ? (
                                                <>
                                                    <img src={URL.createObjectURL(data.image)} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => setData("image", null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X size={12} className="text-white" />
                                                    </button>
                                                </>
                                            ) : previewImage ? (
                                                <>
                                                    <img src={previewImage} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => {
                                                        setPreviewImage(null);
                                                        setData("remove_image", true);
                                                    }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X size={12} className="text-white" />
                                                    </button>
                                                </>
                                            ) : (
                                                <User size={16} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-[#0f2044] dark:text-white leading-tight">{isRTL ? "الصورة الشخصية" : "Profile Photo"}</p>
                                            {!data.image && !previewImage ? (
                                                <label className="cursor-pointer text-[9px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline mt-0.5 inline-block">
                                                    {isRTL ? "اختيار صورة" : "Choose Photo"}
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                        const file = e.target.files?.[0] || null;
                                                        setData({ ...data, image: file, remove_image: false });
                                                    }} />
                                                </label>
                                            ) : (
                                                <button type="button" onClick={() => {
                                                    if (data.image) {
                                                        setData("image", null);
                                                    } else {
                                                        setPreviewImage(null);
                                                        setData("remove_image", true);
                                                    }
                                                }} className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase underline mt-0.5 inline-block">
                                                    {isRTL ? "إزالة" : "Remove"}
                                                </button>
                                            )}
                                            <InputError message={errors.image} />
                                        </div>
                                    </div>
                                </div>
                                {/* Right Col: ID Docs grouped next to inputs */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className={DS_label}>{isRTL ? "الهوية (أمام)" : "ID Card Front"}</label>
                                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#0f2044]/20 rounded-xl border border-dashed border-gray-200 dark:border-[#243460] relative group">
                                            <div className="w-8 h-8 rounded overflow-hidden bg-white dark:bg-[#0f2044] border border-gray-200 dark:border-[#243460]/50 flex items-center justify-center flex-shrink-0 relative">
                                                {data.id_card_front_image ? (
                                                    <>
                                                        <img src={URL.createObjectURL(data.id_card_front_image)} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setData("id_card_front_image", null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X size={10} className="text-white" />
                                                        </button>
                                                    </>
                                                ) : previewIdCardFront ? (
                                                    <>
                                                        <img src={previewIdCardFront} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => {
                                                            setPreviewIdCardFront(null);
                                                            setData("remove_id_card_front_image", true);
                                                        }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X size={10} className="text-white" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <CreditCard size={14} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                                                )}
                                            </div>
                                            {!data.id_card_front_image && !previewIdCardFront ? (
                                                <label className="cursor-pointer text-[9px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">
                                                    {isRTL ? "رفع" : "Upload"}
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                        const file = e.target.files?.[0] || null;
                                                        setData({ ...data, id_card_front_image: file, remove_id_card_front_image: false });
                                                    }} />
                                                </label>
                                            ) : (
                                                <button type="button" onClick={() => {
                                                    if (data.id_card_front_image) {
                                                        setData("id_card_front_image", null);
                                                    } else {
                                                        setPreviewIdCardFront(null);
                                                        setData("remove_id_card_front_image", true);
                                                    }
                                                }} className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase underline ml-auto">
                                                    {isRTL ? "إزالة" : "Remove"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={DS_label}>{isRTL ? "الهوية (خلف)" : "ID Card Back"}</label>
                                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#0f2044]/20 rounded-xl border border-dashed border-gray-200 dark:border-[#243460] relative group">
                                            <div className="w-8 h-8 rounded overflow-hidden bg-white dark:bg-[#0f2044] border border-gray-200 dark:border-[#243460]/50 flex items-center justify-center flex-shrink-0 relative">
                                                {data.id_card_back_image ? (
                                                    <>
                                                        <img src={URL.createObjectURL(data.id_card_back_image)} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setData("id_card_back_image", null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X size={10} className="text-white" />
                                                        </button>
                                                    </>
                                                ) : previewIdCardBack ? (
                                                    <>
                                                        <img src={previewIdCardBack} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => {
                                                            setPreviewIdCardBack(null);
                                                            setData("remove_id_card_back_image", true);
                                                        }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X size={10} className="text-white" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <CreditCard size={14} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                                                )}
                                            </div>
                                            {!data.id_card_back_image && !previewIdCardBack ? (
                                                <label className="cursor-pointer text-[9px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">
                                                    {isRTL ? "رفع" : "Upload"}
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                        const file = e.target.files?.[0] || null;
                                                        setData({ ...data, id_card_back_image: file, remove_id_card_back_image: false });
                                                    }} />
                                                </label>
                                            ) : (
                                                <button type="button" onClick={() => {
                                                    if (data.id_card_back_image) {
                                                        setData("id_card_back_image", null);
                                                    } else {
                                                        setPreviewIdCardBack(null);
                                                        setData("remove_id_card_back_image", true);
                                                    }
                                                }} className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase underline ml-auto">
                                                    {isRTL ? "إزالة" : "Remove"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* §3 Driving Credentials */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-2 flex items-center gap-2">
                                <Briefcase size={14} className="text-[#f5b800]" />
                                {isRTL ? "بيانات الرخصة والمرفقات" : "Driving Credentials & Documents"}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Col: License Inputs */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className={DS_label}>{isRTL ? "رقم الرخصة" : "License Number"} <span className="text-rose-500">*</span></label>
                                        <input type="text" value={data.license_number} onChange={e => setData("license_number", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required />
                                        <InputError message={errors.license_number} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={DS_label}>{isRTL ? "انتهاء الرخصة" : "License Expiry"} <span className="text-rose-500">*</span></label>
                                        <input type="date" value={data.license_expiry_date} onChange={e => setData("license_expiry_date", e.target.value)} className={DS_input} dir="ltr" required />
                                        <InputError message={errors.license_expiry_date} />
                                    </div>
                                </div>
                                {/* Right Col: License Copy front/back */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className={DS_label}>{isRTL ? "الرخصة (أمام)" : "License Front"}</label>
                                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#0f2044]/20 rounded-xl border border-dashed border-gray-200 dark:border-[#243460] relative group">
                                            <div className="w-8 h-8 rounded overflow-hidden bg-white dark:bg-[#0f2044] border border-gray-200 dark:border-[#243460]/50 flex items-center justify-center flex-shrink-0 relative">
                                                {data.license_front_image ? (
                                                    <>
                                                        <img src={URL.createObjectURL(data.license_front_image)} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setData("license_front_image", null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X size={10} className="text-white" />
                                                        </button>
                                                    </>
                                                ) : previewLicenseFront ? (
                                                    <>
                                                        <img src={previewLicenseFront} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => {
                                                            setPreviewLicenseFront(null);
                                                            setData("remove_license_front_image", true);
                                                        }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X size={10} className="text-white" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <CreditCard size={14} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                                                )}
                                            </div>
                                            {!data.license_front_image && !previewLicenseFront ? (
                                                <label className="cursor-pointer text-[9px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">
                                                    {isRTL ? "رفع" : "Upload"}
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                        const file = e.target.files?.[0] || null;
                                                        setData({ ...data, license_front_image: file, remove_license_front_image: false });
                                                    }} />
                                                </label>
                                            ) : (
                                                <button type="button" onClick={() => {
                                                    if (data.license_front_image) {
                                                        setData("license_front_image", null);
                                                    } else {
                                                        setPreviewLicenseFront(null);
                                                        setData("remove_license_front_image", true);
                                                    }
                                                }} className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase underline ml-auto">
                                                    {isRTL ? "إزالة" : "Remove"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={DS_label}>{isRTL ? "الرخصة (خلف)" : "License Back"}</label>
                                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#0f2044]/20 rounded-xl border border-dashed border-gray-200 dark:border-[#243460] relative group">
                                            <div className="w-8 h-8 rounded overflow-hidden bg-white dark:bg-[#0f2044] border border-gray-200 dark:border-[#243460]/50 flex items-center justify-center flex-shrink-0 relative">
                                                {data.license_back_image ? (
                                                    <>
                                                        <img src={URL.createObjectURL(data.license_back_image)} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setData("license_back_image", null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X size={10} className="text-white" />
                                                        </button>
                                                    </>
                                                ) : previewLicenseBack ? (
                                                    <>
                                                        <img src={previewLicenseBack} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => {
                                                            setPreviewLicenseBack(null);
                                                            setData("remove_license_back_image", true);
                                                        }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X size={10} className="text-white" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <CreditCard size={14} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                                                )}
                                            </div>
                                            {!data.license_back_image && !previewLicenseBack ? (
                                                <label className="cursor-pointer text-[9px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">
                                                    {isRTL ? "رفع" : "Upload"}
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                        const file = e.target.files?.[0] || null;
                                                        setData({ ...data, license_back_image: file, remove_license_back_image: false });
                                                    }} />
                                                </label>
                                            ) : (
                                                <button type="button" onClick={() => {
                                                    if (data.license_back_image) {
                                                        setData("license_back_image", null);
                                                    } else {
                                                        setPreviewLicenseBack(null);
                                                        setData("remove_license_back_image", true);
                                                    }
                                                }} className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase underline ml-auto">
                                                    {isRTL ? "إزالة" : "Remove"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* §4 Contact & Preferences */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-2 flex items-center gap-2">
                                <Mail size={14} className="text-gray-300" />
                                {isRTL ? "معلومات التواصل والتفضيلات" : "Contact & Preferences"}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className={DS_label}>{isRTL ? "البريد الإلكتروني" : "Email"}</label>
                                    <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} className={DS_input} dir="ltr" />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-1">
                                    <label className={DS_label}>{isRTL ? "اللغة المفضلة" : "Language"}</label>
                                    <select value={data.preferred_language} onChange={e => setData("preferred_language", e.target.value)} className={DS_select}>
                                        <option value="ar">{isRTL ? "العربية" : "Arabic"}</option>
                                        <option value="en">{isRTL ? "الإنجليزية" : "English"}</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className={DS_label}>{isRTL ? "العنوان" : "Address"}</label>
                                    <input type="text" value={data.address} onChange={e => setData("address", e.target.value)} className={DS_input} dir={isRTL ? "rtl" : "ltr"} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={DS_modalFooter(isRTL)}>
                        <div className="ml-auto flex items-center gap-3">
                            <button type="button" onClick={closeModal} className="text-xs font-bold text-gray-400 hover:text-[#0f2044] transition-colors">{isRTL ? "إلغاء" : "Cancel"}</button>
                            <button type="submit" disabled={processing} className={DS_btnGold}>{processing && <Loader2 size={16} className="animate-spin" />}{isRTL ? "حفظ التعديلات" : "Save Changes"}</button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    {/* --- Print Area --- */}
    <div id="drivers-print-area" className="hidden print:block">
        <PrintReportHeader 
          title={isRTL ? "تقرير السائقين المعينين" : "Assigned Drivers Report"}
          schoolName={auth.user.school?.name || ""}
          schoolLogo={auth.user.school?.logo ? `/storage/${auth.user.school.logo}` : null}
        />
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-1.5 text-right font-bold text-black">{isRTL ? "السائق" : "Driver"}</th>
              <th className="border p-1.5 text-right font-bold text-black">{isRTL ? "الرقم المدني" : "Civil ID"}</th>
              <th className="border p-1.5 text-right font-bold text-black">{isRTL ? "رقم الجوال" : "Phone"}</th>
              <th className="border p-1.5 text-right font-bold text-black">{isRTL ? "رقم الرخصة" : "License No."}</th>
              <th className="border p-1.5 text-right font-bold text-black">{isRTL ? "تاريخ الانتهاء" : "Expiry"}</th>
              <th className="border p-1.5 text-right font-bold text-black">{isRTL ? "الحافلة" : "Bus"}</th>
              <th className="border p-1.5 text-right font-bold text-black">{isRTL ? "الحالة" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver: any) => (
              <tr key={driver.id}>
                <td className="border p-1.5">
                  <div className="font-bold text-gray-900">{isRTL ? driver.name : (driver.name_en || driver.name)}</div>
                  <div className="text-[9px] text-gray-500">{driver.email}</div>
                </td>
                <td className="border p-1.5 font-mono text-gray-700">{driver.national_id}</td>
                <td className="border p-1.5 font-mono text-gray-700">{driver.phone}</td>
                <td className="border p-1.5 font-mono text-gray-700">{driver.license_number || "—"}</td>
                <td className="border p-1.5 font-mono text-gray-700 text-xs">{driver.license_expiry_date || "—"}</td>
                <td className="border p-1.5 text-center text-gray-700">{driver.bus_number || "—"}</td>
                <td className="border p-1.5 text-center">
                  <span className="text-[10px] font-bold uppercase transition-all">
                    {driver.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{isRTL ? "إجمالي السائقين" : "Total Drivers"}: {drivers.length}</p>
            <p>{isRTL ? "التوقيع الرسمي" : "Official Signature"}: ............................</p>
        </div>
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
              {isRTL ? "هل أنت متأكد من أنك تريد حذف هذا السائق؟" : "Are you sure you want to delete this driver?"}
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
        <div className={`p-1.5 rounded-lg ${isDark ? "bg-gray-800 text-gray-500" : "bg-[#0f2044]/5 text-[#0f2044]"}`}>{icon}</div>
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
