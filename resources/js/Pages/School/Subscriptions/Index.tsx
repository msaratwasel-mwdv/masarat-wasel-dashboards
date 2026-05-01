import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { ShieldCheck, Bus, CheckCircle2, AlertTriangle, UserPlus } from 'lucide-react';

export default function SubscriptionsIndex({ plans, subscriptions, students }: any) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === "dark";

    const attendancePlans = plans.filter((p:any) => p.type === 'attendance');
    const transportPlans = plans.filter((p:any) => p.type === 'transport');
    const activeAttendance = subscriptions.find((s:any) => s.plan?.type === 'attendance' && (s.status === 'active' || s.status === 'trialing'));
    
    const [selectedTransportPlan, setSelectedTransportPlan] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

    const handleSubscribeAttendance = (planId: number) => {
        if(confirm(isRTL ? "تأكيد الاشتراك واستصدار فاتورة؟" : "Confirm subscription and generate invoice?")) {
            router.post(route('school.subscriptions.attendance'), { plan_id: planId });
        }
    };

    const handleSubscribeTransport = () => {
        if(!selectedTransportPlan) return alert(isRTL ? "يرجى تحديد باقة الحافلات" : "Select transport plan");
        if(selectedStudents.length === 0) return alert(isRTL ? "يرجى تحديد الطلاب" : "Select students");
        if(confirm(isRTL ? "تأكيد اشتراك الطلاب وتوليد الفاتورة الخاصة بهم؟" : "Confirm student subscription and generate invoice?")) {
            router.post(route('school.subscriptions.transport'), {
                plan_id: selectedTransportPlan,
                student_ids: selectedStudents
            }, {
                onSuccess: () => {
                    setSelectedStudents([]);
                    setSelectedTransportPlan('');
                }
            });
        }
    }

    return (
        <SchoolAuthenticatedLayout>
            <Head title={isRTL ? "مركز الاشتراكات" : "Subscription Center"} />
            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center bg-[#0f2044] p-6 md:p-8 rounded-[32px] shadow-2xl border border-[#f5b800]/10">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white mb-2">{isRTL ? "مركز الاشتراكات" : "Subscription Center"}</h1>
                        <p className="text-[#f5b800] text-sm font-bold uppercase tracking-widest">{isRTL ? "إدارة اشتراكات الحضور والنقل" : "Manage Attendance & Transport Subscriptions"}</p>
                    </div>
                </div>

                {/* Attendance Plan Section */}
                <div>
                   <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{isRTL ? "نظام إدارة الحضور" : "Attendance Management System"}</h2>
                   {activeAttendance ? (
                       <div className="p-6 md:p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center gap-6">
                           <div className="p-4 bg-emerald-500 rounded-full text-white shadow-lg shadow-emerald-500/30">
                               <ShieldCheck className="w-8 h-8" />
                           </div>
                           <div>
                                <h3 className="text-emerald-600 dark:text-emerald-400 font-black text-xl mb-1">{isRTL ? "اشتراك الحضور الخاص بك نشط" : "Your Attendance Subscription is Active"}</h3>
                                <p className="text-sm font-bold text-emerald-600/80 dark:text-emerald-400/80">{isRTL ? `مشترك في باقة: ${activeAttendance.plan.name}` : `Subscribed to: ${activeAttendance.plan.name}`}</p>
                                {activeAttendance.status === 'trialing' && (
                                   <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 rounded-full text-xs font-black text-emerald-600">
                                       <AlertTriangle className="w-3 h-3" />
                                       {isRTL ? `تجربة مجانية حتى: ${activeAttendance.trial_ends_at}` : `Free trial until: ${activeAttendance.trial_ends_at}`}
                                   </div>
                                )}
                           </div>
                       </div>
                   ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {attendancePlans.map((plan:any) => (
                               <div key={plan.id} className={`p-8 rounded-[32px] border shadow-xl flex flex-col transition-all hover:-translate-y-2 ${isDark ? 'bg-slate-800/80 border-slate-700/50 hover:bg-slate-800' : 'bg-white border-slate-100 hover:shadow-2xl'}`}>
                                   <div className="p-4 bg-[#0f2044] text-[#f5b800] rounded-2xl w-max mb-6">
                                       <ShieldCheck className="w-8 h-8" />
                                   </div>
                                   <h3 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                                   <p className={`text-sm flex-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{plan.description}</p>
                                   <div className={`mt-6 pt-6 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                                        <div className="flex items-baseline gap-2 mb-6">
                                            <span className="text-3xl font-black text-[#f5b800]">{plan.price}</span>
                                            <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                /{plan.billing_cycle === 'yearly' ? 'سنة' : plan.billing_cycle === 'trial' ? 'تجربة' : 'شهر'}
                                            </span>
                                        </div>
                                        <button onClick={() => handleSubscribeAttendance(plan.id)} className="w-full py-4 bg-[#0f2044] hover:bg-[#1a2845] text-[#f5b800] rounded-2xl font-black uppercase tracking-wider text-sm transition-all shadow-xl shadow-[#0f2044]/20">
                                            {isRTL ? "تفعيل الاشتراك" : "Subscribe Now"}
                                        </button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
                </div>

                {/* Transport Plan Section */}
                <div className={`p-6 md:p-8 rounded-[32px] border shadow-xl ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                   <h2 className={`text-xl font-bold mb-6 flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                       <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <Bus className="w-6 h-6 text-emerald-500" />
                       </div>
                       {isRTL ? "اشتراكات النقل الخاص بالطلاب" : "Student Transport Subscriptions"}
                   </h2>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                          <label className={`block text-xs uppercase tracking-widest font-black mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? "اختر باقة النقل" : "Select Transport Plan"}</label>
                          <select value={selectedTransportPlan} onChange={e => setSelectedTransportPlan(e.target.value)} className={`w-full p-4 rounded-xl border appearance-none font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'}`}>
                              <option value="">{isRTL ? "-- اختر باقة --" : "-- Select Plan --"}</option>
                              {transportPlans.map((p:any) => (
                                  <option key={p.id} value={p.id}>{p.name} - {p.price} ريال</option>
                              ))}
                          </select>

                          <div className={`mt-8 p-6 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex justify-between items-center mb-2">
                                  <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? "الطلاب المحددين:" : "Selected Students:"}</span>
                                  <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedStudents.length}</span>
                              </div>
                              <p className={`text-[10px] mb-6 font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {isRTL ? "سيتم إنشاء فاتورة مفصلة لقائمة الطلاب" : "Detailed invoice will be generated for the list"}
                              </p>
                              <button onClick={handleSubscribeTransport} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all">
                                  <UserPlus className="w-5 h-5" />
                                  {isRTL ? "تأكيد الاشتراك" : "Confirm Subscription"}
                              </button>
                          </div>
                      </div>

                      <div className={`border rounded-2xl overflow-hidden ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                          <div className={`p-4 border-b font-bold text-sm flex justify-between items-center ${isDark ? 'bg-slate-900 text-white border-slate-700/50' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>
                              <span>{isRTL ? "حدد الطلاب للاشتراك" : "Select Students"}</span>
                              <span className="text-[10px] uppercase font-black tracking-widest text-[#f5b800]">
                                  {isRTL ? "قائمة بجميع الطلاب" : "All Students List"}
                              </span>
                          </div>
                          <div className="max-h-[350px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                              {students.map((student:any) => {
                                  const isSubscribed = subscriptions.some((s:any) => s.student_id === student.id && s.plan?.type === 'transport');
                                  
                                  return (
                                      <div key={student.id} className={`flex items-center justify-between p-3 border rounded-xl transition-all ${isSubscribed ? 'bg-emerald-500/5 border-emerald-500/20' : isDark ? 'border-slate-700/50 hover:bg-slate-700/20' : 'border-slate-100 hover:bg-slate-50'}`}>
                                          <label className={`flex items-center gap-3 cursor-pointer w-full ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                              <input 
                                                 type="checkbox" 
                                                 disabled={isSubscribed}
                                                 checked={selectedStudents.includes(student.id)}
                                                 onChange={(e) => {
                                                     if(e.target.checked) setSelectedStudents([...selectedStudents, student.id]);
                                                     else setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                                 }}
                                                 className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 shadow-sm" 
                                              />
                                              <span className="font-bold text-sm tracking-wide">{student.first_name} {student.last_name}</span>
                                          </label>
                                          {isSubscribed && <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-black uppercase px-2 py-1.5 rounded-lg whitespace-nowrap ml-2">{isRTL ? 'مشترك' : 'Subscribed'}</span>}
                                      </div>
                                  );
                              })}
                              {students.length === 0 && (
                                 <div className="text-center py-8 text-slate-500 font-bold text-sm">
                                     {isRTL ? "لا يوجد طلاب مضافين" : "No students added yet"}
                                 </div>
                              )}
                          </div>
                      </div>
                   </div>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
