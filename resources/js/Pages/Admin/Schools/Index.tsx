import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import React, { useState, useMemo, useEffect } from "react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { motion, AnimatePresence } from "framer-motion";
import {
  School as SchoolIcon,
  CheckCircle2,
  XCircle,
  MapPin,
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  UserPlus,
  Bus as BusIcon,
  Users as UsersIcon,
  Check,
  X,
  Camera,
  UserCog,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Search,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Map as MapIcon,
  List as ListIcon,
  Filter,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import FieldTripMapPicker from "@/Components/FieldTripMapPicker";
import PlanSelectorGrid from "@/Components/PlanSelectorGrid";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from "react-toastify";
import {
  DS_pageTitle,
  DS_gridCols,
  DS_tableWrapper,
  DS_card,
  DS_tableBase,
  DS_tableHead
} from "@/lib/DS";

// 1. Data Shape
interface School {
  id: number;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  has_transport: number | boolean;
  has_attendance: number | boolean;
  plan_id?: number | null;
  logo?: string;
  buses_count?: number;
  enrollments_count?: number;
}

interface Props {
  schools: School[];
  plans: any[];
}

export default function SchoolsIndex({ schools, plans }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [viewMode, setViewMode] = useState<"grid" | "map" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (school.address && school.address.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || school.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [schools, searchQuery, statusFilter]);

  const counts = useMemo(() => ({
    all: filteredSchools.length,
    active: filteredSchools.filter(s => s.status === "Active").length,
    inactive: filteredSchools.filter(s => s.status !== "Active").length,
  }), [filteredSchools]);

  // --- State Management ---
  const [modalType, setModalType] = useState<"add" | "edit" | null>(null);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  // --- Form Handling ---
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    _method: "post",
    name: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    status: "Active",
    has_transport: true,
    has_attendance: true,
    plan_id: null as number | null,
    logo: null as File | null,

    // Step 2: Admin Info (Clean 5 Fields)
    create_admin: false,
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    admin_password: "",
    admin_password_confirmation: "",
  });

  // --- Handlers ---
  const openAddModal = () => {
    setModalType("add");
    setCurrentSchool(null);
    setCurrentStep(1);
    setPreviewLogo(null);
    clearErrors();
    reset();
    setData({
      _method: "post",
      name: "",
      address: "",
      latitude: null,
      longitude: null,
      status: "Active",
      has_transport: true,
      has_attendance: true,
      plan_id: null,
      logo: null,
      create_admin: false,
      admin_name: "",
      admin_email: "",
      admin_phone: "",
      admin_password: "",
      admin_password_confirmation: "",
    });
  };

  const openEditModal = (school: School) => {
    setModalType("edit");
    setCurrentSchool(school);
    setCurrentStep(1);
    setPreviewLogo(school.logo ? `/storage/${school.logo}` : null);
    clearErrors();
    setData({
      _method: "post",
      name: school.name,
      address: school.address || "",
      latitude: school.latitude ? Number(school.latitude) : null,
      longitude: school.longitude ? Number(school.longitude) : null,
      status: school.status,
      has_transport: true,
      has_attendance: true,
      plan_id: school.plan_id || null,
      logo: null,
      create_admin: false,
      admin_name: "",
      admin_email: "",
      admin_phone: "",
      admin_password: "",
      admin_password_confirmation: "",
    });
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentStep(1);
    setPreviewLogo(null);
    reset();
    clearErrors();
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (modalType === "add") {
      post(route("admin.schools.store"), {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(isRTL ? "تم تسجيل المدرسة بنجاح!" : "School registered successfully!");
          closeModal();
        },
        onError: (errs) => {
          const firstError = Object.values(errs)[0];
          if (firstError) {
            toast.error(firstError as string);
          } else {
            toast.error(isRTL ? "يرجى التحقق من صحة البيانات المدخلة" : "Please check the entered data");
          }
        },
      });
    } else if (modalType === "edit" && currentSchool) {
      router.post(route("admin.schools.update", currentSchool.id), {
        ...data,
        _method: 'PUT'
      }, {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(isRTL ? "تم تحديث بيانات المدرسة بنجاح!" : "School updated successfully!");
          closeModal();
        },
        onError: (errs) => {
          const firstError = Object.values(errs)[0];
          toast.error(firstError ? (firstError as string) : (isRTL ? "فشل التحديث، تأكد من صحة البيانات" : "Update failed"));
        },
      });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData("logo", file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setData("logo", null);
    setPreviewLogo(null);
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
          <div>
            <h2 className={DS_pageTitle}>
              {isRTL ? "إدارة المدارس" : "Schools Management"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isRTL ? "إدارة وتتبع المؤسسات التعليمية، تعيين المدراء، وتخصيص الباقات." : "Manage educational institutions, assign admins, and configure plans."}
            </p>
          </div>

          <PrimaryButton
            onClick={openAddModal}
            className="w-full md:w-auto bg-[#f5b800] text-[#0f2044] hover:bg-yellow-500 shadow-lg px-6 py-2.5 rounded-xl font-black border-none active:scale-95"
          >
            <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? "إضافة مدرسة جديدة" : "Add New School"}
          </PrimaryButton>
        </div>
      }
    >
      <Head title={isRTL ? "المدارس" : "Schools"} />

      <div className={`space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>

        {/* Stats Header */}
        <div className={DS_gridCols}>
          {[
            { label: isRTL ? "إجمالي المدارس" : "Total Schools", value: counts.all, icon: <SchoolIcon className="w-5 h-5" />, color: "blue" as const },
            { label: isRTL ? "مدارس نشطة" : "Active Schools", value: counts.active, icon: <CheckCircle2 className="w-5 h-5" />, color: "green" as const },
            { label: isRTL ? "غير نشطة" : "Inactive Schools", value: counts.inactive, icon: <XCircle className="w-5 h-5" />, color: "orange" as const },
          ].map((stat, i) => (
            <SchoolStatCard key={i} {...stat} isDark={isDark} isRTL={isRTL} />
          ))}
        </div>

        {/* Toolbar Section */}
        <div className={`flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl border ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-100"} shadow-sm`}>
            {/* Search */}
            <div className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${isDark ? "bg-gray-900 border-gray-700 focus-within:border-brand-yellow" : "bg-gray-50 border-gray-200 focus-within:border-brand-navy focus-within:ring-2 focus-within:ring-brand-navy/20"}`}>
                <Search className={`w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                <input
                    type="text"
                    placeholder={isRTL ? "البحث باسم المدرسة أو العنوان..." : "Search by school name or address..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold p-0 w-full"
                />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Status Filter */}
                <div className={`flex items-center px-4 py-2.5 rounded-2xl border transition-all ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                    <Filter className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm font-semibold p-0 w-full md:w-auto min-w-[120px] cursor-pointer"
                    >
                        <option value="all">{isRTL ? "جميع الحالات" : "All Status"}</option>
                        <option value="Active">{isRTL ? "نشطة فقط" : "Active Only"}</option>
                        <option value="Inactive">{isRTL ? "غير نشطة" : "Inactive Only"}</option>
                    </select>
                </div>

                {/* View Toggles */}
                <div className={`flex items-center gap-1 p-1.5 rounded-2xl ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? (isDark ? "bg-brand-yellow/20 text-brand-yellow shadow-sm" : "bg-white text-brand-navy shadow-sm") : "text-gray-400 hover:text-gray-600"}`}
                        title={isRTL ? "شبكة" : "Grid"}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-xl transition-all ${viewMode === "list" ? (isDark ? "bg-brand-yellow/20 text-brand-yellow shadow-sm" : "bg-white text-brand-navy shadow-sm") : "text-gray-400 hover:text-gray-600"}`}
                        title={isRTL ? "قائمة" : "List"}
                    >
                        <ListIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("map")}
                        className={`p-2 rounded-xl transition-all ${viewMode === "map" ? (isDark ? "bg-brand-yellow/20 text-brand-yellow shadow-sm" : "bg-white text-brand-navy shadow-sm") : "text-gray-400 hover:text-gray-600"}`}
                        title={isRTL ? "خريطة" : "Map"}
                    >
                        <MapIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        {/* Schools Content */}
        {filteredSchools.length === 0 ? (
            <div className={`p-12 rounded-[28px] border-2 border-dashed flex flex-col items-center justify-center ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-100"}`}>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
                    <SchoolIcon className={`w-10 h-10 ${isDark ? "text-gray-500" : "text-gray-300"}`} />
                </div>
                <h4 className={`text-lg font-bold ${isDark ? "text-white" : "text-brand-navy"}`}>
                    {isRTL ? "لا توجد مدارس مسجلة" : "No Schools Registered"}
                </h4>
                <p className={`text-sm mt-2 mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {isRTL ? "ابدأ بإضافة أول مدرسة للنظام الآن" : "Start by adding the first school to the system"}
                </p>
                <PrimaryButton onClick={openAddModal} className="bg-brand-navy text-white px-8">
                    {isRTL ? "إضافة مدرسة" : "Add School"}
                </PrimaryButton>
            </div>
        ) : viewMode === "map" ? (
            <div className="h-[600px] rounded-[32px] overflow-hidden border-2 border-white dark:border-gray-800 shadow-2xl relative">
                <SchoolsDistributionMap schools={filteredSchools} isDark={isDark} isRTL={isRTL} />
            </div>
        ) : viewMode === "list" ? (
            <div className={DS_tableWrapper + " " + DS_card}>
                <table className={DS_tableBase}>
                    <thead className={DS_tableHead}>
                        <tr>
                            <th className="px-6 py-4">{isRTL ? "المدرسة" : "School"}</th>
                            <th className="px-6 py-4">{isRTL ? "الموقع" : "Location"}</th>
                            <th className="px-6 py-4 text-center">{isRTL ? "الحالة" : "Status"}</th>
                            <th className="px-6 py-4 text-center">{isRTL ? "الحافلات" : "Buses"}</th>
                            <th className="px-6 py-4 text-center">{isRTL ? "الطلاب" : "Students"}</th>
                            <th className="px-6 py-4 text-center">{isRTL ? "إجراءات" : "Actions"}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredSchools.map(school => (
                            <SchoolListRow
                                key={school.id}
                                school={school}
                                isDark={isDark}
                                isRTL={isRTL}
                                onEdit={() => openEditModal(school)}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className={DS_gridCols}>
                {filteredSchools.map((school) => (
                    <SchoolCard
                        key={school.id}
                        school={school}
                        isDark={isDark}
                        isRTL={isRTL}
                        onEdit={() => openEditModal(school)}
                    />
                ))}
            </div>
        )}

        {/* ─── FULL VIEW RESPONSIVE 4XL MODAL ─── */}
        <Modal show={modalType !== null} onClose={closeModal} maxWidth="4xl">
            <div className={`relative ${isDark ? "bg-gray-900 border border-gray-700 text-gray-100" : "bg-white text-gray-800"} rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300`}>

                {/* Close Button */}
                <button
                    type="button"
                    onClick={closeModal}
                    className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors z-50`}
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Modal Header & Stepper */}
                <div className={`px-8 pt-8 pb-6 border-b ${isDark ? "border-gray-800 bg-gray-900/60" : "border-gray-100 bg-gray-50/60"}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-brand-yellow/10 text-brand-dark dark:text-brand-yellow border border-brand-yellow/20">
                            <SchoolIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">
                                {modalType === 'edit' ? (isRTL ? "تعديل بيانات المدرسة" : "Edit School") : (isRTL ? "تسجيل مدرسة جديدة" : "Register New School")}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {modalType === 'edit'
                                    ? (isRTL ? "تحديث الموقع والبيانات الأساسية للمدرسة" : "Update location and basic information")
                                    : (isRTL ? "إضافة المدرسة وتعيين مديرها وخطة الاشتراك بكل سهولة" : "Add school, optional manager, and subscription")}
                            </p>
                        </div>
                    </div>

                    {/* Stepper UI (Only for Add) */}
                    {modalType === 'add' && (
                        <div className="mt-6 flex items-center justify-center gap-2 sm:gap-4">
                            <StepBubble num={1} active={currentStep === 1} done={currentStep > 1} label={isRTL ? "بيانات المدرسة" : "School Info"} isRTL={isRTL} isDark={isDark} onClick={() => setCurrentStep(1)} />
                            <div className={`h-0.5 w-12 sm:w-20 rounded-full transition-colors ${currentStep > 1 ? "bg-brand-yellow" : "bg-gray-200 dark:bg-gray-700"}`} />
                            <StepBubble num={2} active={currentStep === 2} done={currentStep > 2} label={isRTL ? "مدير المدرسة (اختياري)" : "Manager (Optional)"} isRTL={isRTL} isDark={isDark} onClick={() => setCurrentStep(2)} />
                            <div className={`h-0.5 w-12 sm:w-20 rounded-full transition-colors ${currentStep > 2 ? "bg-brand-yellow" : "bg-gray-200 dark:bg-gray-700"}`} />
                            <StepBubble num={3} active={currentStep === 3} done={false} label={isRTL ? "خطة الاشتراك" : "Subscription"} isRTL={isRTL} isDark={isDark} onClick={() => setCurrentStep(3)} />
                        </div>
                    )}
                </div>

                <form onSubmit={submitForm}>
                    <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {/* ── STEP 1: SCHOOL BASIC INFO & MAP ── */}
                            {currentStep === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                                >
                                    {/* Left Column: Form Fields (7 cols) */}
                                    <div className="lg:col-span-7 space-y-5">
                                        {/* Logo Upload */}
                                        <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                                            <div className="group relative w-20 h-20 flex-shrink-0">
                                                <div className={`w-full h-full rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 transition-colors ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                                                    {previewLogo ? (
                                                        <img src={previewLogo} className="w-full h-full object-cover" alt="Logo" />
                                                    ) : (
                                                        <Camera className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>
                                                {previewLogo && (
                                                    <button
                                                        type="button"
                                                        onClick={removeLogo}
                                                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className={isRTL ? "text-right" : "text-left"}>
                                                <h4 className="font-bold text-sm">
                                                    {isRTL ? "شعار المدرسة" : "School Logo"}
                                                </h4>
                                                <p className="text-xs text-gray-400 mb-2">{isRTL ? "PNG, JPG حتى 2MB (اختياري)" : "PNG, JPG up to 2MB (Optional)"}</p>
                                                <label className="cursor-pointer inline-flex items-center gap-1.5 bg-brand-navy text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
                                                    <Camera className="w-3.5 h-3.5" />
                                                    <span>{isRTL ? "اختيار صورة" : "Choose Image"}</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                                </label>
                                            </div>
                                        </div>

                                        {/* School Name */}
                                        <div className={isRTL ? "text-right" : ""}>
                                            <InputLabel value={isRTL ? "اسم المدرسة *" : "School Name *"} />
                                            <TextInput
                                                value={data.name}
                                                onChange={e => setData("name", e.target.value)}
                                                className={`w-full mt-1.5 ${errors.name ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}
                                                placeholder={isRTL ? "مثال: مدرسة مسقط الحديثة" : "e.g. Muscat Modern School"}
                                                required
                                            />
                                            <InputError message={errors.name} className="mt-1" />
                                        </div>

                                        {/* Address & Status in 2 cols */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className={isRTL ? "text-right" : ""}>
                                                <InputLabel value={isRTL ? "عنوان المدرسة" : "Address / City"} />
                                                <TextInput
                                                    value={data.address}
                                                    onChange={e => setData("address", e.target.value)}
                                                    className={`w-full mt-1.5 ${errors.address ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}
                                                    placeholder={isRTL ? "المدينة، الحي..." : "City, District..."}
                                                />
                                                <InputError message={errors.address} className="mt-1" />
                                            </div>

                                            <div className={isRTL ? "text-right" : ""}>
                                                <InputLabel value={isRTL ? "حالة المدرسة" : "Status"} />
                                                <select
                                                    value={data.status}
                                                    onChange={e => setData('status', e.target.value)}
                                                    className={`w-full rounded-xl mt-1.5 border-none h-[42px] px-4 text-sm font-semibold transition-all ${isDark ? "bg-gray-800 text-white ring-1 ring-gray-700 focus:ring-brand-yellow" : "bg-gray-50 text-gray-800 ring-1 ring-gray-200 focus:ring-brand-navy"}`}
                                                >
                                                    <option value="Active">{isRTL ? "نشطة" : "Active"}</option>
                                                    <option value="Inactive">{isRTL ? "غير نشطة" : "Inactive"}</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Map Location Picker (5 cols) */}
                                    <div className="lg:col-span-5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                {isRTL ? "موقع المدرسة على الخريطة" : "Location on Map"}
                                            </span>
                                            {(data.latitude && data.longitude) ? (
                                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                    <Check className="w-3.5 h-3.5" />
                                                    {isRTL ? "تم التحديد" : "Selected"}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-gray-400">
                                                    {isRTL ? "اضغط على الخريطة للتحديد" : "Click to select"}
                                                </span>
                                            )}
                                        </div>

                                        <div className="h-[230px] rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 shadow-inner">
                                            <FieldTripMapPicker
                                                lat={data.latitude}
                                                lng={data.longitude}
                                                isDark={isDark}
                                                isRtl={isRTL}
                                                onChange={(lat, lng, address) => {
                                                    setData(prev => ({
                                                        ...prev,
                                                        latitude: lat,
                                                        longitude: lng,
                                                        address: prev.address || address
                                                    }));
                                                }}
                                            />
                                        </div>
                                        <InputError message={errors.latitude} className="mt-1" />
                                    </div>
                                </motion.div>
                            ) : currentStep === 2 && modalType === 'add' ? (
                                /* ── STEP 2: OPTIONAL SCHOOL ADMIN (CLEAN 5 FIELDS) ── */
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {/* Optional Toggle Card */}
                                    <div className={`p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                        data.create_admin
                                            ? "bg-brand-navy/5 dark:bg-brand-navy/30 border-brand-yellow/40"
                                            : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700"
                                    }`}>
                                        <div className="flex items-center gap-3.5">
                                            <div className={`p-3 rounded-2xl ${data.create_admin ? "bg-brand-yellow text-brand-dark" : "bg-gray-200 dark:bg-gray-700 text-gray-500"}`}>
                                                <UserCog className="w-5 h-5" />
                                            </div>
                                            <div className={isRTL ? "text-right" : ""}>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                                    {isRTL ? "تعيين مدير للمدرسة الآن" : "Assign School Admin Now"}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {data.create_admin
                                                        ? (isRTL ? "سيتم إنشاء حساب للمدير بصلاحيات كاملة للوصول إلى لوحة المدرسة" : "A manager account will be created with full access to school dashboard")
                                                        : (isRTL ? "اختياري: يمكنك إنشاء المدرسة بدون مدير الآن وتعيينه لاحقاً" : "Optional: You can create the school now and assign a manager later")}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Toggle Switch */}
                                        <button
                                            type="button"
                                            dir="ltr"
                                            onClick={() => setData("create_admin", !data.create_admin)}
                                            className={`relative inline-flex h-7 w-13 items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer flex-shrink-0 ${
                                                data.create_admin ? "bg-brand-yellow" : "bg-gray-300 dark:bg-gray-700"
                                            }`}
                                            role="switch"
                                            aria-checked={data.create_admin}
                                        >
                                            <motion.div
                                                layout
                                                transition={{ type: "spring", stiffness: 600, damping: 35 }}
                                                className={`h-6 w-6 rounded-full shadow-md flex items-center justify-center ${
                                                    data.create_admin ? "bg-brand-dark text-brand-yellow ml-auto" : "bg-white text-gray-400 mr-auto"
                                                }`}
                                            >
                                                {data.create_admin && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </motion.div>
                                        </button>
                                    </div>

                                    {/* Exact 5 Clean Admin Fields matching SchoolUsers/Create.tsx */}
                                    {data.create_admin ? (
                                        <div className="space-y-4 pt-2">
                                            {/* Full Name */}
                                            <div className={isRTL ? "text-right" : ""}>
                                                <InputLabel value={isRTL ? "اسم المدير الكامل *" : "Manager Full Name *"} />
                                                <div className="relative">
                                                    <UserCog className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                                    <TextInput
                                                        value={data.admin_name}
                                                        onChange={e => setData("admin_name", e.target.value)}
                                                        className={`w-full mt-1.5 ${isRTL ? 'pr-11' : 'pl-11'} ${errors.admin_name ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}
                                                        placeholder={isRTL ? "مثال: أحمد بن سعيد البوسعيدي" : "Full Name"}
                                                        required={data.create_admin}
                                                    />
                                                </div>
                                                <InputError message={errors.admin_name} className="mt-1" />
                                            </div>

                                            {/* Email & Phone */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className={isRTL ? "text-right" : ""}>
                                                    <InputLabel value={isRTL ? "البريد الإلكتروني للمدير *" : "Email Address *"} />
                                                    <div className="relative">
                                                        <Mail className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                                        <TextInput
                                                            type="email"
                                                            value={data.admin_email}
                                                            onChange={e => setData("admin_email", e.target.value)}
                                                            className={`w-full mt-1.5 ${isRTL ? 'pr-11' : 'pl-11'} ${errors.admin_email ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}
                                                            placeholder="admin@school.com"
                                                            required={data.create_admin}
                                                        />
                                                    </div>
                                                    <InputError message={errors.admin_email} className="mt-1" />
                                                </div>

                                                <div className={isRTL ? "text-right" : ""}>
                                                    <InputLabel value={isRTL ? "رقم الهاتف *" : "Phone Number *"} />
                                                    <div className="relative">
                                                        <Phone className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                                        <TextInput
                                                            value={data.admin_phone}
                                                            onChange={e => setData("admin_phone", e.target.value)}
                                                            className={`w-full mt-1.5 ${isRTL ? 'pr-11' : 'pl-11'} ${errors.admin_phone ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}
                                                            placeholder="968XXXXXXXX"
                                                            required={data.create_admin}
                                                        />
                                                    </div>
                                                    <InputError message={errors.admin_phone} className="mt-1" />
                                                </div>
                                            </div>

                                            {/* Passwords */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className={isRTL ? "text-right" : ""}>
                                                    <InputLabel value={isRTL ? "كلمة المرور *" : "Password *"} />
                                                    <div className="relative">
                                                        <Lock className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                                        <TextInput
                                                            type="password"
                                                            value={data.admin_password}
                                                            onChange={e => setData("admin_password", e.target.value)}
                                                            className={`w-full mt-1.5 ${isRTL ? 'pr-11' : 'pl-11'} ${errors.admin_password ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}
                                                            placeholder="••••••••"
                                                            required={data.create_admin}
                                                        />
                                                    </div>
                                                    <InputError message={errors.admin_password} className="mt-1" />
                                                </div>

                                                <div className={isRTL ? "text-right" : ""}>
                                                    <InputLabel value={isRTL ? "تأكيد كلمة المرور *" : "Confirm Password *"} />
                                                    <div className="relative">
                                                        <Lock className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                                        <TextInput
                                                            type="password"
                                                            value={data.admin_password_confirmation}
                                                            onChange={e => setData("admin_password_confirmation", e.target.value)}
                                                            className={`w-full mt-1.5 ${isRTL ? 'pr-11' : 'pl-11'}`}
                                                            placeholder="••••••••"
                                                            required={data.create_admin}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                            <UserPlus className="w-10 h-10 mx-auto text-gray-400 mb-2 opacity-50" />
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                {isRTL ? "تم تخطي إضافة مدير المدرسة حالياً" : "Skipping manager creation"}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                                                {isRTL ? "يمكنك إنشاء وتعيين مدير للمدرسة في أي وقت لاحقاً من قائمة إدارة مدراء المدارس." : "You can assign a manager anytime later from the School Admins page."}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                /* ── STEP 3: SUBSCRIPTION PLAN (OPTIONAL & ACTIVATED) ── */
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-sm">
                                                {isRTL ? "اختر باقة الاشتراك للمدرسة (اختياري)" : "Select Subscription Plan (Optional)"}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {isRTL ? "عند اختيار باقة، سيتم تفعيل اشتراك المدرسة مباشرة بنجاح." : "Selecting a plan will immediately activate the school subscription."}
                                            </p>
                                        </div>

                                        {data.plan_id && (
                                            <button
                                                type="button"
                                                onClick={() => setData("plan_id", null)}
                                                className="text-xs font-bold text-rose-500 hover:underline"
                                            >
                                                {isRTL ? "إلغاء التحديد (بدون باقة)" : "Clear selection"}
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className={isRTL ? "text-right" : "text-left"}>
                                        <PlanSelectorGrid 
                                            plans={plans}
                                            selectedId={data.plan_id}
                                            onSelect={(id) => setData("plan_id", id)}
                                        />
                                        <InputError message={errors.plan_id} className="mt-2" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Navigation Actions */}
                    <div className={`px-8 py-4 border-t flex justify-between items-center ${isDark ? "bg-gray-800/40 border-gray-800" : "bg-gray-50/80 border-gray-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
                        {currentStep === 1 ? (
                            <button
                                type="button"
                                onClick={closeModal}
                                className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}
                            >
                                {isRTL ? "إلغاء" : "Cancel"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className={`inline-flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-xl border transition-colors ${isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                            >
                                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                                <span>{isRTL ? "السابق" : "Previous"}</span>
                            </button>
                        )}

                        <div className="flex items-center gap-3">
                            {modalType === 'add' && currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (currentStep === 1 && !data.name.trim()) {
                                            toast.error(isRTL ? "يرجى إدخال اسم المدرسة أولاً" : "Please enter school name");
                                            return;
                                        }
                                        setCurrentStep(currentStep + 1);
                                    }}
                                    className="bg-brand-navy text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1 shadow-sm active:scale-95"
                                >
                                    <span>{isRTL ? "متابعة" : "Next"}</span>
                                    {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-brand-yellow text-brand-dark px-7 py-2.5 rounded-xl text-xs font-black hover:bg-yellow-400 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>{isRTL ? "جاري الحفظ..." : "Saving..."}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 stroke-[3]" />
                                            <span>
                                                {modalType === 'edit'
                                                    ? (isRTL ? "حفظ التعديلات" : "Save Changes")
                                                    : (isRTL ? "إتمام وتسجيل المدرسة" : "Complete Registration")}
                                            </span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}

// ─── HELPER COMPONENTS ─────────────────────────────────

function SchoolCard({ school, isDark, isRTL, onEdit }: { school: School; isDark: boolean; isRTL: boolean; onEdit: () => void }) {
    const [localStatus, setLocalStatus] = useState(school.status);

    useEffect(() => {
        setLocalStatus(school.status);
    }, [school.status]);

    const toggleStatus = () => {
        const nextStatus = localStatus === 'Active' ? 'Inactive' : 'Active';
        setLocalStatus(nextStatus);

        router.post(route('admin.schools.toggle', school.id), {}, {
            preserveScroll: true,
            onError: () => setLocalStatus(school.status)
        });
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={`rounded-[2rem] border overflow-hidden transition-all duration-300 ${isDark ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800 shadow-xl" : "bg-white border-gray-100 shadow-sm hover:shadow-xl group"}`}
        >
            <div className={`h-24 relative ${localStatus === 'Active' ? 'bg-gradient-to-r from-brand-navy to-[#041b3a]' : 'bg-gray-600'}`}>
                {/* Status Badge */}
                <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`}>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 ${localStatus === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/20 text-white border border-white/30'}`}>
                        {localStatus === 'Active' ? (isRTL ? "نشطة" : "Active") : (isRTL ? "غير نشطة" : "Inactive")}
                    </span>
                </div>

                {/* Logo Overlapping */}
                <div className={`absolute -bottom-8 ${isRTL ? 'right-6' : 'left-6'} w-[72px] h-[72px] rounded-2xl border-[3px] ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-white'} shadow-lg overflow-hidden flex items-center justify-center p-1.5 z-10`}>
                    {school.logo ? (
                        <img src={`/storage/${school.logo}`} className="w-full h-full object-contain" alt={school.name} />
                    ) : (
                        <SchoolIcon className={`w-7 h-7 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    )}
                </div>
            </div>

            <div className="pt-11 px-6 pb-6 space-y-4">
                <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                    <h4 className={`text-lg font-black truncate ${isDark ? "text-white" : "text-brand-navy"}`}>{school.name}</h4>
                    <p className={`text-xs flex items-center gap-1 mt-1 ${isDark ? "text-gray-400" : "text-gray-500"} ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{school.address || (isRTL ? "موقع غير محدد" : "No location")}</span>
                    </p>
                </div>

                {/* Metrics Stats Pill */}
                <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-xs`}>
                    <div className="flex items-center gap-2 justify-center">
                        <BusIcon className="w-4 h-4 text-blue-500" />
                        <span className="font-mono font-bold">{school.buses_count || 0}</span>
                        <span className="text-gray-400 text-[11px]">{isRTL ? "حافلة" : "Buses"}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center border-s border-gray-200 dark:border-gray-700">
                        <UsersIcon className="w-4 h-4 text-emerald-500" />
                        <span className="font-mono font-bold">{school.enrollments_count || 0}</span>
                        <span className="text-gray-400 text-[11px]">{isRTL ? "طالب" : "Students"}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className={`grid grid-cols-2 gap-2.5 pt-2 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                    <Link
                        href={route('admin.schools.show', school.id)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-brand-navy/5 text-brand-navy hover:bg-brand-navy/10'}`}
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{isRTL ? "التفاصيل" : "Details"}</span>
                    </Link>
                    <button
                        onClick={onEdit}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-brand-yellow/20 text-brand-yellow hover:bg-brand-yellow/30' : 'bg-brand-yellow text-brand-dark hover:bg-yellow-400 shadow-sm'}`}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>{isRTL ? "تعديل" : "Edit"}</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function StepBubble({ num, active, done, label, isRTL, isDark, onClick }: { num: number, active: boolean, done: boolean, label: string, isRTL: boolean, isDark: boolean, onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                active
                    ? "bg-brand-yellow text-brand-dark scale-105 shadow-md shadow-brand-yellow/20 ring-2 ring-brand-yellow/40"
                    : done
                    ? "bg-emerald-500 text-white"
                    : (isDark ? "bg-gray-800 text-gray-500 group-hover:text-gray-300" : "bg-gray-100 text-gray-400 group-hover:text-gray-600")
            }`}>
                {done ? <Check className="w-4 h-4 stroke-[3]" /> : num}
            </div>
            <span className={`text-xs font-bold hidden sm:inline transition-colors ${active ? (isDark ? 'text-white' : 'text-brand-navy') : (done ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400')}`}>
                {label}
            </span>
        </button>
    );
}

function SchoolListRow({ school, isDark, isRTL, onEdit }: { school: School; isDark: boolean; isRTL: boolean; onEdit: () => void }) {
    const [localStatus, setLocalStatus] = useState(school.status);

    useEffect(() => {
        setLocalStatus(school.status);
    }, [school.status]);

    const toggleStatus = () => {
        const nextStatus = localStatus === 'Active' ? 'Inactive' : 'Active';
        setLocalStatus(nextStatus);

        router.post(route('admin.schools.toggle', school.id), {}, {
            preserveScroll: true,
            onError: () => setLocalStatus(school.status)
        });
    };

    return (
        <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <td className="px-6 py-4">
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-11 h-11 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} flex items-center justify-center p-1.5 shrink-0 shadow-sm`}>
                        {school.logo ? (
                            <img src={`/storage/${school.logo}`} className="w-full h-full object-contain" alt={school.name} />
                        ) : (
                            <SchoolIcon className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        )}
                    </div>
                    <div className={isRTL ? "text-right" : "text-left"}>
                        <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-brand-navy'}`}>{school.name}</div>
                        <div className={`text-xs text-gray-400 mt-0.5`}>{school.address || (isRTL ? "موقع غير محدد" : "No location")}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className={`flex items-center gap-1.5 text-xs ${isRTL ? 'flex-row-reverse text-right' : 'text-left'} ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    <span className="truncate max-w-[200px]">{school.address || "—"}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-center">
                <button
                    onClick={toggleStatus}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                        localStatus === 'Active'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    } ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${localStatus === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                    {localStatus === 'Active' ? (isRTL ? "نشطة" : "Active") : (isRTL ? "غير نشطة" : "Inactive")}
                </button>
            </td>
            <td className="px-6 py-4 text-center font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                {school.buses_count || 0}
            </td>
            <td className="px-6 py-4 text-center font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                {school.enrollments_count || 0}
            </td>
            <td className="px-6 py-4">
                <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Link
                        href={route('admin.schools.show', school.id)}
                        className={`p-2 rounded-xl transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'}`}
                        title={isRTL ? "التفاصيل" : "Details"}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                        onClick={onEdit}
                        className={`p-2 rounded-xl transition-all ${isDark ? 'bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-yellow' : 'bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-dark'}`}
                        title={isRTL ? "تعديل" : "Edit"}
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function SchoolStatCard({ label, value, icon, color, isDark, isRTL }: {
    label: string; value: number; icon: React.ReactNode;
    color: 'blue' | 'green' | 'orange'; isDark: boolean; isRTL: boolean;
}) {
  const colorMap = {
    blue: isDark ? "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20" : "from-blue-50 to-white text-blue-600 border-blue-100",
    green: isDark ? "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20" : "from-emerald-50 to-white text-emerald-600 border-emerald-100",
    orange: isDark ? "from-orange-500/20 to-orange-600/5 text-orange-400 border-orange-500/20" : "from-orange-50 to-white text-orange-600 border-orange-100",
  };

  const iconBgMap = {
    blue: isDark ? "bg-blue-500/20" : "bg-blue-100/50",
    green: isDark ? "bg-emerald-500/20" : "bg-emerald-100/50",
    orange: isDark ? "bg-orange-500/20" : "bg-orange-100/50",
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className={`p-6 rounded-[2rem] border flex items-center gap-5 transition-all bg-gradient-to-br ${colorMap[color]} shadow-sm hover:shadow-lg ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${iconBgMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className={`text-[11px] font-black uppercase tracking-widest ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}>{label}</p>
        <p className={`text-3xl font-black mt-1 ${
          isDark ? "text-white" : "text-brand-navy"
        }`}>{value}</p>
      </div>
    </motion.div>
  );
}

function SchoolsDistributionMap({ schools, isDark, isRTL }: { schools: School[], isDark: boolean, isRTL: boolean }) {
    const validSchools = schools.filter(s => s.latitude && s.longitude);

    const center = useMemo(() => {
        if (validSchools.length === 0) return [23.5859, 58.4059] as [number, number];
        const lat = validSchools.reduce((sum, s) => sum + Number(s.latitude), 0) / validSchools.length;
        const lng = validSchools.reduce((sum, s) => sum + Number(s.longitude), 0) / validSchools.length;
        return [lat, lng] as [number, number];
    }, [validSchools]);

    const schoolIcon = L.divIcon({
        html: `
            <div style="
                width:40px;height:40px;
                background:#0f2044;
                border-radius:12px;
                display:flex;align-items:center;justify-content:center;
                border:3px solid white;
                box-shadow:0 10px 15px -3px rgba(0,0,0,0.3);
                font-size:20px;
                color:#f5b800;
            ">
                🏛
            </div>
        `,
        className: 'custom-school-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });

    return (
        <MapContainer
            center={center}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {validSchools.map(school => (
                <Marker
                    key={school.id}
                    position={[Number(school.latitude), Number(school.longitude)]}
                    icon={schoolIcon}
                >
                    <Popup minWidth={220} className="custom-modern-popup">
                        <div className={`p-4 ${isRTL ? 'text-right' : 'text-left'} dir-${isRTL ? 'rtl' : 'ltr'}`}>
                            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-navy/10 flex items-center justify-center p-1.5">
                                    {school.logo ? (
                                        <img src={`/storage/${school.logo}`} className="w-full h-full object-contain" />
                                    ) : (
                                        <SchoolIcon className="w-5 h-5 text-brand-navy" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-black text-sm text-gray-900 leading-tight">{school.name}</h4>
                                    <p className="text-[9px] text-gray-400 font-bold flex items-center gap-0.5 mt-0.5">
                                        <MapPin className="w-2.5 h-2.5" />
                                        {school.address?.substring(0, 25)}...
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-blue-50/50 p-2 rounded-2xl border border-blue-100/50 text-center">
                                    <p className="text-[8px] font-black text-blue-400 uppercase mb-0.5">{isRTL ? 'الباصات' : 'Buses'}</p>
                                    <p className="text-sm font-black text-blue-600">{school.buses_count || 0}</p>
                                </div>
                                <div className="bg-emerald-50/50 p-2 rounded-2xl border border-emerald-100/50 text-center">
                                    <p className="text-[8px] font-black text-emerald-400 uppercase mb-0.5">{isRTL ? 'الطلاب' : 'Students'}</p>
                                    <p className="text-sm font-black text-emerald-600">{school.enrollments_count || 0}</p>
                                </div>
                            </div>

                            <Link
                                href={route('admin.schools.show', school.id)}
                                className="w-full py-2 bg-brand-navy text-white text-[10px] font-black rounded-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-navy/20"
                            >
                                {isRTL ? 'عرض التفاصيل والتقارير' : 'View Details & Reports'}
                                {isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </Link>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
