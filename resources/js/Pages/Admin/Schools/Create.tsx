import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";

export default function CreateSchool() {
  // إعداد النموذج للتعامل مع البيانات
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    location: "",
    status: "Active",
    has_transport: true,
    has_attendance: true,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    // إرسال البيانات للباك-إند
    post(route("admin.schools.store"));
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Register New School
        </h2>
      }
    >
      <Head title="Register School" />

      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-2xl border border-gray-100 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-brand-dark mb-2">
              School Registration
            </h1>
            <p className="text-gray-500 text-sm">
              Fill in the details to add a new partner school to the system.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* School Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Name
              </label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
                className="w-full rounded-lg border-gray-300 focus:border-brand-yellow focus:ring-brand-yellow shadow-sm"
                placeholder="e.g. Horizon International Academy"
              />
              {errors.name && (
                <div className="text-red-500 text-xs mt-1">{errors.name}</div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location / City
              </label>
              <input
                type="text"
                value={data.location}
                onChange={(e) => setData("location", e.target.value)}
                className="w-full rounded-lg border-gray-300 focus:border-brand-yellow focus:ring-brand-yellow shadow-sm"
                placeholder="e.g. Dubai"
              />
              {errors.location && (
                <div className="text-red-500 text-xs mt-1">
                  {errors.location}
                </div>
              )}
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={data.status}
                onChange={(e) => setData("status", e.target.value)}
                className="w-full rounded-lg border-gray-300 focus:border-brand-yellow focus:ring-brand-yellow shadow-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Services (Checkboxes) */}
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-gray-700">
                Enabled Services
              </p>

              <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.has_transport}
                  onChange={(e) => setData("has_transport", e.target.checked)}
                  className="rounded text-brand-yellow focus:ring-brand-yellow w-5 h-5"
                />
                <span className="text-gray-700 font-medium">
                  Transport & Tracking System
                </span>
              </label>

              <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.has_attendance}
                  onChange={(e) => setData("has_attendance", e.target.checked)}
                  className="rounded text-green-500 focus:ring-green-500 w-5 h-5"
                />
                <span className="text-gray-700 font-medium">
                  Attendance System
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
              <Link
                href={route("admin.schools.index")}
                className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="px-8 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-all shadow-md"
              >
                {processing ? "Saving..." : "Save School"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
