import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { User } from "@/types";

interface AttendanceRow {
    attendance_date: string;
    status: "present" | "absent";
    created_at?: string;
}

interface Props {
    auth: { user: User };
    student: { id: number; full_name: string; student_code: string };
    attendance: AttendanceRow[];
}

export default function AttendanceHistory({ auth, student, attendance }: Props) {
    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-bold text-[#0F2847]">Student Attendance History</h2>}
        >
            <Head title="Attendance History" />

            <div className="max-w-4xl mx-auto">
                <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-6 border-b border-gray-200">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{student.full_name}</h3>
                            <p className="mt-1 text-sm text-gray-500">{student.student_code}</p>
                        </div>
                        <Link
                            href={route("school.students.index")}
                            className="px-4 py-2 text-sm text-gray-600 transition bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Back to Students
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="border-b-2 border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-xs font-bold tracking-wider text-right text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendance.length > 0 ? (
                                    attendance.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-gray-800 whitespace-nowrap">{row.attendance_date}</td>
                                            <td className="px-4 py-4 text-right whitespace-nowrap">
                                                <span
                                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                        row.status === "present"
                                                            ? "text-green-700 bg-green-50"
                                                            : "text-red-700 bg-red-50"
                                                    }`}
                                                >
                                                    {row.status === "present" ? "Present" : "Absent"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="py-10 text-center text-gray-400">
                                            No attendance records.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
