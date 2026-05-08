import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { motion } from "framer-motion";
import {
    Plus,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle,
    Users,
    Activity,
    PackageOpen,
    ShieldCheck,
    Smartphone,
    Bell,
    Key,
    LifeBuoy,
    Bus
} from "lucide-react";
import { useTheme } from "@/Contexts/ThemeContext";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { useForm } from "@inertiajs/react";

export default function PlansIndex({ plans }: any) {
    const { isRTL } = useTheme();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        price_per_student: 0,
        max_buses: '',
        has_driver_app: false,
        has_parent_app: false,
        has_supervisor_app: false,
        notifications_limit: 'unlimited',
        has_reports: false,
        has_api_access: false,
        has_dedicated_support: false,
        badge: '',
        is_active: true
    });

    const openEditModal = (plan: any) => {
        clearErrors();
        setEditingPlan(plan);
        setData({
            name: plan.name || '',
            description: plan.description || '',
            price_per_student: plan.price_per_student || 0,
            max_buses: plan.max_buses || '',
            has_driver_app: !!plan.has_driver_app,
            has_parent_app: !!plan.has_parent_app,
            has_supervisor_app: !!plan.has_supervisor_app,
            notifications_limit: plan.notifications_limit || 'unlimited',
            has_reports: !!plan.has_reports,
            has_api_access: !!plan.has_api_access,
            has_dedicated_support: !!plan.has_dedicated_support,
            badge: plan.badge || '',
            is_active: !!plan.is_active
        });
    };

    const openCreateModal = () => {
        clearErrors();
        reset();
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setEditingPlan(null);
        setIsCreateModalOpen(false);
        reset();
        clearErrors();
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Convert empty string bounds to null for validation
        const submitData = {
            ...data,
            max_buses: data.max_buses === '' ? null : data.max_buses,
        };

        if (editingPlan) {
            router.put(route('admin.plans.update', editingPlan.id), submitData, {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.plans.store'), {
                onSuccess: () => closeModal(),
                data: submitData
            });
        }
    };

    const toggleStatus = (plan: any) => {
        if (confirm(isRTL ? "هل أنت متأكد من تغيير حالة الخطة؟" : "Are you sure you want to change the plan status?")) {
            router.post(route("admin.plans.toggle", plan.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold leading-tight text-slate-800">
                    {isRTL ? 'إدارة خطط الاشتراك' : 'Subscription Plans Management'}
                </h2>
            }
        >
            <Head title={isRTL ? "خطط الاشتراك" : "Subscription Plans"} />

            <div className={`py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-800">
                                {isRTL ? 'الخطط المتاحة' : 'Available Plans'}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {isRTL ? 'قم بإدارة وتعديل خطط الاشتراكات للمدارس' : 'Manage and edit school subscription plans'}
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className={`bg-brand-navy hover:bg-brand-navy/90 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-navy/20 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}
                        >
                            {isRTL ? 'إضافة خطة جديدة' : 'Add New Plan'}
                            <Plus size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan: any) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white rounded-3xl p-6 border-2 transition-all ${plan.is_active ? "border-brand-navy/10 shadow-xl shadow-brand-navy/5" : "border-slate-200 opacity-70 grayscale"}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        {plan.badge && (
                                            <span className="inline-block px-3 py-1 bg-brand-yellow/20 text-brand-dark text-xs font-black rounded-full mb-2">
                                                {plan.badge}
                                            </span>
                                        )}
                                        <h4 className="text-xl font-black text-slate-800">
                                            {plan.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                            {plan.description}
                                        </p>
                                    </div>
                                    <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                                        <button
                                            onClick={() => openEditModal(plan)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 focus:outline-none transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <div className="px-2 flex items-center justify-center border-s border-slate-200">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={plan.is_active}
                                                onClick={() => toggleStatus(plan)}
                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 ${
                                                    plan.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                                }`}
                                            >
                                                <span className="sr-only">Toggle status</span>
                                                <span
                                                    className={`pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                        plan.is_active 
                                                            ? (isRTL ? '-translate-x-4' : 'translate-x-4') 
                                                            : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-1 my-6" dir="ltr">
                                    <span className="text-4xl font-black text-brand-navy">
                                        ${plan.price_per_student}
                                    </span>
                                    <span className="text-sm font-bold text-slate-400">
                                        {isRTL ? '/ طالب / شهر' : '/ student / month'}
                                    </span>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex items-center justify-between border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-400">
                                                {isRTL ? 'الاشتراكات النشطة' : 'Active Subscriptions'}
                                            </div>
                                            <div className="font-black text-slate-700">
                                                {plan.subscriptions_count} {isRTL ? 'مدرسة' : 'Schools'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <FeatureItem
                                        active={true}
                                        icon={<Bus size={14} />}
                                        text={
                                            plan.max_buses
                                                ? (isRTL ? `حتى ${plan.max_buses} حافلات` : `Up to ${plan.max_buses} buses`)
                                                : (isRTL ? "حافلات غير محدودة" : "Unlimited Buses")
                                        }
                                    />
                                    <FeatureItem
                                        active={plan.has_driver_app}
                                        icon={<Smartphone size={14} />}
                                        text={isRTL ? "تطبيق السائق" : "Driver App"}
                                    />
                                    <FeatureItem
                                        active={plan.has_parent_app}
                                        icon={<Smartphone size={14} />}
                                        text={isRTL ? "تطبيق ولي الأمر" : "Parent App"}
                                    />
                                    <FeatureItem
                                        active={plan.has_supervisor_app}
                                        icon={<Smartphone size={14} />}
                                        text={isRTL ? "تطبيق المشرفة" : "Supervisor App"}
                                    />
                                    <FeatureItem
                                        active={plan.has_reports}
                                        icon={<Activity size={14} />}
                                        text={isRTL ? "تقارير متقدمة" : "Advanced Reports"}
                                    />
                                    <FeatureItem
                                        active={!!plan.notifications_limit}
                                        icon={<Bell size={14} />}
                                        text={
                                            plan.notifications_limit ===
                                            "unlimited"
                                                ? (isRTL ? "إشعارات لا محدودة" : "Unlimited Notifications")
                                                : (isRTL ? "إشعارات النظام" : "System Notifications")
                                        }
                                    />
                                    <FeatureItem
                                        active={plan.has_api_access}
                                        icon={<Key size={14} />}
                                        text={isRTL ? "وصول API مفتوح" : "Open API Access"}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal show={isCreateModalOpen || editingPlan !== null} onClose={closeModal} maxWidth="2xl">
                <form onSubmit={submitForm} className="p-6">
                    <div className={`flex justify-between items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <h2 className="text-xl font-black text-slate-800">
                            {editingPlan ? (isRTL ? 'تعديل الخطة' : 'Edit Plan') : (isRTL ? 'إضافة خطة جديدة' : 'Add New Plan')}
                        </h2>
                        <button type="button" onClick={closeModal} className="text-slate-400 hover:text-rose-500 transition-colors">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" dir={isRTL ? 'rtl' : 'ltr'}>
                        <div className="col-span-full">
                            <InputLabel value={isRTL ? "اسم الخطة" : "Plan Name"} />
                            <TextInput 
                                value={data.name} 
                                onChange={e => setData('name', e.target.value)} 
                                className="w-full mt-1" 
                                required 
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div className="col-span-full">
                            <InputLabel value={isRTL ? "الوصف" : "Description"} />
                            <TextInput 
                                value={data.description} 
                                onChange={e => setData('description', e.target.value)} 
                                className="w-full mt-1" 
                                required 
                            />
                            <InputError message={errors.description} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value={isRTL ? "سعر الطالب" : "Student Price"} />
                            <TextInput 
                                type="number" 
                                step="0.01" 
                                value={data.price_per_student} 
                                onChange={e => setData('price_per_student', Number(e.target.value))} 
                                className="w-full mt-1" 
                                required 
                            />
                            <InputError message={errors.price_per_student} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value={isRTL ? "الحد الأقصى للحافلات" : "Max Buses"} />
                            <TextInput 
                                type="number" 
                                value={data.max_buses} 
                                onChange={e => setData('max_buses', e.target.value)} 
                                className="w-full mt-1" 
                                placeholder={isRTL ? "اتركه فارغاً لغير محدود" : "Leave empty for unlimited"}
                            />
                            <InputError message={errors.max_buses} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value={isRTL ? "الوسام (شارة)" : "Badge (e.g. Popular)"} />
                            <TextInput 
                                value={data.badge} 
                                onChange={e => setData('badge', e.target.value)} 
                                className="w-full mt-1" 
                            />
                            <InputError message={errors.badge} className="mt-1" />
                        </div>

                        {/* Features Toggles */}
                        <div className="col-span-full mt-4">
                            <h4 className="font-bold text-slate-700 mb-3">{isRTL ? 'مميزات الخطة' : 'Plan Features'}</h4>
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                                {[
                                    { id: 'has_driver_app', label: isRTL ? 'تطبيق السائق' : 'Driver App' },
                                    { id: 'has_parent_app', label: isRTL ? 'تطبيق ولي الأمر' : 'Parent App' },
                                    { id: 'has_supervisor_app', label: isRTL ? 'تطبيق المشرفة' : 'Supervisor App' },
                                    { id: 'has_reports', label: isRTL ? 'تقارير متقدمة' : 'Advanced Reports' },
                                    { id: 'has_api_access', label: isRTL ? 'تكامل API' : 'API Access' },
                                    { id: 'has_dedicated_support', label: isRTL ? 'دعم فني مخصص' : 'Dedicated Support' },
                                ].map((feat) => (
                                    <label key={feat.id} className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={!!data[feat.id as keyof typeof data]}
                                            onChange={(e) => setData(feat.id as any, e.target.checked)}
                                            className="rounded text-brand-navy focus:ring-brand-navy text-sm border-slate-300"
                                        />
                                        <span className="text-sm font-bold text-slate-600 block w-full truncate">
                                            {feat.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={`flex gap-3 pt-4 border-t border-slate-100 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
                        <PrimaryButton disabled={processing} className="px-8 shadow-md">
                            {isRTL ? 'حفظ الخطة' : 'Save Plan'}
                        </PrimaryButton>
                        <SecondaryButton onClick={closeModal}>
                            {isRTL ? 'إلغاء' : 'Cancel'}
                        </SecondaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

function FeatureItem({ active, text, icon }: any) {
    return (
        <div
            className={`flex items-center gap-3 text-sm font-bold ${active ? "text-slate-700" : "text-slate-300 line-through"}`}
        >
            <div
                className={`w-5 h-5 rounded flex items-center justify-center ${active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
            >
                {icon ? (
                    icon
                ) : active ? (
                    <CheckCircle2 size={12} />
                ) : (
                    <XCircle size={12} />
                )}
            </div>
            {text}
        </div>
    );
}
