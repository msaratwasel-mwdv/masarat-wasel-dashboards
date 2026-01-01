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
            header={<h2 className="text-xl font-bold text-[#0F2847]">Daily Attendance</h2>}
        >
            <Head title="Daily Attendance" />

            <div className="max-w-5xl mx-auto">
                <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-6 border-b border-gray-200">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Attendance Viewer</h3>
                            <p className="mt-1 text-sm text-gray-500">Select a date and mark students as present/absent.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => onChangeDate(e.target.value)}
                                className="bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24]"
                            />
                        </div>
                    </div>

                    <form onSubmit={submit}>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="border-b-2 border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">Student</th>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">Classroom</th>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-right text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {students.length > 0 ? (
                                        students.map((s) => {
                                            const row = data.rows.find((r) => r.student_id === s.id);
                                            const status = row?.status || "present";
                                            return (
                                                <tr key={s.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4">
                                                        <div className="font-medium text-gray-800">{s.full_name}</div>
                                                        <div className="text-xs text-gray-500">{s.student_code}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                                                        {s.current_enrollment?.classroom?.name || "-"}
                                                    </td>
                                                    <td className="px-4 py-4 text-right whitespace-nowrap">
                                                        <select
                                                            value={status}
                                                            onChange={(e) => setRowStatus(s.id, e.target.value as any)}
                                                            className="bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24]"
                                                        >
                                                            <option value="present">Present</option>
                                                            <option value="absent">Absent</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="py-10 text-center text-gray-400">
                                                No students found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end pt-6">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 text-sm text-white bg-[#0F2847] rounded-lg hover:bg-slate-700 disabled:opacity-50 font-semibold transition"
                            >
                                {processing ? "Saving..." : "Save Attendance"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
