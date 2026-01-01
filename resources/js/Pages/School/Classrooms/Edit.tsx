import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { User } from "@/types";

interface Teacher {
    id: number;
    name: string;
    email?: string;
}

interface Classroom {
    id: number;
    name: string;
    grade_level?: string | null;
    teachers?: Teacher[];
}

interface Props {
    auth: { user: User };
    classroom: Classroom;
    teachers: Teacher[];
}

export default function EditClassroom({ auth, classroom, teachers }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: classroom.name || "",
        grade_level: classroom.grade_level || "",
        teacher_ids: classroom.teachers ? classroom.teachers.map((t) => t.id) : ([] as number[]),
    });

    const toggleTeacher = (id: number) => {
        const exists = data.teacher_ids.includes(id);
        setData(
            "teacher_ids",
            exists
                ? data.teacher_ids.filter((x) => x !== id)
                : [...data.teacher_ids, id]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("school.classrooms.update", classroom.id));
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-bold text-[#0F2847]">
                    Edit Classroom
                </h2>
            }
        >
            <Head title="Edit Classroom" />

            <div className="max-w-3xl mx-auto">
                <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="pb-4 mb-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-slate-800">
                            Classroom Details
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Update classroom info and assign teachers.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Class Name
                            </label>
                            <input
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                                required
                            />
                            {errors.name && (
                                <div className="mt-1 text-xs font-medium text-red-500">
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Grade Level (Optional)
                            </label>
                            <input
                                value={data.grade_level}
                                onChange={(e) => setData("grade_level", e.target.value)}
                                className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                            />
                            {errors.grade_level && (
                                <div className="mt-1 text-xs font-medium text-red-500">
                                    {errors.grade_level}
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">
                                    Assigned Teachers
                                </label>
                                <Link
                                    href={route("school.teachers.index")}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                >
                                    Manage Teachers
                                </Link>
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {teachers.length > 0 ? (
                                    teachers.map((t) => {
                                        const checked = data.teacher_ids.includes(t.id);
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => toggleTeacher(t.id)}
                                                className={`text-left p-3 rounded-xl border transition ${
                                                    checked
                                                        ? "border-yellow-400 bg-yellow-50"
                                                        : "border-gray-200 bg-white hover:bg-gray-50"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">
                                                            {t.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {t.email || ""}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleTeacher(t.id)}
                                                    />
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="text-sm text-gray-500">
                                        No teachers found for this school.
                                    </div>
                                )}
                            </div>
                            {errors.teacher_ids && (
                                <div className="mt-1 text-xs font-medium text-red-500">
                                    {String(errors.teacher_ids)}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end pt-4 space-x-4">
                            <Link
                                href={route("school.classrooms.index")}
                                className="px-4 py-2 text-sm text-gray-600 transition bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 text-sm text-white bg-[#0F2847] rounded-lg hover:bg-slate-700 disabled:opacity-50 font-semibold transition"
                            >
                                {processing ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
