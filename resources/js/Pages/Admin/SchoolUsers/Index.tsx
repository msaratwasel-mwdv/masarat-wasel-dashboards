import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage, useForm } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, {
  type PaginationMeta,
} from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  Users,
  School,
  Mail,
  Phone,
  UserCheck,
  Eye,
  Printer,
  X,
  MapPin,
  CreditCard,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  Upload,
  Download
} from "lucide-react";
import { 
    DS_pageWrapper, 
    DS_card, 
    DS_pageTitle,
    DS_statCard,
    DS_statIcon,
    DS_statLabel,
    DS_statValue2,
    DS_btnGold,
    DS_btnSecondary,
    DS_modalContainer,
    DS_modalHeader,
    DS_modalHeaderTitle,
    DS_modalHeaderAccent,
    DS_modalClose,
    DS_modalBody,
    DS_modalFooter,
    DS_input,
    DS_label,
    DS_btnPrimary,
    DS_btnDanger,
    DS_btnEdit
} from "@/lib/DS";
import PrintReportHeader from "@/Components/PrintReportHeader";
import { AnimatePresence } from "framer-motion";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";

// ─── Print CSS ──────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #school-print-area, #school-print-area * { visibility: visible !important; }
  #school-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  image: string | null;
  school_admin?: {
    school: {
      id: number;
      name: string;
    };
  };
}

