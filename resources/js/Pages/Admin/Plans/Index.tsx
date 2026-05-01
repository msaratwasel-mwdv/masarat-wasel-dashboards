import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { Plus, Edit, Trash2, ShieldCheck, Bus } from 'lucide-react';

interface Plan {
    id: number;
    name: string;
    description: string;
    type: 'attendance' | 'transport';
    price: number;
    billing_cycle: 'yearly' | 'monthly' | 'trial';
    trial_days: number | null;
    is_active: boolean;
}

export default function PlansIndex({ plans }: { plans: Plan[] }) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === "dark";

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState({
        name: '', description: '', type: 'attendance', price: 0,
        billing_cycle: 'yearly', trial_days: 14, is_active: true
    });

    const openModal = (plan?: Plan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name, description: plan.description || '', type: plan.type,
                price: Number(plan.price), billing_cycle: plan.billing_cycle,
                trial_days: plan.trial_days || 0, is_active: plan.is_active
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: '', description: '', type: 'attendance', price: 0,
                billing_cycle: 'yearly', trial_days: 14, is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPlan) {
            router.put(route('admin.plans.update', editingPlan.id), formData, {
                onSuccess: () => setIsModalOpen(false)
            });
        } else {
            router.post(route('admin.plans.store'), formData, {
                onSuccess: () => setIsModalOpen(false)
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
            router.delete(route('admin.plans.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={isRTL ? "إدارة خطط الاشتراك" : "Plans Management"} />
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#0f2044] p-6 rounded-3xl shadow-xl border border-[#f5b800]/10">
                    <h1 className="text-2xl font-black text-white">{isRTL ? "باقات الاشتراك" : "Subscription Plans"}</h1>
                    <button onClick={() => openModal()} className="flex items-center gap-2 bg-[#f5b800] hover:bg-[#d49f00] text-[#0f2044] px-6 py-3 rounded-xl font-bold shadow-lg transition-all">
                        <Plus className="w-5 h-5" />
                        {isRTL ? "إضافة باقة" : "Add Plan"}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className={`p-6 rounded-3xl shadow-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} transition-all hover:-translate-y-1`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${plan.type === 'attendance' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    {plan.type === 'attendance' ? <ShieldCheck className="w-8 h-8" /> : <Bus className="w-8 h-8" />}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(plan)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(plan.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                            <p className={`text-sm mb-4 line-clamp-2 min-h-[40px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{plan.description || (isRTL ? 'لا يوجد وصف' : 'No description')}</p>
                            
                            <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                <div>
                                    <span className="text-2xl font-black text-[#f5b800]">{plan.price}</span>
                                    <span className={`text-xs ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {plan.billing_cycle === 'yearly' ? (isRTL ? '/سنوي' : '/yr') : plan.billing_cycle === 'monthly' ? (isRTL ? '/شهري' : '/mo') : (isRTL ? '/فترة التجربة' : '/trial')}
                                    </span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${plan.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                    {plan.is_active ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                            <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {editingPlan ? (isRTL ? 'تعديل الخطة' : 'Edit Plan') : (isRTL ? 'إضافة خطة جديدة' : 'Add New Plan')}
                            </h2>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{isRTL ? 'الاسم' : 'Name'}</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} required />
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{isRTL ? 'الوصف' : 'Description'}</label>
                                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} rows={3} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{isRTL ? 'النوع' : 'Type'}</label>
                                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className={`w-full p-3 rounded-xl border appearance-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                                            <option value="attendance">{isRTL ? 'نظام الحضور' : 'Attendance'}</option>
                                            <option value="transport">{isRTL ? 'نظام النقل' : 'Transport'}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{isRTL ? 'دورة الدفع' : 'Billing Cycle'}</label>
                                        <select value={formData.billing_cycle} onChange={e => setFormData({...formData, billing_cycle: e.target.value as any})} className={`w-full p-3 rounded-xl border appearance-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                                            <option value="yearly">{isRTL ? 'سنوي' : 'Yearly'}</option>
                                            <option value="monthly">{isRTL ? 'شهري' : 'Monthly'}</option>
                                            <option value="trial">{isRTL ? 'تجريبي' : 'Trial'}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{isRTL ? 'السعر' : 'Price'}</label>
                                        <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} required />
                                    </div>
                                    {formData.billing_cycle === 'trial' && (
                                        <div>
                                            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{isRTL ? 'أيام التجربة' : 'Trial Days'}</label>
                                            <input type="number" value={formData.trial_days} onChange={e => setFormData({...formData, trial_days: Number(e.target.value)})} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} required />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-4 pt-2">
                                    <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                                    <label htmlFor="is_active" className={`text-sm font-bold cursor-pointer ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{isRTL ? 'مفعل (يظهر للمدارس)' : 'Active (Visible to schools)'}</label>
                                </div>
                                <div className="flex gap-4 pt-4 mt-6 border-t border-slate-200 dark:border-slate-700">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 p-3 rounded-xl font-bold ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                        {isRTL ? 'إلغاء' : 'Cancel'}
                                    </button>
                                    <button type="submit" className="flex-1 p-3 rounded-xl font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                                        {isRTL ? 'حفظ' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
