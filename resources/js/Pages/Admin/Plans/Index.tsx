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
import ConfirmationModal from "@/Components/ConfirmationModal";
import { useForm } from "@inertiajs/react";
import OmaniRial from '@/Components/OmaniRial';

export default function PlansIndex({ plans }: any) {
    const { isRTL } = useTheme();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        name_ar: '',
        name_en: '',
        description: '',
        description_ar: '',
        description_en: '',
        price_per_student: 0,
        price_per_student_yearly: 0,
        max_buses: '',
        has_driver_app: false,
        has_parent_app: false,
        has_supervisor_app: false,
        notifications_limit: 'unlimited',
        has_reports: false,
        has_api_access: false,
        has_dedicated_support: false,
        badge: '',
        badge_ar: '',
        badge_en: '',
        is_active: true
    });

    const openEditModal = (plan: any) => {
        clearErrors();
        setEditingPlan(plan);
        setData({
            name: plan.name || '',
            name_ar: plan.name_ar || '',
            name_en: plan.name_en || '',
            description: plan.description || '',
            description_ar: plan.description_ar || '',
            description_en: plan.description_en || '',
            price_per_student: plan.price_per_student || 0,
            price_per_student_yearly: plan.price_per_student_yearly || 0,
            max_buses: plan.max_buses || '',
            has_driver_app: !!plan.has_driver_app,
            has_parent_app: !!plan.has_parent_app,
            has_supervisor_app: !!plan.has_supervisor_app,
            notifications_limit: plan.notifications_limit || 'unlimited',
            has_reports: !!plan.has_reports,
            has_api_access: !!plan.has_api_access,
            has_dedicated_support: !!plan.has_dedicated_support,
            badge: plan.badge || '',
            badge_ar: plan.badge_ar || '',
            badge_en: plan.badge_en || '',
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

    const [togglePlan, setTogglePlan] = useState<any>(null);
    const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const isUnchanged = Boolean(
        editingPlan !== null &&
        data.name_ar.trim() === (editingPlan.name_ar || '').trim() &&
        data.name_en.trim() === (editingPlan.name_en || '').trim() &&
        (data.description_ar || '').trim() === (editingPlan.description_ar || '').trim() &&
        (data.description_en || '').trim() === (editingPlan.description_en || '').trim() &&
        (data.badge_ar || '').trim() === (editingPlan.badge_ar || '').trim() &&
        (data.badge_en || '').trim() === (editingPlan.badge_en || '').trim() &&
        Number(data.price_per_student) === Number(editingPlan.price_per_student || 0) &&
        Number(data.price_per_student_yearly) === Number(editingPlan.price_per_student_yearly || 0) &&
        String(data.max_buses || '') === String(editingPlan.max_buses || '') &&
        data.has_driver_app === !!editingPlan.has_driver_app &&
        data.has_parent_app === !!editingPlan.has_parent_app &&
        data.has_supervisor_app === !!editingPlan.has_supervisor_app &&
        data.has_reports === !!editingPlan.has_reports &&
        data.has_api_access === !!editingPlan.has_api_access &&
        data.has_dedicated_support === !!editingPlan.has_dedicated_support
    );

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPlan && isUnchanged) return;
        
        // Auto-sync internal fields with English values to avoid redundancy in the UI
        data.name = data.name_en || data.name_ar || 'Plan';
        data.description = data.description_en || data.description_ar || '';
        data.badge = data.badge_en || data.badge_ar || '';

        if (editingPlan) {
            put(route("admin.plans.update", editingPlan.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route("admin.plans.store"), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmToggleStatus = (plan: any) => {
        setTogglePlan(plan);
        setIsToggleModalOpen(true);
    };

    const handleToggleConfirm = () => {
        if (!togglePlan) return;
        setIsToggling(true);
        router.post(route("admin.plans.toggle", togglePlan.id), {}, {
            onSuccess: () => {
                setIsToggleModalOpen(false);
                setTogglePlan(null);
            },
            onFinish: () => setIsToggling(false),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold leading-tight text-slate-800 dark:text-white">
                    {isRTL ? 'إدارة خطط الاشتراك' : 'Subscription Plans Management'}
                </h2>
            }
        >
            <Head title={isRTL ? "خطط الاشتراك" : "Subscription Plans"} />

            <div className={`py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">
                                {isRTL ? 'الخطط المتاحة' : 'Available Plans'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
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
                                className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 transition-all ${plan.is_active ? "border-brand-navy/10 dark:border-slate-800 shadow-xl shadow-brand-navy/5" : "border-slate-200 dark:border-slate-800 opacity-70 grayscale"}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        {plan.badge && (
                                            <span className="inline-block px-3 py-1 bg-brand-yellow/20 text-brand-dark dark:text-brand-yellow text-xs font-black rounded-full mb-2">
                                                {plan.badge}
                                            </span>
                                        )}
                                        <h4 className="text-xl font-black text-slate-800 dark:text-white">
                                            {isRTL ? (plan.name_ar || plan.name) : (plan.name_en || plan.name)}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                            {isRTL ? (plan.description_ar || plan.description) : (plan.description_en || plan.description)}
                                        </p>
                                    </div>
                                    <div className="flex bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-100 dark:border-slate-700">
                                        <button
                                            onClick={() => openEditModal(plan)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-md focus:outline-none transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <div className="px-2 flex items-center justify-center border-s border-slate-200 dark:border-slate-700">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={plan.is_active}
                                                onClick={() => confirmToggleStatus(plan)}
                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 ${
                                                    plan.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
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

                                <div className="my-6 space-y-1">
                                    <div className="flex items-center gap-1">
                                        <span className="text-3xl font-black text-brand-navy dark:text-brand-yellow">
                                            {plan.price_per_student_yearly}
                                        </span>
                                        <OmaniRial size="1.8rem" className="-translate-y-0.5" />
                                        <span className="text-xs font-bold text-slate-400">
                                            {isRTL ? '/ طالب / سنوي' : '/ student / yearly'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-60">
                                        <span className="text-sm font-black text-slate-500">
                                            {plan.price_per_student}
                                        </span>
                                        <OmaniRial size="1.1rem" className="-translate-y-0.5" />
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {isRTL ? '/ طالب / شهر' : '/ student / month'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 mb-6 flex items-center justify-between border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-600">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-400">
                                                {isRTL ? 'الاشتراكات النشطة' : 'Active Subscriptions'}
                                            </div>
                                            <div className="font-black text-slate-700 dark:text-slate-100">
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

            <Modal show={isCreateModalOpen || editingPlan !== null} onClose={closeModal} maxWidth="3xl">
                <form onSubmit={submitForm} className="p-0 overflow-hidden bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {/* Header */}
                    <div className={`bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-5 flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-navy/10 text-brand-navy dark:text-brand-yellow rounded-xl flex items-center justify-center">
                                <PackageOpen size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                                    {editingPlan ? (isRTL ? 'تعديل الباقة' : 'Edit Plan') : (isRTL ? 'إضافة باقة' : 'Add Plan')}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    {isRTL ? 'الأسماء، الأسعار والمميزات' : 'Names, pricing, and features'}
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={closeModal} className="text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-xl transition-all">
                            <XCircle size={22} />
                        </button>
                    </div>

                    <div className="p-6 max-h-[75vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
                        {/* Section 1: Basic Info */}
                        <div className="mb-6">
                            <h3 className="text-xs font-black text-brand-navy dark:text-brand-yellow uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-4 h-px bg-brand-navy/20 dark:bg-brand-yellow/20"></span>
                                {isRTL ? 'المعلومات والنصوص' : 'Content Info'}
                                <span className="flex-1 h-px bg-brand-navy/10 dark:bg-brand-yellow/10"></span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <InputLabel value={isRTL ? "الاسم (عربي)" : "Name (Arabic)"} className="text-[10px]" />
                                        <TextInput value={data.name_ar} onChange={e => setData('name_ar', e.target.value)} className="w-full mt-1 text-xs" required />
                                    </div>
                                    <div>
                                        <InputLabel value={isRTL ? "الاسم (إنجليزي)" : "Name (English)"} className="text-[10px]" />
                                        <TextInput value={data.name_en} onChange={e => setData('name_en', e.target.value)} className="w-full mt-1 text-xs" required />
                                    </div>
                                </div>

                                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <InputLabel value={isRTL ? "الوصف (عربي)" : "Desc (Arabic)"} className="text-[10px]" />
                                        <TextInput value={data.description_ar} onChange={e => setData('description_ar', e.target.value)} className="w-full mt-1 text-xs" />
                                    </div>
                                    <div>
                                        <InputLabel value={isRTL ? "الوصف (إنجليزي)" : "Desc (English)"} className="text-[10px]" />
                                        <TextInput value={data.description_en} onChange={e => setData('description_en', e.target.value)} className="w-full mt-1 text-xs" />
                                    </div>
                                </div>

                                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <InputLabel value={isRTL ? "الوسام (عربي)" : "Badge (Arabic)"} className="text-[10px]" />
                                        <TextInput value={data.badge_ar} onChange={e => setData('badge_ar', e.target.value)} className="w-full mt-1 text-xs" />
                                    </div>
                                    <div>
                                        <InputLabel value={isRTL ? "الوسام (إنجليزي)" : "Badge (English)"} className="text-[10px]" />
                                        <TextInput value={data.badge_en} onChange={e => setData('badge_en', e.target.value)} className="w-full mt-1 text-xs" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Pricing */}
                        <div className="mb-6">
                            <h3 className="text-xs font-black text-brand-navy dark:text-brand-yellow uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-4 h-px bg-brand-navy/20 dark:bg-brand-yellow/20"></span>
                                {isRTL ? 'الأسعار والحدود' : 'Pricing & Limits'}
                                <span className="flex-1 h-px bg-brand-navy/10 dark:bg-brand-yellow/10"></span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div>
                                    <InputLabel value={isRTL ? "السعر الشهري" : "Monthly Price"} className="text-[10px] font-bold" />
                                    <TextInput type="number" step="0.01" value={data.price_per_student} onChange={e => setData('price_per_student', e.target.value)} className="w-full mt-1 text-sm font-black" required />
                                </div>
                                <div>
                                    <InputLabel value={isRTL ? "السعر السنوي" : "Yearly Price"} className="text-[10px] font-bold" />
                                    <TextInput type="number" step="0.01" value={data.price_per_student_yearly} onChange={e => setData('price_per_student_yearly', e.target.value)} className="w-full mt-1 text-sm font-black" required />
                                </div>
                                <div>
                                    <InputLabel value={isRTL ? "الحافلات" : "Max Buses"} className="text-[10px] font-bold" />
                                    <TextInput type="number" value={data.max_buses} onChange={e => setData('max_buses', e.target.value)} className="w-full mt-1 text-sm font-black" />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Features */}
                        <div>
                            <h3 className="text-xs font-black text-brand-navy dark:text-brand-yellow uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-4 h-px bg-brand-navy/20 dark:bg-brand-yellow/20"></span>
                                {isRTL ? 'المميزات' : 'Features'}
                                <span className="flex-1 h-px bg-brand-navy/10 dark:bg-brand-yellow/10"></span>
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'has_driver_app', label: isRTL ? 'تطبيق السائق' : 'Driver App', icon: <Smartphone size={14} /> },
                                    { id: 'has_parent_app', label: isRTL ? 'تطبيق ولي الأمر' : 'Parent App', icon: <Smartphone size={14} /> },
                                    { id: 'has_supervisor_app', label: isRTL ? 'تطبيق المشرفة' : 'Supervisor App', icon: <Smartphone size={14} /> },
                                    { id: 'has_reports', label: isRTL ? 'تقارير' : 'Reports', icon: <Activity size={14} /> },
                                    { id: 'has_api_access', label: isRTL ? 'API' : 'API', icon: <Key size={14} /> },
                                    { id: 'has_dedicated_support', label: isRTL ? 'دعم فني' : 'Support', icon: <LifeBuoy size={14} /> },
                                ].map((feat) => (
                                    <label key={feat.id} className={`flex items-center gap-2 p-2 px-3 rounded-xl border cursor-pointer transition-all ${data[feat.id as keyof typeof data] ? 'border-brand-navy dark:border-brand-yellow bg-brand-navy/5 dark:bg-brand-yellow/10' : 'border-slate-100 dark:border-slate-800'}`}>
                                        <input type="checkbox" checked={!!data[feat.id as keyof typeof data]} onChange={(e) => setData(feat.id as any, e.target.checked)} className="rounded text-brand-navy w-4 h-4" />
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                            <div className="text-slate-400">{feat.icon}</div>
                                            {feat.label}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="flex gap-2">
                            <PrimaryButton
                                disabled={processing || (editingPlan !== null && isUnchanged)}
                                className={`px-6 py-2.5 rounded-lg text-sm shadow-md transition-all ${(editingPlan !== null && isUnchanged) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isRTL ? 'حفظ' : 'Save'}
                            </PrimaryButton>
                            <SecondaryButton onClick={closeModal} className="px-6 py-2.5 rounded-lg text-sm">
                                {isRTL ? 'إلغاء' : 'Cancel'}
                            </SecondaryButton>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* TOGGLE STATUS CONFIRMATION MODAL */}
            <ConfirmationModal
                show={isToggleModalOpen}
                title={isRTL ? "تغيير حالة الخطة" : "Change Plan Status"}
                message={isRTL ? `هل أنت متأكد من تغيير حالة خطة "${togglePlan?.name_ar || togglePlan?.name || ''}"؟` : `Are you sure you want to change the status of plan "${togglePlan?.name_en || togglePlan?.name || ''}"?`}
                confirmText={isRTL ? "تأكيد التغيير" : "Confirm Change"}
                cancelText={isRTL ? "إلغاء" : "Cancel"}
                onConfirm={handleToggleConfirm}
                onClose={() => {
                    setIsToggleModalOpen(false);
                    setTogglePlan(null);
                }}
                type="warning"
                processing={isToggling}
            />
        </AuthenticatedLayout>
    );
}

function FeatureItem({ active, text, icon }: any) {
    return (
        <div
            className={`flex items-center gap-3 text-sm font-bold ${active ? "text-slate-700 dark:text-slate-200" : "text-slate-300 dark:text-slate-600 line-through"}`}
        >
            <div
                className={`w-5 h-5 rounded flex items-center justify-center ${active ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"}`}
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
