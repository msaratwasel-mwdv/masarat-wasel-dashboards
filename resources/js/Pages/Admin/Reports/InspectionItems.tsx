import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";

interface InspectionItem {
  id: number;
  name: string;
  is_active: boolean;
  order_index: number;
}

export default function InspectionItems({ items }: { items: InspectionItem[] }) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);

  const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
    name: "",
    is_active: true,
    order_index: 0,
  });

  const openModal = (item?: InspectionItem) => {
    if (item) {
      setEditingItem(item);
      setData({
        name: item.name,
        is_active: item.is_active,
        order_index: item.order_index,
      });
    } else {
      setEditingItem(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      put(route("admin.inspection-items.update", editingItem.id), {
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("admin.inspection-items.store"), {
        onSuccess: () => closeModal(),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm(isRTL ? "هل أنت متأكد من الحذف؟" : "Are you sure?")) {
      destroy(route("admin.inspection-items.destroy", id));
    }
  };

  const toggleActive = (item: InspectionItem) => {
    router.put(route("admin.inspection-items.update", item.id), {
      name: item.name,
      order_index: item.order_index,
      is_active: !item.is_active,
    }, { preserveScroll: true });
  };

  return (
    <AuthenticatedLayout
      header={<h2 className={`font-bold text-xl ${isDark ? "text-gray-200" : "text-gray-800"}`}>{isRTL ? "إدارة بنود الفحص" : "Checklist Manager"}</h2>}
    >
      <Head title={isRTL ? "إدارة بنود الفحص" : "Checklist Manager"} />

      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-between items-center text-right">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-brand-dark"}`}>
                {isRTL ? "بنود الفحص الميداني" : "Field Inspection Items"}
              </h1>
              <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {isRTL ? "إدارة الأسئلة والبنود التي تظهر في تطبيق المشرف الميداني" : "Manage checklist items shown in the Field Supervisor app"}
              </p>
            </div>
            <PrimaryButton
              onClick={() => openModal()}
              className="bg-brand-yellow text-brand-dark hover:bg-yellow-500 font-bold"
            >
              {isRTL ? "+ إضافة بند جديد" : "+ Add New Item"}
            </PrimaryButton>
          </div>

          <div className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} overflow-hidden shadow-sm sm:rounded-2xl border p-4`}>
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
                <thead className={isDark ? "bg-gray-900/50" : "bg-gray-50"}>
                  <tr>
                    <th className={`px-4 py-3 text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase ${isRTL ? "text-right" : "text-left"}`}>#</th>
                    <th className={`px-4 py-3 text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "اسم البند" : "Item Name"}</th>
                    <th className={`px-4 py-3 text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase text-center`}>{isRTL ? "الحالة" : "Status"}</th>
                    <th className={`px-4 py-3 text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase text-center`}>{isRTL ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className={`${isDark ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`}>
                  {items.map((item, index) => (
                    <tr key={item.id} className={isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}>
                      <td className="px-4 py-3 text-sm font-medium">{item.order_index}</td>
                      <td className="px-4 py-3 text-sm font-bold">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() => toggleActive(item)}
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            item.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {item.is_active ? (isRTL ? "نشط" : "Active") : (isRTL ? "معطل" : "Inactive")}
                        </button>
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${isRTL ? "text-left" : "text-right"}`}>
                        <div className={`flex gap-2 ${isRTL ? "justify-start" : "justify-end"}`}>
                            <button
                              onClick={() => openModal(item)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                isDark
                                  ? "bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/60"
                                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                              }`}
                            >
                              {isRTL ? "تعديل" : "Edit"}
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                isDark
                                  ? "bg-red-900/30 text-red-400 hover:bg-red-900/60"
                                  : "bg-red-50 text-red-700 hover:bg-red-100"
                              }`}
                            >
                              {isRTL ? "حذف" : "Delete"}
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-500">
                        {isRTL ? "لا توجد بنود حالياً" : "No items found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all`}>
            <div className={`px-6 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-100"} flex justify-between items-center`}>
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {editingItem ? (isRTL ? "تعديل البند" : "Edit Item") : (isRTL ? "إضافة بند جديد" : "Add New Item")}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={`p-6 dir-${isRTL ? "rtl" : "ltr"}`}>
              <div className="space-y-4">
                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel value={isRTL ? "اسم البند (مثال: أحزمة الأمان)" : "Item Name"} />
                  <TextInput
                    type="text"
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    className="mt-1 block w-full"
                    required
                  />
                  <InputError message={errors.name} className="mt-2" />
                </div>

                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel value={isRTL ? "الترتيب (للعرض)" : "Order Index"} />
                  <TextInput
                    type="number"
                    value={data.order_index}
                    onChange={(e) => setData("order_index", parseInt(e.target.value))}
                    className="mt-1 block w-full"
                  />
                </div>

                <div className={`flex items-center ${isRTL ? "text-right" : ""}`}>
                  <input
                    type="checkbox"
                    checked={data.is_active}
                    onChange={(e) => setData("is_active", e.target.checked)}
                    className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded shadow-sm"
                  />
                  <span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} ${isRTL ? "mr-2 ml-0" : ""}`}>
                    {isRTL ? "تفعيل البند" : "Active"}
                  </span>
                </div>
              </div>

              <div className={`mt-6 flex gap-3 ${isRTL ? "flex-row-reverse" : "justify-end"}`}>
                <SecondaryButton onClick={closeModal}>
                  {isRTL ? "إلغاء" : "Cancel"}
                </SecondaryButton>
                <PrimaryButton
                  disabled={processing}
                  className="bg-brand-dark hover:bg-brand text-white"
                >
                  {isRTL ? "حفظ" : "Save"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

    </AuthenticatedLayout>
  );
}
