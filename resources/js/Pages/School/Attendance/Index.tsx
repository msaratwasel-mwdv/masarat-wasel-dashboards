import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { User } from "@/types";
import { useTheme } from "@/Contexts/ThemeContext";
import { CheckCircle, XCircle, Calendar, Users, Save, FileText, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    DS_card, DS_pageTitle, DS_btnPrimary, DS_inputCls, 
    DS_labelCls, DS_tableWrapper, DS_tableBase, DS_tableHead, 
    DS_tableTh, DS_tableRow, DS_tableTd, DS_submitBtn
} from "@/lib/DS";

interface Classroom {
    id: number;
    name: string;
}

interface Student {
    id: number;
    full_name: string;
    student_code: string;
    current_enrollment?: {
        classroom?: Classroom;
    };
}

type AttendanceMap = Record<string, { student_id: number; status: "present" | "absent" }>

interface Props {
    auth: { user: User };
    date: string;
    students: Student[];
    attendance: any;
}

export default function DailyAttendance({ auth, date, students, attendance }: Props) {
    const { isRTL: isRtl } = useTheme();
    const initialRows = students.map((s) => {
        const existing = attendance?.[s.id];
        return {
            student_id: s.id,
            status: existing ? existing.status : "present",
        };
    });

    const { data, setData, post, processing } = useForm({
        date: date,
        rows: initialRows,
    });

    const onChangeDate = (value: string) => {
        // Navigate by changing query string
        // @ts-ignore
        import("@inertiajs/react").then(({ router }) => {
            router.get(route("school.attendance.index"), { date: value }, { preserveState: true, preserveScroll: true });
        });
    };

    const setRowStatus = (studentId: number, status: "present" | "absent") => {
        setData(
            "rows",
            data.rows.map((r) => (r.student_id === studentId ? { ...r, status } : r))
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("school.attendance.store"), { preserveScroll: true });
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className={DS_pageTitle}>
                    {(isRtl ? 'تسجيل الحضور اليومي' : 'Daily Attendance')}
                </h2>
            }
        >
            <Head title={(isRtl ? 'تسجيل الحضور اليومي' : 'Daily Attendance')} />

            <div className="pb-8 space-y-6">
                <div className={DS_card}>
                    <div className="p-8">
                        {/* Header Strip */}
                        <div className="flex flex-col justify-between gap-6 mb-8 lg:flex-row lg:items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 bg-[#0f2044] text-[#f5b800] rounded-[22px] shadow-lg">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-[#0f2044] dark:text-white">
                                        {(isRtl ? 'كشف الحضور' : 'Attendance Sheet')}
                                    </h3>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {(isRtl ? 'تسجيل الحضور ليوم' : 'Mark presence for')}:{" "}
                                        <span className="font-bold text-[#f5b800]">
                                            {date}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col w-full gap-4 sm:flex-row lg:w-auto">
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => onChangeDate(e.target.value)}
                                        className={`${DS_inputCls} sm:w-72 rtl:pl-12 ltr:pr-12`}
                                    />
                                    <div className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-3.5 text-gray-400 pointer-events-none`}>
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit}>
                            <div className={DS_tableWrapper}>
                                <table className={DS_tableBase}>
                                    <thead className={DS_tableHead}>
                                        <tr>
                                            <th className={DS_tableTh(isRtl)}>
                                                {(isRtl ? 'الطالب' : 'Student')}
                                            </th>
                                            <th className={DS_tableTh(isRtl)}>
                                                {(isRtl ? 'الفصل' : 'Classroom')}
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-[#0f2044]/60 dark:text-[#7ba7e8]/70 uppercase text-end">
                                                {(isRtl ? 'الحالة' : 'Status')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-[#243460]">
                                        {students.length > 0 ? (
                                            students.map((s) => {
                                                const row = data.rows.find((r) => r.student_id === s.id);
                                                const status = row?.status || "present";
                                                return (
                                                    <tr key={s.id} className={DS_tableRow}>
                                                        <td className={DS_tableTd}>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-[#0f2044] dark:text-white">
                                                                    {s.full_name}
                                                                </span>
                                                                <span className="text-xs text-gray-500 font-mono mt-0.5">
                                                                    #{s.student_code}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className={DS_tableTd}>
                                                            <span className="px-3 py-1 rounded-[8px] text-xs font-bold bg-[#0f2044]/5 text-[#0f2044] dark:bg-gray-800 dark:text-gray-300">
                                                                {s.current_enrollment?.classroom?.name || "-"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-end">
                                                            <div className="inline-flex bg-[#0f2044]/5 dark:bg-[#0f2044]/30 rounded-[14px] p-1 border border-[#0f2044]/10 dark:border-[#243460]">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRowStatus(s.id, "present")}
                                                                    className={`px-4 py-1.5 rounded-[10px] text-xs font-bold transition-all flex items-center gap-1.5 ${status === "present" ? 'bg-emerald-500 text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}
                                                                >
                                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                                    {(isRtl ? 'حاضر' : 'Present')}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRowStatus(s.id, "absent")}
                                                                    className={`px-4 py-1.5 rounded-[10px] text-xs font-bold transition-all flex items-center gap-1.5 ${status === "absent" ? 'bg-red-500 text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}
                                                                >
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    {(isRtl ? 'غائب' : 'Absent')}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="py-20 text-center">
                                                    <div className="text-5xl mb-4">📚</div>
                                                    <p className="text-gray-400 font-bold">
                                                        {(isRtl ? 'لا يوجد طلاب مسجلين لهذا التاريخ' : 'No students found for this date')}
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end pt-6 mt-6 border-t border-gray-100 dark:border-[#243460]">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={DS_submitBtn(processing)}
                                >
                                    <Save className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                    {processing ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الحضور' : 'Save Attendance')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
