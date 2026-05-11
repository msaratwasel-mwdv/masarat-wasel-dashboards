import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CheckCircle2, XCircle, Clock, Eye, AlertTriangle, FileText, Mail, MapPin, Wallet } from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';
import OmaniRial from '@/Components/OmaniRial';

export default function SubscriptionsIndex({ subscriptions }: any) {
    const { isRTL } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState<'details' | 'approve'>('details');
    const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
    const [installmentsCount, setInstallmentsCount] = useState(1);

    const openDetailsModal = (sub: any) => {
        setSelectedSubscription(sub);
        setModalStep('details');
        setIsModalOpen(true);
    };

    const handleApprove = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('admin.subscriptions.approve', selectedSubscription.id), {
            installments_count: installmentsCount
        }, {
            onSuccess: () => setIsModalOpen(false)
        });
    };

    const handleReject = (subId: number) => {
        if(confirm(isRTL ? 'هل أنت متأكد من رفض هذا الاشتراك؟' : 'Are you sure you want to reject this subscription?')) {
            router.post(route('admin.subscriptions.reject', subId), {}, {
                onSuccess: () => setIsModalOpen(false)
            });
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-bold text-slate-800">{isRTL ? 'إدارة اشتراكات المدارس' : 'Schools Subscriptions'}</h2>}>
            <Head title={isRTL ? "الاشتراكات" : "Subscriptions"} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-xl">
                        <div className="p-6 text-gray-900 overflow-x-auto">
                            <table className="w-full whitespace-nowrap text-right">
                                <thead className="bg-slate-50 text-slate-500 font-bold text-sm">
                                    <tr className={isRTL ? 'text-right' : 'text-left'}>
                                        <th className={`px-6 py-4 ${isRTL ? 'rounded-r-xl' : 'rounded-l-xl'}`}>{isRTL ? 'المدرسة' : 'School'}</th>
                                        <th className="px-6 py-4">{isRTL ? 'الخطة' : 'Plan'}</th>
                                        <th className="px-6 py-4">{isRTL ? 'الحالة' : 'Status'}</th>
                                        <th className="px-6 py-4">{isRTL ? 'تاريخ الطلب' : 'Request Date'}</th>
                                        <th className={`px-6 py-4 ${isRTL ? 'rounded-l-xl' : 'rounded-r-xl'}`}>{isRTL ? 'الإجراءات' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscriptions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-10 text-slate-400">{isRTL ? 'لا توجد اشتراكات' : 'No subscriptions found'}</td>
                                        </tr>
                                    ) : subscriptions.map((sub: any) => (
                                        <tr key={sub.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-bold text-brand-navy">{sub.school?.name}</td>
                                            <td className="px-6 py-4 text-slate-600">{sub.plan?.name}</td>
                                            <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                                                {sub.status === 'pending_approval' && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center w-max gap-1"><Clock size={14}/> {isRTL ? 'بانتظار الموافقة' : 'Pending'}</span>}
                                                {sub.status === 'active' && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center w-max gap-1"><CheckCircle2 size={14}/> {isRTL ? 'نشط' : 'Active'}</span>}
                                                {sub.status === 'cancelled' && <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold flex items-center w-max gap-1"><XCircle size={14}/> {isRTL ? 'ملغي' : 'Cancelled'}</span>}
                                                {sub.status === 'expired' && <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold flex items-center w-max gap-1"><AlertTriangle size={14}/> {isRTL ? 'منتهي' : 'Expired'}</span>}
                                            </td>
                                            <td className={`px-6 py-4 text-slate-500 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                                                {new Date(sub.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button onClick={() => openDetailsModal(sub)} className="bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1">
                                                        <Eye size={16}/> {isRTL ? (sub.status === 'pending_approval' ? 'مراجعة واعتماد' : 'تفاصيل') : (sub.status === 'pending_approval' ? 'Review & Approve' : 'Details')}
                                                    </button>
                                                    {(sub.status === 'active' || sub.status === 'expired') && (
                                                        <Link href={route('admin.installments.index', { school_id: sub.school_id })} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1">
                                                            <Wallet size={16}/> {isRTL ? 'الأقساط' : 'Installments'}
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Unified Multi-Step Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
                    <div className={`bg-white rounded-[32px] w-full ${modalStep === 'details' ? 'max-w-2xl' : 'max-w-md'} p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto transform transition-all duration-300`}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className={`absolute top-8 ${isRTL ? 'left-8' : 'right-8'} text-slate-400 hover:text-rose-500 z-10`}><XCircle size={28}/></button>
                        
                        {/* Stepper Indicator */}
                        <div className="flex items-center justify-center gap-4 mb-10 border-b border-slate-50 pb-6">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${modalStep === 'details' ? 'bg-brand-navy text-white' : 'bg-emerald-500 text-white'}`}>
                                    {modalStep === 'approve' ? <CheckCircle2 size={16}/> : '1'}
                                </div>
                                <span className={`text-xs font-black ${modalStep === 'details' ? 'text-brand-navy' : 'text-slate-400'}`}>{isRTL ? 'تفاصيل الاشتراك' : 'Subscription Details'}</span>
                            </div>
                            <div className="w-12 h-px bg-slate-200"></div>
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${modalStep === 'approve' ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    2
                                </div>
                                <span className={`text-xs font-black ${modalStep === 'approve' ? 'text-brand-navy' : 'text-slate-400'}`}>{isRTL ? 'إعدادات الأقساط' : 'Installment Settings'}</span>
                            </div>
                        </div>

                        {modalStep === 'details' ? (
                            <>
                                <div className="mb-8">
                                    <h3 className="text-3xl font-black text-slate-900 mb-2">{selectedSubscription?.school?.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Clock size={16} />
                                        <span className="text-sm font-bold">{isRTL ? 'تم التقديم في:' : 'Submitted on:'} {selectedSubscription?.created_at ? new Date(selectedSubscription.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric'}) : '-'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-2">{isRTL ? 'بيانات التواصل والخدمات' : 'Contact & Services'}</h4>
                                        <div className="space-y-3">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                    <CheckCircle2 size={12} /> {isRTL ? 'المسؤول' : 'Manager'}
                                                </div>
                                                <span className="font-black text-slate-700 text-sm">
                                                    {selectedSubscription?.school?.users?.[0]?.name || selectedSubscription?.school?.users?.[0]?.first_name_ar || '-'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                    <Mail size={12} /> {isRTL ? 'البريد الإلكتروني' : 'Email'}
                                                </div>
                                                <span className="font-black text-slate-700 text-sm">
                                                    {selectedSubscription?.school?.users?.[0]?.email || '-'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                    <AlertTriangle size={12} /> {isRTL ? 'رقم الجوال' : 'Phone'}
                                                </div>
                                                <span className={`font-black text-slate-700 text-sm ${isRTL ? 'text-right' : 'text-left'}`} dir="ltr">
                                                    {selectedSubscription?.school?.users?.[0]?.phone || '-'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                    <MapPin size={12} /> {isRTL ? 'العنوان' : 'Address'}
                                                </div>
                                                <span className="font-black text-slate-700 text-sm">{selectedSubscription?.school?.address || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-2">{isRTL ? 'تفاصيل خطة الاشتراك' : 'Subscription Plan Details'}</h4>
                                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                            <div className="text-xl font-black text-brand-navy mb-1">{selectedSubscription?.plan?.name}</div>
                                            <div className="text-[#f5b800] font-black text-2xl mb-4 flex items-center gap-1" dir="ltr"><OmaniRial className="w-5 h-5" />{selectedSubscription?.plan?.price_per_student} <span className="text-[10px] text-slate-400">{isRTL ? '/ طالب' : '/ Student'}</span></div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">{isRTL ? 'الحد الأقصى للباصات:' : 'Max Buses:'}</span>
                                                    <span className="font-black">{(selectedSubscription?.plan?.max_buses === null || selectedSubscription?.plan?.max_buses === 0) ? (isRTL ? 'غير محدود' : 'Unlimited') : selectedSubscription?.plan?.max_buses}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">{isRTL ? 'السعة التقديرية:' : 'Estimated Capacity:'}</span>
                                                    <span className="font-black">{(selectedSubscription?.plan?.max_buses === null || selectedSubscription?.plan?.max_buses === 0) ? (isRTL ? 'غير محدودة' : 'Unlimited') : ((selectedSubscription?.plan?.max_buses * 20) + (isRTL ? ' طالب' : ' Students'))}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-200/50">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">{isRTL ? 'مميزات الخطة:' : 'Plan Features:'}</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedSubscription?.plan?.feature_list?.map((f: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 bg-white text-[9px] font-bold rounded-lg border border-slate-100">{f}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`flex gap-3 pt-6 border-t font-black ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
                                    {selectedSubscription?.status === 'pending_approval' && (
                                        <>
                                            <button onClick={() => setModalStep('approve')} className="flex-1 bg-brand-navy hover:bg-brand-navy/90 text-white py-4 rounded-2xl transition-all shadow-lg shadow-brand-navy/20 flex items-center justify-center gap-2">
                                                {isRTL ? 'التالي' : 'Next'}
                                            </button>
                                            <button onClick={() => handleReject(selectedSubscription.id)} className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white py-4 rounded-2xl transition-all">{isRTL ? 'رفض الطلب' : 'Reject Request'}</button>
                                        </>
                                    )}
                                    <button onClick={() => setIsModalOpen(false)} className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl transition-all">{isRTL ? 'إغلاق' : 'Close'}</button>
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleApprove}>
                                <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">{isRTL ? 'الموافقة على الاشتراك' : 'Approve Subscription'}</h3>
                                    <p className="text-sm text-slate-500 font-bold">{isRTL ? 'قم بتحديد خطة التقسيط للمدرسة' : 'Configure payment installments for the school'}</p>
                                </div>
                                
                                <div className="bg-brand-navy/5 p-6 rounded-2xl border border-brand-navy/10 mb-8 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'سعر الطالب:' : 'Student Price:'}</span>
                                        <span className="font-black text-brand-navy flex items-center gap-1"><OmaniRial className="w-3.5 h-3.5 text-brand-navy" />{selectedSubscription?.plan?.price_per_student}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'إجمالي التقدير السنوي:' : 'Total Annual Estimate:'}</span>
                                        <span className="font-black text-emerald-500 text-lg flex items-center gap-1"><OmaniRial className="w-4 h-4 text-emerald-500" />{(selectedSubscription?.plan?.max_buses || 1) * 20 * (selectedSubscription?.plan?.price_per_student || 0)}</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className={`block text-sm font-bold text-slate-700 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'تقسيم الدفعات (الأقساط)' : 'Payment Installments'}</label>
                                        <div className="relative">
                                            <select 
                                                value={installmentsCount}
                                                onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                                                className={`w-full h-14 rounded-xl border-slate-200 focus:ring-brand-navy focus:border-brand-navy font-bold appearance-none ${isRTL ? 'pr-5' : 'pl-5'}`}
                                                dir={isRTL ? 'rtl' : 'ltr'}
                                            >
                                                <option value={1}>{isRTL ? 'دفعة واحدة (سنوي/كامل)' : 'One time (Annual/Full)'}</option>
                                                <option value={2}>{isRTL ? 'دفعتين (نصف سنوي)' : 'Two installments (Biannual)'}</option>
                                                <option value={3}>{isRTL ? '3 دفعات' : '3 installments'}</option>
                                                <option value={4}>{isRTL ? '4 دفعات (ربع سنوي)' : '4 installments (Quarterly)'}</option>
                                                <option value={12}>{isRTL ? '12 دفعة (شهري)' : '12 installments (Monthly)'}</option>
                                            </select>
                                        </div>
                                        <p className={`text-xs text-slate-400 leading-relaxed italic flex items-center gap-1 flex-wrap ${isRTL ? 'text-right' : 'text-left'}`}>
                                            {isRTL ? 'سيتم تقسيم مبلغ' : 'The amount of'} <span className="font-black flex items-center gap-0.5"><OmaniRial className="w-3 h-3" />{(selectedSubscription?.plan?.max_buses || 1) * 20 * (selectedSubscription?.plan?.price_per_student || 0)}</span> {isRTL ? 'على' : 'will be split into'} <span className="font-black">{installmentsCount}</span> {isRTL ? 'أقساط متساوية.' : 'equal installments.'}
                                        </p>
                                    </div>
                                </div>

                                <div className={`mt-10 flex gap-3 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
                                    <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20">{isRTL ? 'اعتماد وتوليد الدفعات' : 'Approve & Finalize'}</button>
                                    <button type="button" onClick={() => setModalStep('details')} className="px-6 bg-white border border-slate-200 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-colors uppercase text-xs tracking-widest">{isRTL ? 'رجوع' : 'Back'}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
