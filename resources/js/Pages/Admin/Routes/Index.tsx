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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className={`font-semibold text-xl ${isDark ? "text-gray-200" : "text-gray-800"} leading-tight`}>
                        {isRTL ? "إدارة المسارات" : "Routes Management"}
                    </h2>
                    <PrimaryButton onClick={() => openModal("add")}>
                        {isRTL ? "إضافة مسار جديد" : "Add New Route"}
                    </PrimaryButton>
                </div>
            }
        >
            <Head title={isRTL ? "المسارات" : "Routes"} />

            <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} shadow-xl rounded-2xl overflow-hidden border`}>
                        <div className="overflow-x-auto">
                            <table className={`min-w-full divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
                                <thead className={`${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}>
                                    <tr>
                                        <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isRTL ? "text-right" : "text-left"} ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                            {isRTL ? "المسار" : "Route"}
                                        </th>
                                        <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isRTL ? "text-right" : "text-left"} ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                            {isRTL ? "المدرسة" : "School"}
                                        </th>
                                        <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                            {isRTL ? "الحافلات" : "Buses"}
                                        </th>
                                        <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                            {isRTL ? "الطلاب" : "Students"}
                                        </th>
                                        <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isRTL ? "text-left" : "text-right"} ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                            {isRTL ? "الإجراءات" : "Actions"}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`${isDark ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`}>
                                    {routes.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                                {isRTL ? "لا توجد مسارات مسجلة." : "No routes registered."}
                                            </td>
                                        </tr>
                                    ) : (
                                        routes.map((route) => (
                                            <tr key={route.id} className={`${isDark ? "hover:bg-gray-700/50" : "hover:bg-blue-50/30"} transition-colors`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 ml-3">
                                                            <span className="text-xs font-bold">🛣</span>
                                                        </div>
                                                        <div className={isRTL ? "text-right" : "text-left"}>
                                                            <div className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{route.name}</div>
                                                            <div className="text-xs text-gray-500 font-mono">{route.code}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-800"}`}>
                                                        {route.school?.name || "—"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className={`text-sm font-bold ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                                                        {route.buses?.length || 0}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 font-mono overflow-hidden truncate max-w-[100px]">
                                                        {route.buses?.map(b => b.bus_number).join(", ") || "—"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <span className="text-xs text-green-600 font-bold">↗ {route.morning_students_count}</span>
                                                        <span className="text-xs text-orange-600 font-bold">↙ {route.afternoon_students_count}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className={`flex items-center justify-end gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                                                        <button onClick={() => openModal("edit", route)} className="text-blue-500 hover:text-blue-700">
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => openModal("delete", route)} className="text-red-500 hover:text-red-700">
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal show={modalState.type === "add" || modalState.type === "edit"} onClose={closeModal}>
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                        {modalState.type === "add" ? (isRTL ? "إضافة مسار جديد" : "Add New Route") : (isRTL ? "تعديل المسار" : "Edit Route")}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel value={isRTL ? "اسم المسار" : "Route Name"} />
                            <TextInput value={data.name} onChange={(e) => setData("name", e.target.value)} className="w-full mt-1" required />
                            <InputError message={errors.name} />
                        </div>

                        <div>
                            <InputLabel value={isRTL ? "كود المسار" : "Route Code"} />
                            <TextInput value={data.code} onChange={(e) => setData("code", e.target.value)} className="w-full mt-1" required />
                            <InputError message={errors.code} />
                        </div>

                        <div>
                            <InputLabel value={isRTL ? "المدرسة" : "School"} />
                            <select
                                className={`w-full rounded-lg mt-1 ${isDark ? "bg-gray-800 border-gray-600 text-white" : "border-gray-300"}`}
                                value={data.school_id}
                                onChange={(e) => setData("school_id", e.target.value)}
                                required
                            >
                                <option value="">{isRTL ? "-- اختر المدرسة --" : "-- Select School --"}</option>
                                {schools.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.school_id} />
                        </div>

                        <div>
                            <InputLabel value={isRTL ? "الوصف" : "Description"} />
                            <textarea
                                className={`w-full rounded-lg mt-1 ${isDark ? "bg-gray-800 border-gray-600 text-white" : "border-gray-300"}`}
                                value={data.description}
                                onChange={(e) => setData("description", e.target.value)}
                                rows={3}
                            />
                            <InputError message={errors.description} />
                        </div>
                    </div>

                    <div className={`mt-6 flex justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <SecondaryButton onClick={closeModal} disabled={processing}>{isRTL ? "إلغاء" : "Cancel"}</SecondaryButton>
                        <PrimaryButton disabled={processing}>{isRTL ? "حفظ" : "Save"}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modalState.type === "delete"} onClose={closeModal}>
                <div className="p-6">
                    <h2 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                        {isRTL ? "حذف المسار" : "Delete Route"}
                    </h2>
                    <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                        {isRTL ? `هل أنت متأكد من حذف المسار (${modalState.route?.name})؟ لا يمكن التراجع عن هذا الإجراء.` : `Are you sure you want to delete the route (${modalState.route?.name})? This action cannot be undone.`}
                    </p>
                    <div className={`mt-6 flex justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <SecondaryButton onClick={closeModal}>{isRTL ? "إلغاء" : "Cancel"}</SecondaryButton>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition">
                            {isRTL ? "حذف" : "Delete"}
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
