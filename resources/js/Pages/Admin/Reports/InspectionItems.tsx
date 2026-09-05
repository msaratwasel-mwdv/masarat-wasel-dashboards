import React, { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { 
    ClipboardCheck, 
    Plus, 
    Trash2, 
    Edit3, 
    Power, 
    ChevronRight,
    Search,
    Filter,
    ListOrdered,
    LayoutGrid,
    CheckCircle2,
    XCircle,
    MoreHorizontal
} from "lucide-react";
import { 
    DS_pageWrapper, 
    DS_card, 
    DS_pageTitle, 
    DS_statCard, 
    DS_statIcon, 
    DS_statLabel, 
    DS_statValue2, 
    DS_badge,
    DS_btnPrimary,
    DS_modalContainer,
    DS_modalTitle,
    DS_btnGold,
    DS_btnSecondary
} from "@/lib/DS";
import BaseDataTable, { type PaginationMeta } from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import ConfirmationModal from "@/Components/ConfirmationModal";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";

interface InspectionItem {
  id: number;
  name: string;
  is_active: boolean;
  order_index: number;
}

interface Props {
    items: InspectionItem[];
    auth?: any;
}

export default function InspectionItems({ items, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [search, setSearch] = useState("");

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

  const isUnchanged = Boolean(
    editingItem !== null &&
    data.name.trim() === editingItem.name.trim() &&
    Boolean(data.is_active) === Boolean(editingItem.is_active) &&
    Number(data.order_index) === Number(editingItem.order_index)
  );

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

  const handleDelete = () => {
    if (itemToDelete) {
      destroy(route("admin.inspection-items.destroy", itemToDelete), {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        },
      });
    }
  };

  const toggleActive = (item: InspectionItem) => {
    router.put(route("admin.inspection-items.update", item.id), {
      name: item.name,
      order_index: item.order_index,
      is_active: !item.is_active,
    }, { preserveScroll: true });
  };

  const columnHelper = createColumnHelper<InspectionItem>();

  const columns = useMemo(() => [
    columnHelper.accessor("order_index", {
        header: "#",
        cell: (info) => <span className="font-black text-slate-400">#{info.getValue()}</span>,
    }),
    columnHelper.accessor("name", {
      header: isRTL ? "اسم البند" : "Item Name",
      cell: (info) => (
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-navy/5 flex items-center justify-center text-brand-navy border border-brand-navy/10">
                <ListOrdered size={16} />
            </div>
            <span className="font-black text-slate-800 dark:text-white leading-tight">{info.getValue()}</span>
        </div>
      )
    }),
    columnHelper.accessor("is_active", {
      header: isRTL ? "الحالة" : "Status",
      cell: (info) => (
        <button
          onClick={() => toggleActive(info.row.original)}
          className={DS_badge(info.getValue() ? "green" : "red")}
        >
          {info.getValue() ? (isRTL ? "نشط" : "Active") : (isRTL ? "معطل" : "Inactive")}
        </button>
      )
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <div className="flex justify-end gap-2">
            <button
                onClick={() => openModal(info.row.original)}
                className="p-2 text-brand-navy hover:bg-brand-navy/5 rounded-lg transition-colors"
            >
                <Edit3 size={18} />
            </button>
            <button
                onClick={() => {
                    setItemToDelete(info.row.original.id);
                    setIsDeleteModalOpen(true);
                }}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            >
                <Trash2 size={18} />
            </button>
        </div>
      )
    })
  ], [isRTL]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    return items.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title={isRTL ? "إدارة بنود الفحص" : "Checklist Manager"} />

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex flex-col">
                <h1 className={DS_pageTitle}>
                    {isRTL ? "بنود الفحص الميداني" : "Field Inspection Items"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {items.length} {isRTL ? "بند مسجل" : "Total Items Registered"}
                    </span>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Link
                    href={route('admin.inspection-logs.index')}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all shadow-sm w-full sm:w-auto"
                >
                    <ChevronRight size={16} className={isRTL ? "rotate-0" : "rotate-180"} />
                    {isRTL ? "العودة للسجلات" : "Back to Logs"}
                </Link>
                <button
                    onClick={() => openModal()}
                    className={`${DS_btnGold} !w-full sm:!w-auto justify-center`}
                >
                    <Plus size={16} />
                    {isRTL ? "إضافة بند جديد" : "Add New Item"}
                </button>
            </div>
        </div>

        {/* Info Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
             <div className={DS_statCard('navy')}>
                <div className={DS_statIcon('navy')}><LayoutGrid size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "إجمالي البنود" : "Total Items"}</p>
                    <p className={DS_statValue2('navy')}>{items.length}</p>
                </div>
            </div>
            <div className={DS_statCard('green')}>
                <div className={DS_statIcon('green')}><Power size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "البنود النشطة" : "Active Items"}</p>
                    <p className={DS_statValue2('green')}>{items.filter(i => i.is_active).length}</p>
                </div>
            </div>
            <div className={DS_statCard('gold')}>
                <div className={DS_statIcon('gold')}><ListOrdered size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "آخر ترتيب" : "Max Order"}</p>
                    <p className={DS_statValue2('gold')}>{Math.max(0, ...items.map(i => i.order_index))}</p>
                </div>
            </div>
        </div>

        {/* Main Table */}
        <div className={DS_card}>
            <BaseDataTable<InspectionItem>
                columns={columns}
                data={filteredItems}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder={isRTL ? "ابحث عن اسم البند..." : "Search item name..."}
                title={isRTL ? "قائمة بنود الفحص" : "Inspection Items List"}
                subtitle={isRTL ? "إدارة وتعديل الأسئلة التي تظهر للمشرفين في التطبيق" : "Manage and edit checklist questions shown to supervisors"}
            />
        </div>

        {/* Create/Edit Modal */}
        <Modal show={isModalOpen} onClose={closeModal} maxWidth="md">
            <div className="flex flex-col overflow-hidden shadow-2xl rounded-2xl">
                
                {/* Modal Header - Standard Corporate Style */}
                <div className={`px-8 py-6 bg-[#0f2044] flex items-center justify-between flex-shrink-0 text-white ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 text-brand-yellow">
                            <ListOrdered className="w-6 h-6" />
                        </div>
                        <div className={isRTL ? "text-right" : ""}>
                            <h2 className="text-xl font-bold text-white">
                                {editingItem ? (isRTL ? "تعديل بند الفحص" : "Edit Inspection Item") : (isRTL ? "إضافة بند فحص جديد" : "Add New Item")}
                            </h2>
                            <p className="mt-1 text-xs text-blue-100 font-bold opacity-80">
                                {isRTL ? "تحديث بيانات الشيك لست للمشرفين" : "Update checklist data for supervisors"}
                            </p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={closeModal} 
                        className="p-2 transition-colors rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className={`p-8 bg-white dark:bg-[#111827] space-y-6 ${isRTL ? "text-right" : ""}`}>
                    <form id="inspection-item-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <InputLabel 
                                htmlFor="name" 
                                value={isRTL ? "اسم البند" : "Item Name"} 
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2" 
                            />
                            <TextInput
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 rounded-xl font-bold focus:ring-brand-gold/20 focus:border-brand-gold transition-all"
                                placeholder={isRTL ? "مثال: سلامة أحزمة الأمان" : "e.g. Seatbelt Safety"}
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel 
                                htmlFor="order_index" 
                                value={isRTL ? "الترتيب (للعرض)" : "Display Order"} 
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2" 
                            />
                            <TextInput
                                id="order_index"
                                type="number"
                                value={data.order_index}
                                onChange={(e) => setData("order_index", parseInt(e.target.value))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 rounded-xl font-bold focus:ring-brand-gold/20 focus:border-brand-gold transition-all"
                                required
                            />
                            <InputError message={errors.order_index} className="mt-1" />
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                             <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={data.is_active}
                                    onChange={(e) => setData("is_active", e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                    {isRTL ? "تفعيل البند" : "Active Item"}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                    {isRTL ? "سيظهر هذا البند في تطبيق المشرف" : "This item will appear in supervisor app"}
                                </span>
                             </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className={`px-8 py-6 border-t flex items-center justify-between flex-shrink-0 ${isDark ? "border-gray-800 bg-[#0f172a]" : "border-gray-100 bg-gray-50"} ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${processing ? "bg-brand-gold animate-pulse" : "bg-emerald-500"}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {processing ? (isRTL ? "جارِ الحفظ..." : "Processing...") : (isRTL ? "جاهز للحفظ" : "Ready to save")}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className={DS_btnSecondary}
                        >
                            {isRTL ? "إلغاء" : "Cancel"}
                        </button>
                        <button
                            type="submit"
                            form="inspection-item-form"
                            disabled={processing || isUnchanged}
                            className={`${DS_btnGold} px-8 ${(processing || isUnchanged) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {editingItem ? (isRTL ? "تحديث" : "Update") : (isRTL ? "إضافة" : "Create")}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmationModal
            show={isDeleteModalOpen}
            onClose={() => {
                if (!processing) {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                }
            }}
            onConfirm={handleDelete}
            processing={processing}
            title={isRTL ? "حذف بند الفحص" : "Delete Item"}
            message={isRTL ? "هل أنت متأكد من رغبتك في حذف هذا البند؟ قد يؤثر ذلك على السجلات القديمة." : "Are you sure you want to delete this item? This may affect historical logs."}
            confirmText={isRTL ? "حذف" : "Delete"}
            cancelText={isRTL ? "إلغاء" : "Cancel"}
            type="danger"
        />

      </div>
    </AuthenticatedLayout>
  );
}