interface Props {
  users: {
    data: User[];
    links: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  filters: {
    search: string;
  };
  auth: any;
}

export default function SchoolUsersIndex({ users, filters, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState(filters.search);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { data: importData, setData: setImportData, post: postImport, processing: importProcessing, errors: importErrors, reset: resetImport } = useForm({ file: null as File | null });
  const flash = usePage().props.flash as any;

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.get(
          route("admin.school-admins.index"),
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

  const openDetailsModal = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handlePrint = () => window.print();

  const columnHelper = createColumnHelper<User>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: isRTL ? "مدير المدرسة" : "School Manager",
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-[#0f2044]/10 dark:bg-[#0f2044]/40 text-[#0f2044] dark:text-[#f5b800] flex items-center justify-center font-black text-sm overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
                {user.image ? (
                  <img
                    src={`/storage/${user.image}`}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"} tracking-tight`}>
                  {user.name}
                </span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate max-w-[150px]">
                  {user.email}
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("phone", {
        header: isRTL ? "الجوال" : "Phone",
      }),
      columnHelper.accessor("school_admin.school.name", {
        header: isRTL ? "المؤسسة التعليمية" : "Educational Institution",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#f5b800]/10 rounded-lg text-[#f5b800]">
                <School size={14} />
            </div>
            <span className={`text-sm font-bold ${isDark ? "text-gray-300" : "text-[#0f2044]"}`}>
                {info.getValue() || (isRTL ? "غير مرتبطة" : "UNLINKED")}
            </span>
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
            const user = info.row.original;
            return (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => openDetailsModal(user)}
                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title={isRTL ? "عرض الملف" : "View Dossier"}
                    >
                        <Eye size={16} />
                    </button>
                </div>
            );
        }
      })
    ],
    [isRTL]
  );

  const pagination: PaginationMeta = {
    links: users.links,
    current_page: users.current_page,
    last_page: users.last_page,
    per_page: users.per_page,
    total: users.total,
    from: users.from,
    to: users.to,
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={isRTL ? "إدارة مدراء المدارس" : "School Managers Management"} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area (Unified System) ── */}
      <div id="school-print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
        <PrintReportHeader
          title={isRTL ? "تقرير بيانات مدراء المدارس" : "School Managers Operational Report"}
          schoolName={isRTL ? "إدارة شركة مسارات واصل" : "Masarat Wasel Company"}
          schoolLogo={null}
          printDate={`${isRTL ? "تاريخ الطباعة" : "Print Date"}: ${new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}`}
          schoolAdminText={isRTL ? "إدارة الشركة" : "Company Admin"}
        />
        <div className="px-4">
          <table className="w-full border-collapse border border-gray-300 text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1.5 text-right font-bold w-8 text-black">#</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "المدير" : "Manager"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "المدرسة" : "School"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الجوال" : "Phone"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "البريد الإلكتروني" : "Email"}</th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((user, i) => (
                <tr key={user.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center text-gray-700">{i + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{user.name}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{user.school_admin?.school.name || "—"}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{user.phone}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{user.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex flex-col">
                <h1 className={DS_pageTitle}>
                    {isRTL ? "إدارة مدراء المدارس" : "School Managers Oversight"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {users.total} {isRTL ? "مدير مفوض حالياً" : "Authorized Managers Currently"}
                    </span>
                </div>
            </div>
        </div>

        {/* Intelligence Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={DS_statCard('blue')}>
                <div className={DS_statIcon('blue')}><Users size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "إجمالي المدراء" : "Total Managers"}</p>
                    <p className={DS_statValue2('blue')}>{users.total}</p>
                </div>
            </div>
            <div className={DS_statCard('green')}>
                <div className={DS_statIcon('green')}><School size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "المدارس المرتبطة" : "Linked Schools"}</p>
                    <p className={DS_statValue2('green')}>{users.data.filter(u => u.school_admin?.school).length}</p>
                </div>
            </div>
            <div className={DS_statCard('red')}>
                <div className={DS_statIcon('red')}><ShieldAlert size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "صلاحيات الوصول" : "Access Level"}</p>
                    <p className={DS_statValue2('red')}>{isRTL ? "مدير نظام" : "Admin Level"}</p>
                </div>
            </div>
        </div>

        {/* Error reporting for import */}
        {flash?.import_errors && flash.import_errors.length > 0 && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <h4 className="text-rose-600 font-bold mb-2">أخطاء في عملية الاستيراد:</h4>
                <ul className="list-disc list-inside text-sm text-rose-500 space-y-1">
                    {flash.import_errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                    ))}
                </ul>
            </div>
        )}

        {/* Action Button Section */}
        <div className="flex flex-wrap justify-end gap-3 mb-4">
            <button onClick={() => setIsImportModalOpen(true)} className={DS_btnSecondary}>
                <Upload size={18} />
                <span>{isRTL ? "استيراد المدراء" : "Import"}</span>
            </button>
            <a href={route("admin.school-admins.export")} className={DS_btnSecondary}>
                <Download size={18} />
                <span>{isRTL ? "تصدير المدراء" : "Export"}</span>
            </a>
        </div>

        {/* Main Operational Table */}
        <div className={DS_card}>
            <BaseDataTable<User>
                columns={columns}
                data={users.data}
                pagination={pagination}
                searchValue={search}
                onSearchChange={handleSearch}
                searchPlaceholder={isRTL ? "البحث في سجلات المدراء..." : "Search manager records..."}
                exportEnabled={true}
                headerAction={
                    <button onClick={handlePrint} className={DS_btnSecondary}>
                        <Printer size={16} />
                        <span>{isRTL ? "طباعة التقارير" : "Print Reports"}</span>
                    </button>
                }
            />
        </div>

        {/* --- Manager Dossier Details Modal --- */}
        <AnimatePresence>
            {showDetailsModal && selectedUser && (
                <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="2xl">
                    <div className={DS_modalContainer}>
                        {/* Dossier Header */}
                        <div className="relative h-40 bg-[#0f2044] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent z-10" />
                            <div className="absolute top-6 inset-x-6 flex justify-between items-center z-20">
                                <span className="px-3 py-1 bg-[#f5b800] text-[#0f2044] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    {isRTL ? "رتبة: مدير مدرسة" : "Role: School Manager"}
                                </span>
                                <button onClick={() => setShowDetailsModal(false)} className={DS_modalClose}>
                                    <X size={18} />
                                </button>
                            </div>
                            
                            {/* Visual ID */}
                            <div className="absolute -bottom-8 left-10 w-24 h-24 rounded-2xl border-4 border-white dark:border-[#1a2845] bg-white dark:bg-[#0f2044] shadow-2xl overflow-hidden z-20">
                                {selectedUser.image ? (
                                    <img src={`/storage/${selectedUser.image}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl font-black text-[#0f2044] dark:text-[#f5b800] bg-gray-50">
                                        {selectedUser.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-12 pb-8 px-10">
                            <div className="border-b border-gray-100 dark:border-[#243460] pb-6">
                                <h2 className="text-2xl font-black text-[#0f2044] dark:text-white tracking-tighter">
                                    {selectedUser.name}
                                </h2>
                                <div className="flex gap-2 mt-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                        <Mail size={12} /> {selectedUser.email}
                                    </div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full mt-2" />
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                        <Phone size={12} /> {selectedUser.phone}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-[#7ba7e8] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <School size={14} className="text-[#f5b800]" /> {isRTL ? "المدرسة المرتبطة" : "Affiliated School"}
                                    </h3>
                                    <div className="p-4 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 rounded-2xl border border-gray-100 dark:border-[#243460]">
                                        <p className="text-sm font-black text-[#0f2044] dark:text-gray-300">
                                            {selectedUser.school_admin?.school.name || (isRTL ? "غير مرتبطة" : "UNLINKED")}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                                            {isRTL ? "بيانات المؤسسة التعليمية" : "Institution Records"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-[#7ba7e8] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-[#f5b800]" /> {isRTL ? "الحالة النظامية" : "System Status"}
                                    </h3>
                                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center justify-between">
                                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{isRTL ? "نشط" : "Active"}</span>
                                        <UserCheck size={16} className="text-emerald-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </AnimatePresence>

        {/* --- Import Modal --- */}
        <Modal show={isImportModalOpen} onClose={() => { setIsImportModalOpen(false); resetImport(); }} maxWidth="md">
            <div className={DS_modalContainer}>
                <div className={DS_modalHeader(isRTL)}>
                    <div className="flex items-center gap-3">
                        <div className={DS_modalHeaderAccent} />
                        <h3 className={DS_modalHeaderTitle}>
                            {isRTL ? "استيراد مدراء المدارس (Excel)" : "Import School Managers (Excel)"}
                        </h3>
                    </div>
                    <button onClick={() => { setIsImportModalOpen(false); resetImport(); }} className={DS_modalClose}>
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    postImport(route('admin.school-admins.import'), {
                        forceFormData: true,
                        onSuccess: () => { setIsImportModalOpen(false); resetImport(); }
                    });
                }}>
                    <div className={DS_modalBody}>
                        <div className="space-y-6">
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <p className="text-sm font-bold text-[#0f2044]">
                                    {isRTL ? "يرجى تحميل القالب المخصص وتعبئته بالبيانات ثم إعادة رفعه هنا." : "Please download the template, fill it with data, and upload it here."}
                                </p>
                                <a href={route('admin.school-admins.template')} className="inline-flex items-center gap-2 mt-3 text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest underline">
                                    <Download size={14} /> {isRTL ? "تحميل القالب (Template)" : "Download Template"}
                                </a>
                            </div>

                            <div className="space-y-2">
                                <label className={DS_label}>{isRTL ? "ملف الإكسيل" : "Excel File"}</label>
                                <input 
                                    type="file" 
                                    accept=".xlsx,.xls,.csv" 
                                    onChange={e => setImportData('file', e.target.files ? e.target.files[0] : null)}
                                    className={DS_input} 
                                    required 
                                />
                                <InputError message={importErrors.file} />
                            </div>
                        </div>
                    </div>
                    <div className={DS_modalFooter(isRTL)}>
                        <div className="ml-auto flex items-center gap-3">
                            <button type="button" onClick={() => { setIsImportModalOpen(false); resetImport(); }} className="text-xs font-bold text-gray-400 hover:text-[#0f2044]">
                                {isRTL ? "إلغاء" : "Cancel"}
                            </button>
                            <button type="submit" disabled={importProcessing} className={DS_btnGold}>
                                {isRTL ? "رفع واستيراد" : "Upload & Import"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>

      </div>
    </AuthenticatedLayout>
  );
}

function InfoRow({ icon, label, value, isDark }: any) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-[#243460] last:border-0">
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${isDark ? "bg-gray-800 text-gray-500" : "bg-[#0f2044]/5 text-[#0f2044]"}`}>
                    {icon}
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
            </div>
            <span className={`text-xs font-bold ${isDark ? "text-gray-200" : "text-[#0f2044]"}`}>{value}</span>
        </div>
    );
}
