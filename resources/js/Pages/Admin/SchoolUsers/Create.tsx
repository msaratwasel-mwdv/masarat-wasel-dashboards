import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";

// تعريف نوع المدرسة لاستقبالها
interface School {
  id: number;
  name: string;
}

export default function CreateSchoolAdmin({ school }: { school: School }) {
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    // لاحظ كيف نرسل الـ ID في الرابط
    post(route("admin.schools.users.store", school.id));
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800">
          Assign School Admin
        </h2>
      }
    >
      <Head title={`Add Manager to ${school.name}`} />

      <div className="max-w-2xl mx-auto mt-10 text-left">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-brand-dark">New Manager</h1>
            <p className="text-gray-500 mt-1">
              Assigning a manager to:{" "}
              <span className="text-white font-bold bg-brand-primary px-2 py-1 rounded text-xs">
                {school.name}
              </span>
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-yellow focus:ring-brand-yellow"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
              />
              {errors.name && (
                <div className="text-red-500 text-xs mt-1">{errors.name}</div>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-yellow focus:ring-brand-yellow"
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                />
                {errors.email && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.email}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-yellow focus:ring-brand-yellow"
                  value={data.phone}
                  onChange={(e) => setData("phone", e.target.value)}
                  placeholder="9665..."
                />
                {errors.phone && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-yellow focus:ring-brand-yellow"
                  value={data.password}
                  onChange={(e) => setData("password", e.target.value)}
                />
                {errors.password && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.password}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-yellow focus:ring-brand-yellow"
                  value={data.password_confirmation}
                  onChange={(e) =>
                    setData("password_confirmation", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Link
                href={route("admin.schools.index")}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 mr-2"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
