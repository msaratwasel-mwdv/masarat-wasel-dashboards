import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { useState } from "react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { motion, AnimatePresence } from "framer-motion";
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
  ClipboardList,
  Bus as BusIcon,
  Users,
  Fingerprint,
  Camera,
  X,
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
  supervisors_count: number;
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

  // --- Modal State ---
  const [managerModal, setManagerModal] = useState<{
    show: boolean;
    type: "add" | "edit";
    user?: User;
  }>({ show: false, type: "add" });

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    name: "",
    name_en: "",
    email: "",
    phone: "",
    national_id: "",
    password: "",
    password_confirmation: "",
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
        name_en: user.name, // Assuming same for now or handle fallback
        email: user.email,
        phone: user.phone,
        national_id: user.national_id || "",
        address: user.address || "",
        image: null as File | null,
        password: "",
        password_confirmation: "",
    });
    setManagerModal({ show: true, type: "edit", user });
  };

  const closeManagerModal = () => {
    setManagerModal({ ...managerModal, show: false });
  };

  const handleManagerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (managerModal.type === "add") {
      post(route("admin.schools.users.store", school.id), {
        onSuccess: () => closeManagerModal(),
      });
    } else if (managerModal.type === "edit" && managerModal.user) {
      // Use router.post with _method spoofing for file uploads
      router.post(route("admin.schools.users.update", [school.id, managerModal.user.id]), {
        ...data,
        _method: 'PUT'
      }, {
        forceFormData: true,
        onSuccess: () => closeManagerModal(),
      });
    }
  };

  const handleDeleteManager = (userId: number) => {
    if (confirm(isRTL ? "هل أنت متأكد من حذف هذا المدير؟" : "Are you sure you want to delete this manager?")) {
      router.delete(route("admin.schools.users.destroy", [school.id, userId]));
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Link href={route('admin.schools.index')} className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                <ChevronLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
            </Link>
            <h2 className={`font-bold text-xl ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                {isRTL ? "تفاصيل المدرسة" : "School Profile"}
            </h2>
        </div>
      }
    >
      <Head title={`${school.name} | ${isRTL ? "تفاصيل" : "Details"}`} />

      <div className={`space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        
        {/* 1. Header Hero Card */}
        <div className={`relative overflow-hidden rounded-3xl border ${isDark ? "bg-gray-800 border-gray-700 shadow-2xl" : "bg-white border-gray-100 shadow-xl"}`}>
            <div className={`h-32 bg-gradient-to-r ${school.status === 'Active' ? 'from-[#4F46E5] via-[#3730A3] to-[#1E1B4B]' : 'from-gray-500 to-gray-700'}`}>
                {/* Abstract pattern overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.1)_1px,_transparent_0)] bg-[size:20px_20px]"></div>
            </div>
            
            <div className="px-8 pb-8 flex flex-col md:flex-row items-end gap-6 -mt-12 relative z-10">
                <div className={`w-32 h-32 rounded-3xl border-4 ${isDark ? "bg-gray-900 border-gray-800 shadow-2xl" : "bg-white border-white shadow-xl"} overflow-hidden flex items-center justify-center shrink-0`}>
                    {school.logo ? <img src={`/storage/${school.logo}`} className="w-full h-full object-cover" /> : <SchoolIcon className="w-12 h-12 text-gray-300" />}
                </div>
                
                <div className={`flex-1 ${isRTL ? "text-right" : "text-left"} mb-2`}>
                    <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <h1 className={`text-3xl font-black ${isDark ? "text-white" : "text-brand-navy"}`}>{school.name}</h1>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${school.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                            {school.status}
                        </span>
                    </div>
                    <div className={`flex items-center gap-2 mt-2 text-gray-400 text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
                        <MapPin className="w-4 h-4" />
                        <span>{school.address || "No address provided"}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <PrimaryButton 
                        onClick={openAddManager}
                        className="bg-brand-yellow text-brand-dark px-6 py-2.5 rounded-xl border-none shadow-lg font-bold"
                    >
                        <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {isRTL ? "إضافة مدير" : "Add Manager"}
                    </PrimaryButton>
                    <Link href={route('admin.schools.index')} className={`px-6 py-2.5 rounded-xl text-sm font-bold border transition-all ${isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-700/50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {isRTL ? "الرجوع" : "Back"}
                    </Link>
                </div>
            </div>
        </div>

        {/* 2. Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatBox icon={<Users />} label={isRTL ? "الطلاب" : "Students"} value={stats.students_count} color="emerald" isDark={isDark} isRTL={isRTL} />
            <StatBox icon={<BusIcon />} label={isRTL ? "الباصات" : "Buses"} value={stats.buses_count} color="blue" isDark={isDark} isRTL={isRTL} />
            <StatBox icon={<ShieldCheck />} label={isRTL ? "السائقين" : "Drivers"} value={stats.drivers_count} color="purple" isDark={isDark} isRTL={isRTL} />
            <StatBox icon={<ShieldCheck />} label={isRTL ? "المشرفين" : "Supervisors"} value={stats.supervisors_count} color="indigo" isDark={isDark} isRTL={isRTL} />
        </div>

        {/* 3. Managers Section */}
        <div className={`rounded-3xl border overflow-hidden ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}>
            <div className={`px-8 py-5 border-b flex justify-between items-center ${isDark ? "border-gray-700 bg-gray-900/40" : "border-gray-100 bg-gray-50/50"}`}>
                <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className="p-2.5 rounded-xl bg-brand-yellow/10 text-brand-yellow">
                        <UserCog className="w-5 h-5" />
                    </div>
                    <div className={isRTL ? "text-right" : ""}>
                        <h3 className={`font-bold ${isDark ? "text-white" : "text-brand-navy"}`}>{isRTL ? "مدراء المدرسة" : "School Managers"}</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{isRTL ? "صلاحيات الوصول الكاملة" : "Full Access Roles"}</p>
                    </div>
                </div>
                <span className={`px-4 py-1.5 rounded-xl text-xs font-black bg-gray-100 dark:bg-gray-800 text-gray-500`}>
                    {school.users.length} {isRTL ? "إجمالي" : "Total"}
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={`text-[10px] uppercase font-black tracking-widest text-gray-400 ${isDark ? "bg-gray-800/20" : "bg-gray-50/30"}`}>
                            <th className={`px-8 py-4 ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الاسم" : "Name"}</th>
                            <th className={`px-8 py-4 ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "التواصل" : "Contact"}</th>
                            <th className="px-8 py-4 text-center">{isRTL ? "الإجراءات" : "Actions"}</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-gray-700/50" : "divide-gray-100"}`}>
                        {school.users.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center opacity-30">
                                        <Users className="w-12 h-12 mb-3" />
                                        <p className="font-bold text-sm">{isRTL ? "لا يوجد مدراء معينين" : "No managers assigned"}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            school.users.map((user) => (
                                <tr key={user.id} className="group hover:bg-brand-navy/5 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-inner group-hover:scale-110 transition-transform">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={isRTL ? "text-right" : ""}>
                                                <p className={`font-bold text-sm ${isDark ? "text-white" : "text-brand-navy"}`}>{user.name}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{user.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className={`space-y-1 ${isRTL ? "text-right" : ""}`}>
                                            <div className={`flex items-center gap-2 text-xs text-gray-400 ${isRTL ? "flex-row-reverse" : ""}`}>
                                                <Mail className="w-3 h-3" />
                                                <span>{user.email}</span>
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs text-gray-400 ${isRTL ? "flex-row-reverse" : ""}`}>
                                                <Phone className="w-3 h-3" />
                                                <span>{user.phone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button 
                                                onClick={() => openEditManager(user)}
                                                className="p-2 rounded-xl bg-brand-yellow/10 text-brand-yellow hover:scale-110 transition-transform"
                                                title={isRTL ? "تعديل" : "Edit"}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteManager(user.id)}
                                                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:scale-110 transition-transform"
                                                title={isRTL ? "حذف" : "Delete"}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* --- MANAGER MODAL --- */}
        <Modal show={managerModal.show} onClose={closeManagerModal} maxWidth="4xl">
            <div className={`relative ${isDark ? "bg-gray-900" : "bg-white"} rounded-2xl shadow-2xl overflow-hidden`}>
                <div className={`p-8 border-b ${isDark ? "border-gray-800 bg-gray-900/50" : "border-gray-100 bg-gray-50/50"}`}>
                    <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-brand-navy"}`}>
                        {managerModal.type === 'add' ? (isRTL ? "إضافة مدير مدرسة" : "Add School Manager") : (isRTL ? "تعديل بيانات المدير" : "Edit Manager Details")}
                    </h2>
                </div>

                <form onSubmit={handleManagerSubmit} className="p-8 space-y-6">
                    <div className={isRTL ? "text-right" : ""}>
                        <InputLabel value={isRTL ? "اسم المدير" : "Full Name"} />
                        <div className="relative mt-1.5">
                            <UserCog className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                            <TextInput 
                                value={data.name} 
                                onChange={e => setData('name', e.target.value)} 
                                className={`w-full ${isRTL ? 'pr-11' : 'pl-11'}`}
                                required
                            />
                        </div>
                        <InputError message={errors.name} />
                    </div>

                    <div className="flex flex-col items-center gap-4 mb-2">
                        <div className="relative group">
                            <div className={`w-24 h-24 rounded-full border-4 border-dashed flex items-center justify-center overflow-hidden transition-all ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} group-hover:border-brand-yellow`}>
                                {data.image ? (
                                    <img src={URL.createObjectURL(data.image)} className="w-full h-full object-cover" />
                                ) : (managerModal.user?.image ? (
                                    <img src={`/storage/${managerModal.user.image}`} className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="w-8 h-8 text-gray-300" />
                                ))}
                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-bold">
                                    {isRTL ? "تغيير الصورة" : "Change Image"}
                                    <input type="file" className="hidden" accept="image/*" onChange={e => setData('image', e.target.files?.[0] || null)} />
                                </label>
                            </div>
                            {data.image && (
                                <button onClick={() => setData('image', null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={isRTL ? "text-right" : ""}>
                            <InputLabel value={isRTL ? "رقم الهوية" : "National ID"} />
                            <div className="relative mt-1.5">
                                <Fingerprint className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                <TextInput 
                                    value={data.national_id} 
                                    onChange={e => setData('national_id', e.target.value)} 
                                    className={`w-full ${isRTL ? 'pr-11' : 'pl-11'}`}
                                    required
                                />
                            </div>
                            <InputError message={errors.national_id} />
                        </div>
                        <div className={isRTL ? "text-right" : ""}>
                            <InputLabel value={isRTL ? "العنوان الشخصي" : "Personal Address"} />
                            <div className="relative mt-1.5">
                                <MapPin className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                <TextInput 
                                    value={data.address} 
                                    onChange={e => setData('address', e.target.value)} 
                                    className={`w-full ${isRTL ? 'pr-11' : 'pl-11'}`}
                                />
                            </div>
                            <InputError message={errors.address} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={isRTL ? "text-right" : ""}>
                            <InputLabel value={isRTL ? "البريد الإلكتروني" : "Email"} />
                            <div className="relative mt-1.5">
                                <Mail className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                <TextInput 
                                    type="email"
                                    value={data.email} 
                                    onChange={e => setData('email', e.target.value)} 
                                    className={`w-full ${isRTL ? 'pr-11' : 'pl-11'}`}
                                    required
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>
                        <div className={isRTL ? "text-right" : ""}>
                            <InputLabel value={isRTL ? "رقم الهاتف" : "Phone"} />
                            <div className="relative mt-1.5">
                                <Phone className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                <TextInput 
                                    value={data.phone} 
                                    onChange={e => setData('phone', e.target.value)} 
                                    className={`w-full ${isRTL ? 'pr-11' : 'pl-11'}`}
                                    required
                                />
                            </div>
                            <InputError message={errors.phone} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                        <div className={isRTL ? "text-right" : ""}>
                            <InputLabel value={isRTL ? "كلمة المرور" : "Password"} />
                            <div className="relative mt-1.5">
                                <Lock className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                <TextInput 
                                    type="password"
                                    value={data.password} 
                                    onChange={e => setData('password', e.target.value)} 
                                    className={`w-full ${isRTL ? 'pr-11' : 'pl-11'}`}
                                    required={managerModal.type === 'add'}
                                    placeholder={managerModal.type === 'edit' ? (isRTL ? "اتركها فارغة لعدم التغيير" : "Leave blank to keep same") : ""}
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>
                        <div className={isRTL ? "text-right" : ""}>
                            <InputLabel value={isRTL ? "تأكيد كلمة المرور" : "Confirm Password"} />
                            <div className="relative mt-1.5">
                                <Lock className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                <TextInput 
                                    type="password"
                                    value={data.password_confirmation} 
                                    onChange={e => setData('password_confirmation', e.target.value)} 
                                    className={`w-full ${isRTL ? 'pr-11' : 'pl-11'}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`p-5 flex justify-end gap-3 border-t ${isDark ? "border-gray-800" : "border-gray-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
                        <SecondaryButton onClick={closeManagerModal}>{isRTL ? "إلغاء" : "Cancel"}</SecondaryButton>
                        <PrimaryButton disabled={processing} className="bg-brand-navy shadow-lg font-bold">
                            {processing ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ البيانات" : "Save Manager")}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>

      </div>
    </AuthenticatedLayout>
  );
}

// ─── Stat Box Component ──────────────────────────────────
function StatBox({ icon, label, value, color, isDark, isRTL }: { icon: any, label: string, value: number, color: string, isDark: boolean, isRTL: boolean }) {
    const colors: any = {
        emerald: "emerald",
        blue: "blue",
        purple: "purple",
        indigo: "indigo"
    };
    const c = colors[color] || 'blue';
    return (
        <motion.div whileHover={{ y: -3 }} className={`p-6 rounded-3xl border ${isDark ? "bg-gray-800/80 border-gray-700" : "bg-white border-gray-100 shadow-sm hover:shadow-md transition-all"} flex flex-col gap-2 ${isRTL ? "text-right" : "text-left"}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDark ? `bg-${c}-500/10 text-${c}-400` : `bg-${c}-50 text-${c}-600`}`}>
                {icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">{label}</p>
            <p className={`text-2xl font-black ${isDark ? "text-white" : "text-brand-navy"}`}>{value}</p>
        </motion.div>
    );
}
