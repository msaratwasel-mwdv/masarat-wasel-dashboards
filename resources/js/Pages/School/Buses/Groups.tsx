import React, { useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
}

interface BusGroup {
  id: number;
  name: string;
  bus_id: number;
  bus_number: string | null;
  supervisor_name: string | null;
  supervisor_phone: string | null;
  morning_students_count: number;
  afternoon_students_count: number;
}

interface PageProps {
  groups: BusGroup[];
  buses: Bus[];
  auth: any;
  flash?: {
    success?: string;
    error?: string;
  };
}

export default function Groups({ groups, buses, auth, flash }: PageProps) {
  const { t, isRtl } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<BusGroup | null>(null);

  const {
    data,
    setData,
    post,
    put,
    delete: destroy,
    processing,
    errors,
    reset,
    clearErrors,
  } = useForm({
    name: "",
    bus_id: "",
  });

  const openAddModal = () => {
    reset();
    clearErrors();
    setIsAddModalOpen(true);
  };

  const openEditModal = (group: BusGroup) => {
    reset();
    clearErrors();
    setEditingGroup(group);
    setData({
      name: group.name,
      bus_id: group.bus_id.toString(),
    });
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("school.bus-groups.store"), {
      onSuccess: () => {
        setIsAddModalOpen(false);
        reset();
      },
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    put(route("school.bus-groups.update", editingGroup.id), {
      onSuccess: () => {
        setIsEditModalOpen(false);
        reset();
      },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm(t("Are you sure you want to delete this group?"))) {
      destroy(route("school.bus-groups.destroy", id));
    }
  };

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
          {t("Bus Groups")} 🚌
        </h2>
      }
    >
      <Head title={t("Bus Groups")} />

      <div className="p-6 mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {t("Bus Groups")}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t(
                "Manage bus groups, assign buses, and view supervisor details"
              )}
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold transition-all shadow-lg rounded-xl bg-brand-yellow text-slate-900 shadow-brand-yellow/20 hover:shadow-brand-yellow/40 hover:-translate-y-0.5"
          >
            + {t("Add Group")}
          </button>
        </div>

        {flash?.success && (
          <div className="p-4 mb-6 border rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400">
            {flash.success}
          </div>
        )}

        <div className="overflow-hidden bg-white border shadow-sm rounded-2xl dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left align-middle rtl:text-right">
              <thead className="text-xs tracking-wider uppercase bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-bold">{t("Group Name")}</th>
                  <th className="px-6 py-4 font-bold">{t("Bus Number")}</th>
                  <th className="px-6 py-4 font-bold">
                    {t("Supervisor Name")}
                  </th>
                  <th className="px-6 py-4 font-bold">
                    {t("Supervisor Phone")}
                  </th>
                  <th className="px-6 py-4 font-bold">
                    {t("Morning Students")}
                  </th>
                  <th className="px-6 py-4 font-bold">
                    {t("Afternoon Students")}
                  </th>
                  <th className="px-6 py-4 font-bold text-center">
                    {t("Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {groups.length > 0 ? (
                  groups.map((group) => (
                    <tr
                      key={group.id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                        {group.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                          {group.bus_number || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {group.supervisor_name || "-"}
                      </td>
                      <td
                        className="px-6 py-4 text-slate-600 dark:text-slate-300"
                        dir="ltr"
                      >
                        {group.supervisor_phone || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-brand-yellow">
                          {group.morning_students_count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-brand-yellow">
                          {group.afternoon_students_count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openEditModal(group)}
                            className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                          >
                            {t("Edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(group.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            {t("Delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      {t("No bus groups found")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white shadow-xl rounded-2xl dark:bg-slate-800">
            <h3 className="mb-4 text-xl font-bold text-slate-800 dark:text-white">
              {t("Add Group")}
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("Group Name")}
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  className="w-full rounded-xl border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-yellow focus:border-brand-yellow"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("Bus")}
                </label>
                <select
                  value={data.bus_id}
                  onChange={(e) => setData("bus_id", e.target.value)}
                  className="w-full rounded-xl border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-yellow focus:border-brand-yellow"
                  required
                >
                  <option value="">{t("Select Bus")}</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bus_number}
                    </option>
                  ))}
                </select>
                {errors.bus_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.bus_id}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium transition-colors bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 text-sm font-bold transition-colors bg-brand-yellow text-slate-900 rounded-xl hover:bg-yellow-500 disabled:opacity-50"
                >
                  {t("Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white shadow-xl rounded-2xl dark:bg-slate-800">
            <h3 className="mb-4 text-xl font-bold text-slate-800 dark:text-white">
              {t("Edit Group")}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("Group Name")}
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  className="w-full rounded-xl border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-yellow focus:border-brand-yellow"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("Bus")}
                </label>
                <select
                  value={data.bus_id}
                  onChange={(e) => setData("bus_id", e.target.value)}
                  className="w-full rounded-xl border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-yellow focus:border-brand-yellow"
                  required
                >
                  <option value="">{t("Select Bus")}</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bus_number}
                    </option>
                  ))}
                </select>
                {errors.bus_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.bus_id}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium transition-colors bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 text-sm font-bold transition-colors bg-brand-yellow text-slate-900 rounded-xl hover:bg-yellow-500 disabled:opacity-50"
                >
                  {t("Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SchoolAuthenticatedLayout>
  );
}
