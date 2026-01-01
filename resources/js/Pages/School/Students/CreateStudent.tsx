import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import { User, Classroom } from "@/types";

interface Guardian {
    id: number;
    name: string;
    national_id: string;
    phone: string;
    email?: string | null;
}

interface Props {
    auth: { user: User };
    classrooms: Classroom[];
    guardianResult?: {
        found: boolean;
        guardian: Guardian | null;
    } | null;
}

export default function CreateStudent({ auth, classrooms, guardianResult }: Props) {
    // ---------- Step state ----------
    const [step, setStep] = useState<1 | 2>(guardianResult?.found ? 2 : 1);

    const selectedGuardian: Guardian | null = useMemo(() => {
        return guardianResult?.found ? (guardianResult.guardian as any) : null;
    }, [guardianResult]);

    // ---------- Guardian search form ----------
    const guardianSearch = useForm({ national_id: "" });

    const onSearchGuardian = (e: React.FormEvent) => {
        e.preventDefault();
        guardianSearch.post(route("school.guardians.search"), {
            preserveScroll: true,
            onSuccess: () => {
                // page will re-render with guardianResult
            },
        });
    };

    // ---------- Guardian create form (only when not found) ----------
    const guardianCreate = useForm({
        name: "",
        national_id: "",
        phone: "",
        email: "",
    });

    const onCreateGuardian = (e: React.FormEvent) => {
        e.preventDefault();
        guardianCreate.post(route("school.guardians.store"), {
            preserveScroll: true,
        });
    };

    // ---------- Student form (step 2) ----------
    const studentForm = useForm({
        full_name: "",
        student_code: "",
        classroom_id: "",
        guardian_id: selectedGuardian?.id || "",
    });

    const onSubmitStudent = (e: React.FormEvent) => {
        e.preventDefault();
        studentForm.post(route("school.students.store"));
    };

    // keep guardian_id in sync if guardianResult comes from server
    useEffect(() => {
        if (selectedGuardian) {
            studentForm.setData("guardian_id", selectedGuardian.id as any);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedGuardian?.id]);

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-bold text-[#0F2847]">Add New Student</h2>}
        >
            <Head title="Add Student" />

            <div className="max-w-3xl mx-auto">
                <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                    {/* ------------ Step indicator ------------ */}
                    <div className="flex items-center gap-3 pb-6 mb-6 border-b border-gray-200">
                        <div
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                                step === 1 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-500"
                            }`}
                        >
                            Step 1: Guardian Verification
                        </div>
                        <div
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                                step === 2 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-500"
                            }`}
                        >
                            Step 2: Student Details
                        </div>
                    </div>

                    {/* ------------ STEP 1 ------------ */}
                    {step === 1 && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Guardian Verification</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Enter guardian national ID to search. This prevents duplicates.
                                </p>
                            </div>

                            <form onSubmit={onSearchGuardian} className="space-y-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">
                                        Guardian National ID
                                    </label>
                                    <input
                                        value={guardianSearch.data.national_id}
                                        onChange={(e) => guardianSearch.setData("national_id", e.target.value)}
                                        className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                                        placeholder="e.g., 1234567890"
                                        required
                                    />
                                    {guardianSearch.errors.national_id && (
                                        <div className="mt-1 text-xs font-medium text-red-500">
                                            {guardianSearch.errors.national_id}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={guardianSearch.processing}
                                    className="px-6 py-2 text-sm text-white bg-[#0F2847] rounded-lg hover:bg-slate-700 disabled:opacity-50 font-semibold transition"
                                >
                                    {guardianSearch.processing ? "Searching..." : "Search"}
                                </button>
                            </form>

                            {/* search result */}
                            {guardianResult && (
                                <div className="pt-2">
                                    {guardianResult.found && guardianResult.guardian ? (
                                        <div className="p-4 border border-green-100 bg-green-50 rounded-xl">
                                            <div className="text-sm font-bold text-green-800">Guardian Found</div>
                                            <div className="mt-2 text-sm text-slate-800">
                                                <div><span className="font-semibold">Name:</span> {guardianResult.guardian.name}</div>
                                                <div><span className="font-semibold">Phone:</span> {guardianResult.guardian.phone}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setStep(2)}
                                                className="mt-4 px-6 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 font-semibold transition"
                                            >
                                                Select Guardian & Continue
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-4 border border-yellow-100 bg-yellow-50 rounded-xl">
                                            <div className="text-sm font-bold text-yellow-800">Guardian Not Found</div>
                                            <p className="mt-1 text-sm text-yellow-700">
                                                No guardian was found with this national ID. Create a new guardian below.
                                            </p>

                                            <form onSubmit={onCreateGuardian} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="sm:col-span-2">
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">Guardian Name</label>
                                                    <input
                                                        value={guardianCreate.data.name}
                                                        onChange={(e) => guardianCreate.setData("name", e.target.value)}
                                                        className="w-full bg-white border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                                                        required
                                                    />
                                                    {guardianCreate.errors.name && (
                                                        <div className="mt-1 text-xs font-medium text-red-500">{guardianCreate.errors.name}</div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">National ID</label>
                                                    <input
                                                        value={guardianCreate.data.national_id}
                                                        onChange={(e) => guardianCreate.setData("national_id", e.target.value)}
                                                        className="w-full bg-white border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                                                        required
                                                    />
                                                    {guardianCreate.errors.national_id && (
                                                        <div className="mt-1 text-xs font-medium text-red-500">{guardianCreate.errors.national_id}</div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">Phone</label>
                                                    <input
                                                        value={guardianCreate.data.phone}
                                                        onChange={(e) => guardianCreate.setData("phone", e.target.value)}
                                                        className="w-full bg-white border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                                                        required
                                                    />
                                                    {guardianCreate.errors.phone && (
                                                        <div className="mt-1 text-xs font-medium text-red-500">{guardianCreate.errors.phone}</div>
                                                    )}
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">Email (Optional)</label>
                                                    <input
                                                        type="email"
                                                        value={guardianCreate.data.email}
                                                        onChange={(e) => guardianCreate.setData("email", e.target.value)}
                                                        className="w-full bg-white border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                                                    />
                                                    {guardianCreate.errors.email && (
                                                        <div className="mt-1 text-xs font-medium text-red-500">{guardianCreate.errors.email}</div>
                                                    )}
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <button
                                                        type="submit"
                                                        disabled={guardianCreate.processing}
                                                        className="px-6 py-2 text-sm text-white bg-[#0F2847] rounded-lg hover:bg-slate-700 disabled:opacity-50 font-semibold transition"
                                                    >
                                                        {guardianCreate.processing ? "Creating..." : "Create Guardian"}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end pt-2">
                                <Link
                                    href={route("school.students.index")}
                                    className="px-4 py-2 text-sm text-gray-600 transition bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* ------------ STEP 2 ------------ */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Student Information</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Fill in the student details and save.
                                </p>
                            </div>

                            {/* Selected guardian card */}
                            {selectedGuardian ? (
                                <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">Guardian</div>
                                            <div className="mt-1 text-sm text-gray-700">
                                                {selectedGuardian.name} • {selectedGuardian.phone}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="px-4 py-2 text-sm text-gray-600 transition bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                                        >
                                            Change
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 border border-red-200 rounded-xl bg-red-50 text-sm text-red-700">
                                    Please complete Step 1 (Guardian Verification) first.
                                </div>
                            )}

                            <form onSubmit={onSubmitStudent} className="space-y-6">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        value={studentForm.data.full_name}
                                        onChange={(e) => studentForm.setData("full_name", e.target.value)}
                                        className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                                        required
                                    />
                                    {studentForm.errors.full_name && (
                                        <div className="mt-1 text-xs font-medium text-red-500">{studentForm.errors.full_name}</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Student Civil / Code</label>
                                    <input
                                        value={studentForm.data.student_code}
                                        onChange={(e) => studentForm.setData("student_code", e.target.value)}
                                        className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                                        required
                                    />
                                    {studentForm.errors.student_code && (
                                        <div className="mt-1 text-xs font-medium text-red-500">{studentForm.errors.student_code}</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Classroom</label>
                                    <select
                                        value={studentForm.data.classroom_id}
                                        onChange={(e) => studentForm.setData("classroom_id", e.target.value)}
                                        className="w-full bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:ring-[#FBBF24] focus:border-[#FBBF24] transition"
                                        required
                                    >
                                        <option value="" disabled>
                                            Select a classroom
                                        </option>
                                        {classrooms.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    {studentForm.errors.classroom_id && (
                                        <div className="mt-1 text-xs font-medium text-red-500">{studentForm.errors.classroom_id}</div>
                                    )}
                                </div>

                                {studentForm.errors.guardian_id && (
                                    <div className="text-xs font-medium text-red-500">{studentForm.errors.guardian_id}</div>
                                )}

                                <div className="flex items-center justify-end pt-4 space-x-4">
                                    <Link
                                        href={route("school.students.index")}
                                        className="px-4 py-2 text-sm text-gray-600 transition bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={studentForm.processing || !selectedGuardian}
                                        className="px-6 py-2 text-sm text-white bg-[#0F2847] rounded-lg hover:bg-slate-700 disabled:opacity-50 font-semibold transition"
                                    >
                                        {studentForm.processing ? "Saving..." : "Save Student"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
