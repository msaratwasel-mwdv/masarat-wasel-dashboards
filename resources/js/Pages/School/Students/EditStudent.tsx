import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { User, Classroom } from "@/types"; // ✅ يستورد التعريفات الصحيحة من الملف المركزي

// تعريف "شكل" بيانات الطالب التي ستصل من المتحكم (Controller)
interface Student {
    id: number;
    full_name: string;
    student_code: string;
    is_active: boolean;
    // سجل الالتحاق الحالي للطالب، قد يكون null إذا لم يكن مسجلاً
    current_enrollment: {
        classroom_id: number;
    } | null;
}

// تعريف الخصائص التي تستقبلها الصفحة
interface Props {
    auth: { user: User };
    student: Student; // الطالب الذي نريد تعديله
    classrooms: Classroom[]; // قائمة بكل الفصول المتاحة
}

export default function EditStudent({ auth, student, classrooms }: Props) {
    // إعداد حالة النموذج (Form State) مع ملء البيانات الحالية للطالب
    const { data, setData, put, processing, errors } = useForm({
        full_name: student.full_name,
        student_code: student.student_code,
        // إذا كان الطالب مسجلاً في فصل، نضع رقم الفصل، وإلا نضع قيمة فارغة
        classroom_id: student.current_enrollment?.classroom_id || "",
        is_active: student.is_active,
    });

    // دالة الإرسال عند الضغط على زر "تحديث"
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // نستخدم 'put' بدلاً من 'post' لأننا نقوم بعملية تحديث
        put(route("school.students.update", student.id));
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-bold text-[#0F2847]">
                    Edit Student: {student.full_name}
                </h2>
            }
        >
            <Head title={`Edit ${student.full_name}`} />

            <div className="max-w-2xl mx-auto">
                <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="pb-4 mb-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-slate-800">
                            Update Student Information
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Modify the student's details below.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* حقل اسم الطالب الكامل */}
                        <div>
                            <label
                                htmlFor="full_name"
                                className="block mb-1 text-sm font-medium text-gray-700"
                            >
                                Full Name
                            </label>
                            <input
                                id="full_name"
                                type="text"
                                value={data.full_name}
                                onChange={(e) =>
                                    setData("full_name", e.target.value)
                                }
                                className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                                required
                            />
                            {errors.full_name && (
                                <div className="mt-1 text-xs font-medium text-red-500">
                                    {errors.full_name}
                                </div>
                            )}
                        </div>

                        {/* حقل كود الطالب */}
                        <div>
                            <label
                                htmlFor="student_code"
                                className="block mb-1 text-sm font-medium text-gray-700"
                            >
                                Student Code
                            </label>
                            <input
                                id="student_code"
                                type="text"
                                value={data.student_code}
                                onChange={(e) =>
                                    setData("student_code", e.target.value)
                                }
                                className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                                required
                            />
                            {errors.student_code && (
                                <div className="mt-1 text-xs font-medium text-red-500">
                                    {errors.student_code}
                                </div>
                            )}
                        </div>

                        {/* حقل اختيار الفصل الدراسي */}
                        <div>
                            <label
                                htmlFor="classroom_id"
                                className="block mb-1 text-sm font-medium text-gray-700"
                            >
                                Classroom
                            </label>
                            <select
                                id="classroom_id"
                                value={data.classroom_id}
                                onChange={(e) =>
                                    setData("classroom_id", e.target.value)
                                }
                                className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                                required
                            >
                                <option value="" disabled>
                                    Select a classroom
                                </option>
                                {classrooms.map((classroom) => (
                                    <option
                                        key={classroom.id}
                                        value={classroom.id}
                                    >
                                        {classroom.name}
                                    </option>
                                ))}
                            </select>
                            {errors.classroom_id && (
                                <div className="mt-1 text-xs font-medium text-red-500">
                                    {errors.classroom_id}
                                </div>
                            )}
                        </div>

                        {/* حقل تفعيل/تعطيل الطالب */}
                        <div className="flex items-center">
                            <input
                                id="is_active"
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData("is_active", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-[#0F2847] focus:ring-[#0F2847]"
                            />
                            <label
                                htmlFor="is_active"
                                className="block ml-2 text-sm text-gray-900"
                            >
                                Student is Active
                            </label>
                        </div>

                        {/* أزرار التحكم */}
                        <div className="flex items-center justify-end pt-4 space-x-4">
                            <Link
                                href={route("school.students.index")}
                                className="px-4 py-2 text-sm text-gray-600 transition bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 text-sm text-white bg-[#0F2847] rounded-lg hover:bg-slate-700 disabled:opacity-50 font-semibold transition"
                            >
                                {processing ? "Updating..." : "Update Student"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
