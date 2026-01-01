import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { User, Classroom } from "@/types";

// شكل الطالب القادم من الـ Controller
interface Student {
  id: number;
  full_name: string;
  student_code: string;
  is_active: boolean;
  current_enrollment: {
    classroom: Classroom;
  } | null;
}

// خصائص الصفحة (توافق Controller الحالي)
interface Props {
  auth: { user: User };
  students: Student[]; // ✅ صار Array مباشرة
}

export default function IndexStudents({ auth, students }: Props) {
  return (
    <SchoolAuthenticatedLayout
    user={auth.user}
      header={
        <h2 className="text-xl font-bold text-[#0F2847]">
          Students Management
        </h2>
      }
    >
      <Head title="Students" />

      <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">Students List</h3>

          <Link
            href={route("school.students.create")}
            className="inline-flex items-center px-4 py-2 bg-[#0F2847] text-white text-xs font-bold uppercase rounded-lg hover:bg-slate-700 transition"
          >
            + Add New Student
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b-2 border-gray-100">
              <tr>
                <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Student Name
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Code
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Classroom
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wider text-right text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="flex items-center px-4 py-4 font-medium text-gray-800">
                      <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 mr-3 font-bold rounded-full bg-slate-200 text-slate-500">
                        {student.full_name?.charAt(0)}
                      </div>
                      {student.full_name}
                    </td>

                    <td className="px-4 py-4 font-mono text-sm text-gray-500">
                      {student.student_code}
                    </td>

                    <td className="px-4 py-4 text-gray-500">
                      {student.current_enrollment?.classroom?.name || "N/A"}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          student.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {student.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-4 space-x-4 text-right">
                      <Link
                        href={route("school.students.edit", student.id)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </Link>

                      <Link
                        href={route("school.students.attendance", student.id)}
                        className="text-sm font-semibold text-slate-600 hover:text-slate-800"
                      >
                        Attendance
                      </Link>

                      <Link
                        href={route("school.students.destroy", student.id)}
                        method="delete"
                        as="button"
                        className="text-sm font-semibold text-red-600 hover:text-red-800"
                      >
                        Delete
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    No students have been added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
