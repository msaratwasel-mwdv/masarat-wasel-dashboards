import { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, { ActionButton } from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { Plus, Edit3, Trash2, Map as RouteIcon, X as LucideX, Printer } from "lucide-react";
import {
    DS_pageTitle,
    DS_btnGold,
    DS_btnPrimary,
    DS_btnSecondary,
    DS_inputCls,
    DS_labelCls,
    DS_modalContainer,
    DS_modalHeader,
    DS_modalHeaderTitle,
    DS_modalHeaderAccent,
    DS_modalClose,
    DS_modalBody,
    DS_submitBtn,
    DS_cancelBtn,
} from "@/lib/DS";
import PrintReportHeader from "@/Components/PrintReportHeader";

// ─── Print CSS ──────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #route-print-area, #route-print-area * { visibility: visible !important; }
  #route-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

interface School {
    id: number;
    name: string;
}

interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
}

interface Route {
    id: number;
    name: string;
    code: string;
    description: string | null;
    school_id: number;
    school?: School;
    buses?: Bus[];
    morning_students_count: number;
    afternoon_students_count: number;
}

interface Props {
    routes: Route[];
    schools: School[];
    auth: any;
}

export default function Index({ routes, schools, auth }: Props) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === "dark";

    // --- 1. State ---
    const [modalState, setModalState] = useState<{
        type: "add" | "edit" | "delete" | null;
        route: Route | null;
    }>({ type: null, route: null });

    // --- 2. Form ---
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: "",
        code: "",
        description: "",
        school_id: "",
    });

    // --- 3. Handlers ---
    const openModal = (type: "add" | "edit" | "delete", route: Route | null = null) => {
        setModalState({ type, route });
        if (type === "edit" && route) {
            setData({
                name: route.name,
                code: route.code,
                description: route.description || "",
                school_id: route.school_id.toString(),
            });
        } else {
            reset();
        }
    };

    const closeModal = () => {
        setModalState({ type: null, route: null });
        reset();
        clearErrors();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (modalState.type === "add") {
            post(route("admin.routes.store"), { onSuccess: closeModal });
        } else if (modalState.type === "edit" && modalState.route) {
            put(route("admin.routes.update", modalState.route.id), { onSuccess: closeModal });
        } else if (modalState.type === "delete" && modalState.route) {
            destroy(route("admin.routes.destroy", modalState.route.id), { onSuccess: closeModal });
        }
    };

    // --- 4. Columns ---
    const columnHelper = createColumnHelper<Route>();
    const columns = useMemo(() => [
        columnHelper.accessor("name", {
            header: isRTL ? "المسار" : "Route",
            cell: (info) => {
                const route = info.row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#0f2044]/5 dark:bg-white/5 text-[#0f2044] dark:text-[#f5b800] flex items-center justify-center flex-shrink-0">
                            <RouteIcon className="w-5 h-5" />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                            <div className="text-sm font-bold text-[#0f2044] dark:text-white">{route.name}</div>
                            <div className="text-xs font-mono text-gray-500">{route.code}</div>
                        </div>
                    </div>
                );
            }
        }),
        columnHelper.accessor("school.name", {
            header: isRTL ? "المدرسة" : "School",
            cell: (info) => {
                const schoolName = info.row.original.school?.name;
                return schoolName ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0f2044]/5 text-[#0f2044] dark:bg-white/10 dark:text-gray-300">
                        {schoolName}
                    </span>
                ) : <span className="text-gray-400">—</span>;
            }
        }),
        columnHelper.accessor("buses", {
            header: isRTL ? "الحافلات" : "Buses",
            cell: (info) => {
                const buses = info.row.original.buses;
                return (
                    <div className="text-center">
                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{buses?.length || 0}</div>
                        <div className="text-[10px] text-gray-500 font-mono truncate max-w-[120px] mx-auto">
                            {buses?.map(b => b.bus_number).join(", ") || "—"}
                        </div>
                    </div>
                );
            }
        }),
        columnHelper.display({
            id: "students",
            header: isRTL ? "الطلاب" : "Students",
            cell: (info) => {
                const route = info.row.original;
                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded w-full text-center">↗ {route.morning_students_count} {isRTL ? "صباحاً" : "Morning"}</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded w-full text-center">↙ {route.afternoon_students_count} {isRTL ? "مساءً" : "Afternoon"}</span>
                    </div>
                );
            }
        }),
        columnHelper.display({
            id: "actions",
            header: isRTL ? "الإجراءات" : "Actions",
            cell: (info) => {
                const route = info.row.original;
                return (
                    <div className={`flex gap-2 ${isRTL ? "justify-start" : "justify-end"}`}>
                        <ActionButton label={isRTL ? "تعديل" : "Edit"} icon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => openModal("edit", route)} color="blue" />
                        <ActionButton label={isRTL ? "حذف" : "Delete"} icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => openModal("delete", route)} color="red" />
                    </div>
                );
            }
        })
    ], [isRTL, isDark]);

    const handlePrint = () => window.print();

    return (
        <AuthenticatedLayout>
            <Head title={isRTL ? "المسارات" : "Routes"} />
            <style>{PRINT_STYLES}</style>

            {/* ── Print Area (hidden on screen, visible on print) ── */}
            <div id="route-print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
                <PrintReportHeader
                    title={isRTL ? "تقرير مسارات الحافلات" : "Bus Routes Report"}
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
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "المسار" : "Route"}</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الكود" : "Code"}</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "المدرسة" : "School"}</th>
                                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{isRTL ? "عدد الحافلات" : "Buses"}</th>
                                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{isRTL ? "طلاب الصباح" : "Morning"}</th>
                                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{isRTL ? "طلاب المساء" : "Afternoon"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {routes.map((route, i) => (
                                <tr key={route.id} className="border-b border-gray-300">
                                    <td className="border border-gray-300 p-1.5 text-center text-gray-700 font-semibold">{i + 1}</td>
                                    <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{route.name}</td>
                                    <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{route.code}</td>
                                    <td className="border border-gray-300 p-1.5 text-gray-700 font-bold uppercase tracking-wider">{route.school?.name || "—"}</td>
                                    <td className="border border-gray-300 p-1.5 text-center font-bold text-gray-800">{route.buses?.length || 0}</td>
                                    <td className="border border-gray-300 p-1.5 text-center text-emerald-700 font-bold">{route.morning_students_count}</td>
                                    <td className="border border-gray-300 p-1.5 text-center text-amber-700 font-bold">{route.afternoon_students_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
                        <p>{isRTL ? "إجمالي المسارات" : "Total Routes"}: {routes.length}</p>
                        <p>{isRTL ? "توقيع مدير الشركة" : "Company Manager Signature"}: ............................</p>
                    </div>
                </div>
            </div>

            <div className={`pb-8 space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>
                
                {/* ── Page Header (title only — matches school pages) ── */}
                <div className={isRTL ? "text-right" : "text-left"}>
                    <h1 className={DS_pageTitle}>{isRTL ? "إدارة المسارات" : "Routes Management"}</h1>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">
                        {isRTL ? `إجمالي ${routes.length} مسار مسجل` : `${routes.length} registered routes`}
                    </p>
                </div>

                {/* ── Main Table ── */}
                <BaseDataTable<Route>
                    columns={columns}
                    data={routes}
                    exportEnabled={true}
                    headerAction={
                        <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                            <button onClick={handlePrint} className={DS_btnSecondary}>
                                <Printer className="w-4 h-4" />
                                {isRTL ? "طباعة" : "Print"}
                            </button>
                            <button onClick={() => openModal("add")} className={DS_btnGold}>
                                <Plus className="w-4 h-4" />
                                {isRTL ? "إضافة مسار" : "New Route"}
                            </button>
                        </div>
                    }
                    emptyMessage={isRTL ? "لا توجد مسارات" : "No Routes Yet"}
                    emptyDescription={isRTL ? "لم يتم إضافة أي مسار. انقر على إضافة مسار للبدء." : "No routes added. Click Add New Route to start."}
                    emptyIcon={<RouteIcon className="w-10 h-10" />}
                    emptyAction={{ label: isRTL ? "إضافة مسار جديد" : "Add New Route", onClick: () => openModal("add") }}
                />
            </div>

            {/* ── Modals ── */}
            <Modal show={modalState.type === "add" || modalState.type === "edit"} onClose={closeModal} maxWidth="2xl">
                <div className={DS_modalContainer}>
                    <div className={DS_modalHeader(isRTL)}>
                        <div className="flex items-center gap-3">
                            <div className={DS_modalHeaderAccent} />
                            <h2 className={DS_modalHeaderTitle}>
                                {modalState.type === "add" ? (isRTL ? "إضافة مسار جديد" : "Add New Route") : (isRTL ? "تعديل بيانات المسار" : "Edit Route")}
                            </h2>
                        </div>
                        <button type="button" onClick={closeModal} className={DS_modalClose}>
                            <LucideX className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className={DS_modalBody}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className={DS_labelCls}>{isRTL ? "اسم المسار" : "Route Name"}</label>
                                <input type="text" value={data.name} onChange={e => setData("name", e.target.value)} className={DS_inputCls} required />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div>
                                <label className={DS_labelCls}>{isRTL ? "كود المسار" : "Route Code"}</label>
                                <input type="text" value={data.code} onChange={e => setData("code", e.target.value)} className={DS_inputCls} required />
                                <InputError message={errors.code} className="mt-1" />
                            </div>

                            <div>
                                <label className={DS_labelCls}>{isRTL ? "المدرسة" : "School"}</label>
                                <select value={data.school_id} onChange={e => setData("school_id", e.target.value)} className={DS_inputCls} required>
                                    <option value="">{isRTL ? "-- اختر المدرسة --" : "-- Select School --"}</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <InputError message={errors.school_id} className="mt-1" />
                            </div>

                            <div className="md:col-span-2">
                                <label className={DS_labelCls}>{isRTL ? "الوصف" : "Description"}</label>
                                <textarea value={data.description} onChange={e => setData("description", e.target.value)} className={DS_inputCls} rows={3} />
                                <InputError message={errors.description} className="mt-1" />
                            </div>
                        </div>

                        <div className={`mt-8 pt-5 border-t border-gray-100 dark:border-[#243460] flex gap-3 ${isRTL ? "flex-row-reverse" : "justify-end"}`}>
                            <button type="button" onClick={closeModal} className={DS_cancelBtn} disabled={processing}>{isRTL ? "إلغاء" : "Cancel"}</button>
                            <button type="submit" className={DS_submitBtn(processing)} disabled={processing}>{isRTL ? "حفظ البيانات" : "Save Changes"}</button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal show={modalState.type === "delete"} onClose={closeModal} maxWidth="md">
                <div className="p-8 text-center bg-white dark:bg-[#1a2845] rounded-[22px]">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-[#0f2044] dark:text-white mb-2">{isRTL ? "حذف المسار" : "Delete Route"}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                        {isRTL ? `هل أنت متأكد من حذف المسار (${modalState.route?.name})؟ لا يمكن التراجع عن هذا الإجراء.` : `Are you sure you want to delete the route (${modalState.route?.name})? This action cannot be undone.`}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={closeModal} className={DS_cancelBtn}>{isRTL ? "إلغاء" : "Cancel"}</button>
                        <button onClick={handleSubmit} disabled={processing} className="px-6 py-2.5 rounded-[14px] bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow transition-all">
                            {isRTL ? "تأكيد الحذف" : "Confirm Delete"}
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
