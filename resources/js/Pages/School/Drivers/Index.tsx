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
  Phone, Mail, MapPin, Calendar, X, ArrowLeft, ChevronRight, Printer
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
  #drivers-print-area, #drivers-print-area * { visibility: visible !important; }
  #drivers-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

export default function DriversIndex({ auth, drivers, filters }: any) {
  const { t, isRtl: isRTL } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState(filters.search || "");

  // Modals State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      first_name_ar: "", second_name_ar: "", third_name_ar: "", last_name_ar: "",
      first_name_en: "", second_name_en: "", third_name_en: "", last_name_en: "",
      national_id: "", email: "", phone: "",
      license_number: "", license_expiry_date: "",
      address: "",
      image: null as File | null,
      license_front_image: null as File | null,
      license_back_image: null as File | null,
      id_card_front_image: null as File | null,
      id_card_back_image: null as File | null,
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
      first_name_ar: driver.first_name_ar || "", second_name_ar: driver.second_name_ar || "",
      third_name_ar: driver.third_name_ar || "", last_name_ar: driver.last_name_ar || "",
      first_name_en: driver.first_name_en || "", second_name_en: driver.second_name_en || "",
      third_name_en: driver.third_name_en || "", last_name_en: driver.last_name_en || "",
      national_id: driver.national_id || "", email: driver.email || "", phone: driver.phone || "",
      license_number: driver.license_number || driver.driver?.license_number || "",
      license_expiry_date: driver.license_expiry_date || driver.driver?.license_expiry_date || "",
      address: driver.address || "",
      image: null, license_front_image: null, license_back_image: null,
      id_card_front_image: null, id_card_back_image: null,
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

  return (
    <SchoolAuthenticatedLayout user={auth.user} header={<h2 className={DS_pageTitle}>{isRTL ? "سائقو الحافلات" : "Bus Drivers"}</h2>}>
      <Head title={isRTL ? "السائقون" : "Drivers"} />
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
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "السائق" : "Driver"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "الرقم المدني" : "Civil ID"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "رقم الجوال" : "Phone"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "رقم الرخصة" : "License No."}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "الحافلة" : "Assigned Bus"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "الحالة" : "Status"}</th>
                  <th className={DS_tableTh(isRTL)}>{isRTL ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver: any) => (
                  <tr key={driver.id} className={DS_tableRow}>
                    <td className={DS_tableTd}>
                      <div className="flex items-center gap-3">
                        <img src={driver.image ? `/storage/${driver.image}` : "/images/default-avatar.png"} alt="" className={DS_avatar} />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{isRTL ? driver.name : (driver.name_en || driver.name)}</p>
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
                    <td className={DS_tableTd}>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedDriver(driver); setShowDetailsModal(true); }} className={DS_btnEdit}><Eye size={16} /></button>
                        <button onClick={() => openEditModal(driver)} className={DS_btnEdit}><Edit2 size={16} /></button>
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
                    <div className={DS_modalContainer}>
                        <div className={DS_modalHeader(isRTL)}>
                            <div className="flex items-center gap-3">
                                <div className={DS_modalHeaderAccent} />
                                <h3 className={DS_modalHeaderTitle}>{isRTL ? "ملف السائق" : "Driver Dossier"}</h3>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className={DS_modalClose}><X size={18} /></button>
                        </div>
                        <div className={DS_modalBody}>
                            <div className="flex flex-col sm:flex-row gap-8">
                                <div className="flex-shrink-0 flex flex-col items-center">
                                    <div className="w-28 h-28 rounded-2xl overflow-hidden bg-[#0f2044]/5 border-2 border-gray-100 dark:border-[#243460] shadow-lg">
                                        {selectedDriver.image ? <img src={`/storage/${selectedDriver.image}`} className="w-full h-full object-cover" /> : <User className="m-auto mt-8 text-gray-300" size={40} />}
                                    </div>
                                    <h4 className="mt-4 text-sm font-black text-[#0f2044] dark:text-white text-center">{selectedDriver.name}</h4>
                                    {selectedDriver.name_en && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedDriver.name_en}</p>}
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                    <div className="space-y-4">
                                        <InfoRow icon={<CreditCard size={14} />} label={isRTL ? "الرقم المدني" : "Civil ID"} value={selectedDriver.national_id || "—"} isDark={isDark} />
                                        <InfoRow icon={<Mail size={14} />} label={isRTL ? "البريد" : "Email"} value={selectedDriver.email || "—"} isDark={isDark} />
                                        <InfoRow icon={<Phone size={14} />} label={isRTL ? "الجوال" : "Phone"} value={selectedDriver.phone || "—"} isDark={isDark} />
                                        <InfoRow icon={<MapPin size={14} />} label={isRTL ? "العنوان" : "Address"} value={selectedDriver.address || "—"} isDark={isDark} />
                                    </div>
                                    <div className="space-y-4">
                                        <InfoRow icon={<CreditCard size={14} />} label={isRTL ? "رقم الرخصة" : "License Serial"} value={selectedDriver.license_number || selectedDriver.driver?.license_number || "—"} isDark={isDark} />
                                        <InfoRow icon={<Calendar size={14} />} label={isRTL ? "انتهاء الرخصة" : "Expiry"} value={selectedDriver.license_expiry_date || selectedDriver.driver?.license_expiry_date || "—"} isDark={isDark} highlight={IS_EXPIRED(selectedDriver.license_expiry_date || selectedDriver.driver?.license_expiry_date)} />
                                    </div>
                                </div>
                            </div>
                            {/* Media Assets */}
                            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-[#243460]">
                                <h3 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] mb-6">{isRTL ? "المستندات والصور" : "Documentary Evidence"}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <MediaCard label={isRTL ? "الرخصة (أمام)" : "License Front"} src={selectedDriver.license_front_image || selectedDriver.driver?.license_front_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الرخصة (خلف)" : "License Back"} src={selectedDriver.license_back_image || selectedDriver.driver?.license_back_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الهوية (أمام)" : "ID Card Front"} src={selectedDriver.id_card_front_image || selectedDriver.driver?.id_card_front_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الهوية (خلف)" : "ID Card Back"} src={selectedDriver.id_card_back_image || selectedDriver.driver?.id_card_back_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الصورة الشخصية" : "Profile Photo"} src={selectedDriver.image} isDark={isDark} isRTL={isRTL} />
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
                        <h3 className={DS_modalHeaderTitle}>{isRTL ? "تحديث بيانات السائق" : "Update Driver Info"}</h3>
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
                        <span className={`text-[9px] font-black uppercase tracking-widest ${currentStep === 2 ? 'text-[#0f2044] dark:text-[#f5b800]' : 'text-gray-400'}`}>{isRTL ? "الرخصة والمستندات" : "License & Documents"}</span>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div className={DS_modalBody}>
                        {currentStep === 1 && (
                            <motion.div initial={{ opacity: 0, x: isRTL ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                {/* Arabic Names */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-[#243460] pb-2">{isRTL ? "الاسم بناءً على الهوية (عربي)" : "Official Dossier Name (Arabic)"}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "الاسم الأول" : "First Name"}</label><input type="text" value={data.first_name_ar} onChange={(e) => setData("first_name_ar", e.target.value)} className={DS_input} required /><InputError message={errors.first_name_ar} /></div>
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "اسم الأب" : "Father Name"}</label><input type="text" value={data.second_name_ar} onChange={(e) => setData("second_name_ar", e.target.value)} className={DS_input} /></div>
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "اسم الجد" : "Grandfather"}</label><input type="text" value={data.third_name_ar} onChange={(e) => setData("third_name_ar", e.target.value)} className={DS_input} /></div>
                                        <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "الاسم الأخير" : "Last Name"}</label><input type="text" value={data.last_name_ar} onChange={(e) => setData("last_name_ar", e.target.value)} className={DS_input} required /><InputError message={errors.last_name_ar} /></div>
                                    </div>
                                </div>
                                {/* English Names */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-[#243460] pb-2">{isRTL ? "الاسم بناءً على الهوية (إنجليزي)" : "Official Dossier Name (English)"}</h4>
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
                                    <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "رقم الهوية / الإقامة" : "National Serial ID"}</label><input type="text" value={data.national_id} onChange={(e) => setData("national_id", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required /><InputError message={errors.national_id} /></div>
                                    <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "رقم الجوال" : "Phone"}</label><input type="text" value={data.phone} onChange={(e) => setData("phone", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required /><InputError message={errors.phone} /></div>
                                    <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "رقم الرخصة" : "License Serial"}</label><input type="text" value={data.license_number} onChange={(e) => setData("license_number", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required /><InputError message={errors.license_number} /></div>
                                    <div className="space-y-1.5"><label className={DS_label}>{isRTL ? "انتهاء الرخصة" : "License Expiry"}</label><input type="date" value={data.license_expiry_date} onChange={(e) => setData("license_expiry_date", e.target.value)} className={DS_input} dir="ltr" required /><InputError message={errors.license_expiry_date} /></div>
                                </div>

                                {/* License images */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={DS_label}>{isRTL ? "الرخصة (أمام)" : "License Front"}</label>
                                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460]">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                                                {data.license_front_image ? <img src={URL.createObjectURL(data.license_front_image)} className="w-full h-full object-cover" /> : previewLicenseFront ? <img src={previewLicenseFront} className="w-full h-full object-cover" /> : <CreditCard size={18} className="text-gray-300 m-auto mt-3" />}
                                            </div>
                                            <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">{isRTL ? "اختيار ملف" : "Choose File"}<input type="file" className="hidden" accept="image/*" onChange={(e) => setData("license_front_image", e.target.files?.[0] || null)} /></label>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={DS_label}>{isRTL ? "الرخصة (خلف)" : "License Back"}</label>
                                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460]">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                                                {data.license_back_image ? <img src={URL.createObjectURL(data.license_back_image)} className="w-full h-full object-cover" /> : previewLicenseBack ? <img src={previewLicenseBack} className="w-full h-full object-cover" /> : <CreditCard size={18} className="text-gray-300 m-auto mt-3" />}
                                            </div>
                                            <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">{isRTL ? "اختيار ملف" : "Choose File"}<input type="file" className="hidden" accept="image/*" onChange={(e) => setData("license_back_image", e.target.files?.[0] || null)} /></label>
                                        </div>
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
              <th className="border p-1.5 text-right font-bold text-black">{isRTL ? "رقم الهوية" : "ID"}</th>
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
