import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { User } from "@/types";

interface Teacher {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    is_active: boolean;
}

interface Paginated<T> {
    data: T[];
    links: any[];
    meta?: any;
}

interface Props {
    auth: { user: User };
    teachers: any; // Laravel paginator
}

export default function TeachersIndex({ auth, teachers }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        phone: "",
        password: "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("school.teachers.store"), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-bold text-[#0F2847]">Teachers</h2>}
        >
            <Head title="Teachers" />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <div className="h-full p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                        <h3 className="mb-1 text-lg font-bold text-slate-800">Add New Teacher</h3>
                        <p className="mb-6 text-sm text-gray-500">Create a teacher account for your school.</p>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
                                <input
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24]"
                                    required
                                />
                                {errors.name && <div className="mt-1 text-xs text-red-500">{errors.name}</div>}
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24]"
                                    required
                                />
                                {errors.email && <div className="mt-1 text-xs text-red-500">{errors.email}</div>}
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Phone (Optional)</label>
                                <input
                                    value={data.phone}
                                    onChange={(e) => setData("phone", e.target.value)}
                                    className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24]"
                                />
                                {errors.phone && <div className="mt-1 text-xs text-red-500">{errors.phone}</div>}
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Temporary Password</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24]"
                                    required
                                />
                                {errors.password && <div className="mt-1 text-xs text-red-500">{errors.password}</div>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full justify-center inline-flex items-center px-4 py-2 bg-[#0F2847] border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-700 disabled:opacity-50 transition"
                            >
                                {processing ? "Saving..." : "Save Teacher"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                        <h3 className="mb-6 text-lg font-bold text-slate-800">Current Teachers</h3>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="border-b-2 border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">Name</th>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">Email</th>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">Phone</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {teachers.data.length > 0 ? (
                                        teachers.data.map((t: Teacher) => (
                                            <tr key={t.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 font-medium text-gray-800 whitespace-nowrap">{t.name}</td>
                                                <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{t.email}</td>
                                                <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{t.phone || "-"}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="py-10 text-center text-gray-400">No teachers yet.</td>
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
