import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { User } from "@/types";

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
                <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
                    Daily Attendance
                </h2>
            }
        >
            <Head title="Daily Attendance" />

            <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-[30px]">
                    {/* Header Strip */}
                    <div className="flex flex-col justify-between gap-6 mb-8 xl:flex-row xl:items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#0e7490] text-white rounded-[20px] shadow-sm">
                                <span className="text-3xl">📋</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-[#0e7490] dark:text-cyan-400">
                                    Attendance Sheet
                                </h3>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Mark presence for:{" "}
                                    <span className="font-bold text-[#0e7490] dark:text-cyan-400">
                                        {date}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col w-full gap-4 sm:flex-row xl:w-auto">
                            {/* Date Picker (Styled like Search) */}
                            <div className="relative flex-grow sm:flex-grow-0">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => onChangeDate(e.target.value)}
                                    className="w-full px-4 py-3.5 border border-gray-200 dark:border-gray-600 shadow-sm sm:w-72 bg-gray-50 dark:bg-gray-700 rounded-[35px] pl-11 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent dark:text-white transition-all font-medium text-gray-700"
                                />
                                <div className="absolute left-4 top-3.5 text-gray-400 pointer-events-none">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit}>
                        {/* Table */}
                        <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-[20px] mb-8">
                            <table className="min-w-full text-start">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                                            👤 Student
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                                            🏫 Classroom
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-end">
                                            ✅ Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {students.length > 0 ? (
                                        students.map((s) => {
                                            const row = data.rows.find((r) => r.student_id === s.id);
                                            const status = row?.status || "present";
                                            return (
                                                <tr
                                                    key={s.id}
                                                    className="transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-900/10"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-800 dark:text-white">
                                                                    {s.full_name}
                                                                </span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    #{s.student_code}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                        {s.current_enrollment?.classroom?.name || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 text-end">
                                                        <div className="inline-block relative">
                                                            <select
                                                                value={status}
                                                                onChange={(e) => setRowStatus(s.id, e.target.value as any)}
                                                                className={`appearance-none pl-5 pr-10 py-2.5 border rounded-[35px] shadow-sm focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all font-bold cursor-pointer outline-none text-sm ${status === "present"
                                                                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                                                                        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                                                                    }`}
                                                            >
                                                                <option value="present">✅ Present</option>
                                                                <option value="absent">❌ Absent</option>
                                                            </select>
                                                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${status === "present" ? "text-green-600" : "text-red-600"
                                                                }`}>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                                <td colSpan={3} className="py-16 text-center">
                                                    <div className="text-6xl mb-4 opacity-20">📚</div>
                                                    <p className="text-gray-400 dark:text-gray-500 font-medium">
                                                        No students found for this date.
                                                    </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex justify-center items-center px-8 py-3.5 bg-[#0e7490] text-white hover:bg-[#155e75] rounded-[35px] font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                {processing ? "Saving..." : "Save Attendance"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
