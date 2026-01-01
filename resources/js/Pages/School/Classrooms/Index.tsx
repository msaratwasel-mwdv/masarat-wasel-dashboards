import React from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";



export interface Classroom {
    id: number;
    name: string;
    grade_level?: string; // علامة الاستفهام تعني أنه اختياري
    school_id: number;
    teachers?: { id: number; name: string; email?: string }[];
}


interface Props {
    auth: any;
    classrooms: Classroom[];
}

export default function ClassroomIndex({ auth, classrooms }: Props) {
    // إعداد نموذج إضافة فصل جديد
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        grade_level: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("school.classrooms.store"), {
            preserveScroll: true, // يمنع الصفحة من الصعود للأعلى بعد الإضافة
            onSuccess: () => reset(),
        });
    };

    const handleDelete = (id: number) => {
        if (
            confirm(
                "هل أنت متأكد من حذف هذا الفصل؟ سيتم فك ارتباط الطلاب به ولكن لن يتم حذفهم."
            )
        ) {
            // @ts-ignore
            import("@inertiajs/react").then(({ router }) => {
                router.delete(route("school.classrooms.destroy", id), {
                    preserveScroll: true,
                });
            });
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-bold text-[#0F2847]">
                    Classrooms Management
                </h2>
            }
        >
            <Head title="Classrooms" />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* --- نموذج الإضافة (على اليسار) --- */}
                <div className="lg:col-span-1">
                    <div className="h-full p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                        <h3 className="mb-1 text-lg font-bold text-slate-800">
                            Add New Class
                        </h3>
                        <p className="mb-6 text-sm text-gray-500">
                            Create a new class for your school.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block mb-1 text-sm font-medium text-gray-700"
                                >
                                    Class Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24]"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    placeholder="e.g., Grade 1 - Section A"
                                    required
                                />
                                {errors.name && (
                                    <div className="mt-1 text-xs text-red-500">
                                        {errors.name}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="grade_level"
                                    className="block mb-1 text-sm font-medium text-gray-700"
                                >
                                    Grade Level (Optional)
                                </label>
                                <input
                                    id="grade_level"
                                    type="text"
                                    className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24]"
                                    value={data.grade_level}
                                    onChange={(e) =>
                                        setData("grade_level", e.target.value)
                                    }
                                    placeholder="e.g., Primary, Secondary"
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full justify-center inline-flex items-center px-4 py-2 bg-[#0F2847] border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-700 disabled:opacity-50 transition"
                                >
                                    Save Class
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* --- جدول عرض الفصول (على اليمين) --- */}
                <div className="lg:col-span-2">
                    <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                        <h3 className="mb-6 text-lg font-bold text-slate-800">
                            Current Classes
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="border-b-2 border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                                            Class Name
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                                            Grade
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                                            Teachers
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-right text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {classrooms.length > 0 ? (
                                        classrooms.map((classroom) => (
                                            <tr
                                                key={classroom.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-4 font-medium text-gray-800 whitespace-nowrap">
                                                    {classroom.name}
                                                </td>
                                                <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                                                    {classroom.grade_level ||
                                                        "-"}
                                                </td>
                                                <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                                                    {classroom.teachers && classroom.teachers.length > 0
                                                        ? classroom.teachers.map((t) => t.name).join(", ")
                                                        : "-"}
                                                </td>
                                                <td className="px-4 py-4 text-right whitespace-nowrap space-x-3">
                                                    <Link
                                                        href={route(
                                                            "school.classrooms.edit",
                                                            classroom.id
                                                        )}
                                                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(classroom.id)}
                                                        className="text-sm font-semibold text-red-500 hover:text-red-700"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-10 text-center text-gray-400"
                                            >
                                                No classes added yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
