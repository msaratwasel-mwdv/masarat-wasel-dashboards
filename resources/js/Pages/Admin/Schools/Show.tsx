import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import React, { useState } from "react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { motion } from "framer-motion";
import {
  UserCog,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  School as SchoolIcon,
  MapPin,
  Bus as BusIcon,
  Users,
  Fingerprint,
  Camera,
  X,
  LayoutDashboard,
  Settings,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  national_id: string;
  address?: string;
  image?: string;
  role: string;
}

interface School {
  id: number;
  name: string;
  address: string;
  status: string;
  logo?: string;
  users: User[];
}

interface Stats {
  students_count: number;
  buses_count: number;
  active_buses: number;
  maintenance_buses: number;
  drivers_count: number;
  assistants_count: number;
  admins_count: number;
}

export default function ShowSchool({
  school,
  stats,
}: {
  school: School;
  stats: Stats;
}) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [managerModal, setManagerModal] = useState<{
    show: boolean;
    type: "add" | "edit";
    user?: User;
  }>({ show: false, type: "add" });

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    name: "",
    email: "",
    phone: "",
    national_id: "",
    password: "",
    password_confirmation: "",
    address: "",
    image: null as File | null,
  });

  const openAddManager = () => {
    reset();
    clearErrors();
    setManagerModal({ show: true, type: "add" });
  };

  const openEditManager = (user: User) => {
    reset();
    clearErrors();
    setData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        national_id: user.national_id || "",
        address: user.address || "",
        image: null,
        password: "",
        password_confirmation: "",
    });
    setManagerModal({ show: true, type: "edit", user });
  };

  const handleManagerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (managerModal.type === "add") {
      post(route("admin.schools.users.store", school.id), {
        onSuccess: () => setManagerModal({ ...managerModal, show: false }),
      });
    } else if (managerModal.type === "edit" && managerModal.user) {
      router.post(route("admin.schools.users.update", [school.id, managerModal.user.id]), {
        ...data,
        _method: 'PUT'
      }, {
        forceFormData: true,
        onSuccess: () => setManagerModal({ ...managerModal, show: false }),
      });
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className={`flex justify-between items-center w-full ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="flex items-center gap-4">
                <Link href={route('admin.schools.index')} className={`p-2.5 rounded-2xl transition-all ${isDark ? "bg-gray-800 text-gray-400 hover:text-white" : "bg-white text-gray-400 hover:text-brand-navy shadow-sm"}`}>
                    <ChevronLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
                </Link>
                <h2 className={`font-black text-xl tracking-tight ${isDark ? "text-gray-200" : "text-brand-navy"}`}>
                    {isRTL ? "تفاصيل المؤسسة التعليمية" : "Educational Institution Details"}
                </h2>
            </div>
            <Link href={route('admin.schools.index')} className="text-sm font-bold text-gray-400 hover:text-brand-yellow transition-colors">
                {isRTL ? "العودة للمدارس" : "Return to Schools"}
            </Link>
        </div>
      }
    >
      <Head title={school.name} />

      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-yellow/10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-dark/20 blur-[120px]"></div>
      </div>

      <div className={`grid grid-cols-12 gap-6 pb-12 dir-${isRTL ? "rtl" : "ltr"} relative z-10`}>
        
        {/* Identity Bento (8 cols) */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="col-span-12 lg:col-span-8"
        >
            <div className={`h-full rounded-[2.5rem] border overflow-hidden relative group transition-all duration-500 ${isDark ? 'bg-gray-800/40 border-gray-700 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
                {/* Visual Header Decoration */}
                <div className={`h-32 w-full ${school.status === 'Active' ? 'bg-brand-dark' : 'bg-gray-700'} relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                <div className="px-10 pb-10 flex flex-col md:flex-row items-center md:items-end gap-8 -mt-16 relative z-10">
                    <div className={`w-40 h-40 rounded-[2.5rem] border-[6px] ${isDark ? "bg-gray-900 border-gray-800 shadow-2xl" : "bg-white border-white shadow-2xl"} overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-700`}>
                        {school.logo ? (
                            <img src={`/storage/${school.logo}`} className="w-full h-full object-contain p-4" />
                        ) : (
                            <SchoolIcon className={`w-16 h-16 ${isDark ? 'text-gray-700' : 'text-gray-100'}`} />
                        )}
                    </div>
                    
                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"} mt-4 md:mt-0`}>
                        <div className="flex items-center gap-3 mb-2">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${school.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                {school.status === 'Active' ? (isRTL ? "نشطة" : "Active") : (isRTL ? "غير نشطة" : "Inactive")}
                            </span>
                        </div>
                        <h1 className={`text-4xl font-black tracking-tighter leading-tight ${isDark ? "text-white" : "text-brand-navy"}`}>{school.name}</h1>
                        <div className={`flex items-center gap-4 mt-4 text-gray-400 font-bold text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
                            <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-yellow" /><span>{school.address}</span></div>
                            <div className="flex items-center gap-1.5"><Fingerprint className="w-4 h-4 text-brand-yellow" /><span>ID: {school.id}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Mini Stats Mosaic (4 cols) */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
            <BentoStatCard index={1} icon={<Users />} label={isRTL ? "الطلاب" : "Students"} value={stats.students_count} color="emerald" isDark={isDark} />
            <BentoStatCard index={2} icon={<BusIcon />} label={isRTL ? "الباصات" : "Buses"} value={stats.buses_count} color="blue" isDark={isDark} />
            <BentoStatCard index={3} icon={<ShieldCheck />} label={isRTL ? "السائقين" : "Drivers"} value={stats.drivers_count} color="purple" isDark={isDark} />
            <BentoStatCard index={4} icon={<UserCog />} label={isRTL ? "المدراء" : "Admins"} value={school.users.length} color="indigo" isDark={isDark} />
        </div>

        {/* --- ROW 2: MANAGEMENT & ACTIONS --- */}

        {/* Managers Table (8 cols) */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="col-span-12 lg:col-span-8"
        >
            <div className={`rounded-[2.5rem] border overflow-hidden h-full flex flex-col ${isDark ? 'bg-gray-800/40 border-gray-700 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/40'}`}>
                <div className={`px-8 py-6 border-b flex items-center justify-between ${isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-50 bg-gray-50/50'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-brand-yellow/10 text-brand-yellow"><UserCog className="w-5 h-5" /></div>
                        <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isRTL ? "مدراء النظام" : "System Administrators"}</h3>
                    </div>
                    <button onClick={openAddManager} className="bg-brand-navy text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-brand-navy/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                        <Plus className="w-4 h-4" />{isRTL ? "إضافة مدير" : "New Manager"}
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className={`text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 ${isDark ? "bg-gray-900/20" : "bg-gray-50/30"}`}>
                                <th className={`px-8 py-4 ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الاسم" : "Administrator"}</th>
                                <th className={`px-8 py-4 ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "التواصل" : "Contact"}</th>
                                <th className="px-8 py-4 text-center">{isRTL ? "التحكم" : "Action"}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {school.users.length === 0 ? (
                                <tr><td colSpan={3} className="px-8 py-12 text-center text-gray-400 font-bold italic opacity-50">{isRTL ? "لم يتم تعيين مدراء بعد" : "No administrators assigned yet"}</td></tr>
                            ) : (
                                school.users.map(user => (
                                    <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-brand-dark flex items-center justify-center text-white font-black text-sm uppercase">{user.name.charAt(0)}</div>
                                                <div className={isRTL ? "text-right" : ""}>
                                                    <p className={`font-black ${isDark ? "text-white" : "text-brand-navy"}`}>{user.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{user.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className={`space-y-0.5 ${isRTL ? "text-right" : ""}`}>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold"><Mail className="w-3 h-3" /><span>{user.email}</span></div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold"><Phone className="w-3 h-3" /><span>{user.phone}</span></div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEditManager(user)} className="p-2 rounded-lg hover:bg-brand-yellow/10 text-gray-400 hover:text-brand-yellow transition-all"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => { if(confirm(isRTL ? "حذف؟" : "Delete?")) router.delete(route("admin.schools.users.destroy", [school.id, user.id])) }} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>

        {/* Action Bento (4 cols) */}
        <motion.div 
            initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="col-span-12 lg:col-span-4 space-y-4"
        >
            <QuickActionCard icon={<LayoutDashboard />} label={isRTL ? "لوحة التحكم" : "Institutional Dashboard"} isDark={isDark} />
            <QuickActionCard icon={<Settings />} label={isRTL ? "إعدادات المؤسسة" : "School Settings"} isDark={isDark} />
            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-brand-dark border-gray-700' : 'bg-brand-dark border-transparent'} text-white relative overflow-hidden group`}>
                <div className="relative z-10">
                    <h4 className="text-xl font-black mb-2">{isRTL ? "تقرير شامل" : "Full Report"}</h4>
                    <p className="text-sm text-gray-400 font-bold mb-6">{isRTL ? "تحميل كافة بيانات المدرسة" : "Download all school data in PDF"}</p>
                    <button className="bg-brand-yellow text-brand-dark px-6 py-2.5 rounded-xl font-black text-xs hover:scale-105 transition-transform">
                        {isRTL ? "تحميل الآن" : "Download Now"}
                    </button>
                </div>
                <div className="absolute top-1/2 -right-10 -translate-y-1/2 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <ClipboardList size={200} />
                </div>
            </div>
        </motion.div>

      </div>

      {/* --- MODALS --- */}
      <Modal show={managerModal.show} onClose={() => setManagerModal({ ...managerModal, show: false })} maxWidth="2xl">
          <div className={`p-8 ${isDark ? "bg-gray-900" : "bg-white"} rounded-[2.5rem]`}>
              <h2 className={`text-2xl font-black mb-8 ${isDark ? "text-white" : "text-brand-navy"}`}>
                {managerModal.type === 'add' ? (isRTL ? "إضافة مدير جديد" : "New Administrator") : (isRTL ? "تعديل المدير" : "Edit Administrator")}
              </h2>
              <form onSubmit={handleManagerSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                          <InputLabel value={isRTL ? "الاسم الكامل" : "Full Name"} />
                          <TextInput value={data.name} onChange={e => setData('name', e.target.value)} className="w-full mt-1" required />
                          <InputError message={errors.name} className="mt-1" />
                      </div>
                      <div>
                          <InputLabel value={isRTL ? "الرقم المدني" : "Civil ID"} />
                          <TextInput value={data.national_id} onChange={e => setData('national_id', e.target.value)} className="w-full mt-1" required />
                          <InputError message={errors.national_id} className="mt-1" />
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                          <InputLabel value={isRTL ? "البريد الإلكتروني" : "Email"} />
                          <TextInput type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full mt-1" required />
                          <InputError message={errors.email} className="mt-1" />
                      </div>
                      <div>
                          <InputLabel value={isRTL ? "رقم الهاتف" : "Phone"} />
                          <TextInput value={data.phone} onChange={e => setData('phone', e.target.value)} className="w-full mt-1" required />
                          <InputError message={errors.phone} className="mt-1" />
                      </div>
                  </div>
                  <div>
                      <InputLabel value={isRTL ? "العنوان" : "Address"} />
                      <TextInput value={data.address} onChange={e => setData('address', e.target.value)} className="w-full mt-1" />
                      <InputError message={errors.address} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                          <InputLabel value={managerModal.type === 'edit' ? (isRTL ? "كلمة المرور (اتركها فارغة للإبقاء عليها)" : "Password (leave blank to keep)") : (isRTL ? "كلمة المرور" : "Password")} />
                          <TextInput type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="w-full mt-1" />
                          <InputError message={errors.password} className="mt-1" />
                      </div>
                      <div>
                          <InputLabel value={isRTL ? "تأكيد كلمة المرور" : "Confirm Password"} />
                          <TextInput type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} className="w-full mt-1" />
                          <InputError message={errors.password_confirmation} className="mt-1" />
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                      <SecondaryButton onClick={() => setManagerModal({ ...managerModal, show: false })}>{isRTL ? "إلغاء" : "Cancel"}</SecondaryButton>
                      <PrimaryButton className="bg-brand-navy" disabled={processing}>
                        {processing ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ" : "Save")}
                      </PrimaryButton>
                  </div>
              </form>
          </div>
      </Modal>

    </AuthenticatedLayout>
  );
}

// ─── Sub Components ───

function BentoStatCard({ icon, label, value, color, isDark, index }: any) {
    const colorMap: any = {
        emerald: isDark ? "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20" : "from-emerald-50 to-white text-emerald-600 border-emerald-100",
        blue: isDark ? "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20" : "from-blue-50 to-white text-blue-600 border-blue-100",
        purple: isDark ? "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/20" : "from-purple-50 to-white text-purple-600 border-purple-100",
        indigo: isDark ? "from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/20" : "from-indigo-50 to-white text-indigo-600 border-indigo-100",
    };
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
            whileHover={{ y: -8, scale: 1.05 }}
            className={`p-6 rounded-[2rem] border bg-gradient-to-br flex flex-col justify-between shadow-sm transition-all hover:shadow-2xl ${colorMap[color]}`}
        >
            <motion.div 
                whileHover={{ rotate: [0, -10, 10, 0] }}
                className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner"
            >
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </motion.div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{label}</p>
                <p className="text-3xl font-black tracking-tight">{value.toLocaleString()}</p>
            </div>
        </motion.div>
    );
}

function QuickActionCard({ icon, label, isDark }: any) {
    return (
        <div className={`p-6 rounded-[2rem] border flex items-center justify-between group cursor-pointer transition-all ${isDark ? 'bg-gray-800/40 border-gray-700 hover:bg-gray-800' : 'bg-white border-gray-100 hover:shadow-lg'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDark ? 'bg-gray-700 text-gray-400 group-hover:text-brand-yellow' : 'bg-gray-50 text-gray-400 group-hover:bg-brand-yellow/10 group-hover:text-brand-yellow'}`}>
                    {icon}
                </div>
                <span className={`font-black text-sm ${isDark ? 'text-gray-200' : 'text-brand-navy'}`}>{label}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-yellow group-hover:translate-x-1 transition-all" />
        </div>
    );
}
