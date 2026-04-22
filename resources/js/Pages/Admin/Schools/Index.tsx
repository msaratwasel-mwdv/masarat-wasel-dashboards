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
  ClipboardList,
  Check,
  X,
  Camera,
  UserCog,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Search,
  Fingerprint,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Map as MapIcon,
  List as ListIcon,
  Filter,
} from "lucide-react";
import FieldTripMapPicker from "@/Components/FieldTripMapPicker";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  ControlPosition,
  MapControl
} from '@vis.gl/react-google-maps';

// 1. Data Shape
interface School {
  id: number;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  has_transport: number;
  has_attendance: number;
  logo?: string;
  buses_count?: number;
  enrollments_count?: number;
}

interface Props {
  schools: School[];
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const lightMapStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#f8fafc" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#e2e8f0" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#cbd5e1" }] }
];

const darkMapStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#12151a" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#5e6a7e" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#12151a" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#2c3544" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#1e2531" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0a0c10" }] }
];

export default function SchoolsIndex({ schools }: Props) {
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
    logo: null as File | null,

    // Step 2: Admin Info
    create_admin: false,
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    admin_national_id: "",
    admin_address: "",
    admin_image: null as File | null,
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
    setData("_method", "post");
    setData("latitude", null);
    setData("longitude", null);
  };

  const openEditModal = (school: School) => {
    setModalType("edit");
    setCurrentSchool(school);
    setCurrentStep(1);
    setPreviewLogo(school.logo ? `/storage/${school.logo}` : null);
    clearErrors();
    setData({
      _method: "post", // Using post with _method=put for file updates
      name: school.name,
      address: school.address || "",
      latitude: school.latitude ? Number(school.latitude) : null,
      longitude: school.longitude ? Number(school.longitude) : null,
      status: school.status,
      has_transport: school.has_transport === 1 || school.has_transport === true,
      has_attendance: school.has_attendance === 1 || school.has_attendance === true,
      logo: null,
      create_admin: false,
      admin_name: "",
      admin_email: "",
      admin_phone: "",
      admin_national_id: "",
      admin_address: "",
      admin_image: null,
      admin_password: "",
      admin_password_confirmation: "",
    });
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentStep(1);
    setPreviewLogo(null);
    reset();
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === "add") {
      post(route("admin.schools.store"), {
        forceFormData: true,
        onSuccess: () => closeModal(),
      });
    } else if (modalType === "edit" && currentSchool) {
      // In Laravel, file uploads with PUT/PATCH must be sent via POST with _method spoofing
      // Adding _method directly to the request data to avoid state update delays
      router.post(route("admin.schools.update", currentSchool.id), {
        ...data,
        _method: 'PUT'
      }, {
        forceFormData: true,
        onSuccess: () => closeModal(),
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
        <div className={`flex justify-between items-center w-full ${isRTL ? "flex-row" : "flex-row"}`}>
          <h2 className={`font-bold text-xl ${isDark ? "text-gray-200" : "text-gray-800"}`}>
            {isRTL ? "إدارة المدارس" : "Schools Management"}
          </h2>

          <PrimaryButton
            onClick={openAddModal}
            className="bg-brand-yellow text-brand-dark hover:bg-yellow-500 shadow-lg px-6 py-2 rounded-xl font-bold border-none"
          >
            {isRTL ? "إضافة مدرسة" : "Add School"}
          </PrimaryButton>
        </div>
      }
    >
      <Head title={isRTL ? "المدارس" : "Schools"} />

      <div className={`space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>

        {/* Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: isRTL ? "إجمالي المدارس" : "Total Schools", value: counts.all, icon: <SchoolIcon className="w-5 h-5" />, color: "blue" as const },
            { label: isRTL ? "مدارس نشطة" : "Active Schools", value: counts.active, icon: <CheckCircle2 className="w-5 h-5" />, color: "green" as const },
            { label: isRTL ? "غير نشطة" : "Inactive Schools", value: counts.inactive, icon: <XCircle className="w-5 h-5" />, color: "orange" as const },
          ].map((stat, i) => (
            <SchoolStatCard key={i} {...stat} isDark={isDark} isRTL={isRTL} />
          ))}
        </div>

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

        {/* Existing Grid or Empty State */}
        {filteredSchools.length === 0 ? (
            <div className={`p-12 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-100"}`}>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
                    <SchoolIcon className={`w-10 h-10 ${isDark ? "text-gray-500" : "text-gray-300"}`} />
                </div>
                <h4 className={`text-lg font-bold ${isDark ? "text-white" : "text-brand-navy"}`}>
                    {isRTL ? "لا يوجد مدارس مسجلة" : "No Schools Registered"}
                </h4>
                <p className={`text-sm mt-2 mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {isRTL ? "ابدأ بإضافة أول مدرسة للنظام الآن" : "Start by adding the first school to the system"}
                </p>
                <PrimaryButton onClick={openAddModal} className="bg-brand-navy text-white px-8">
                    {isRTL ? "إضافة مدرسة" : "Add School"}
                </PrimaryButton>
            </div>
        ) : viewMode === "map" ? (
            <div className="h-[600px] rounded-[35px] overflow-hidden border-2 border-white dark:border-gray-800 shadow-2xl relative">
                <SchoolsDistributionMap schools={filteredSchools} isDark={isDark} isRTL={isRTL} />
            </div>
        ) : viewMode === "list" ? (
            <div className="overflow-x-auto rounded-3xl border shadow-sm dark:border-gray-700 dark:bg-gray-800 bg-white">
                <table className={`w-full text-sm ${isRTL ? "text-right" : "text-left"}`}>
                    <thead className={`text-xs font-bold uppercase ${isDark ? "bg-gray-900/50 text-gray-400 border-b border-gray-700" : "bg-gray-50/50 text-gray-500 border-b border-gray-100"}`}>
                        <tr>
                            <th className="px-6 py-4">{isRTL ? "المدرسة" : "School"}</th>
                            <th className="px-6 py-4">{isRTL ? "الموقع" : "Location"}</th>
                            <th className="px-6 py-4 text-center">{isRTL ? "الحالة" : "Status"}</th>
                            <th className="px-6 py-4 text-center">{isRTL ? "الخدمات" : "Services"}</th>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* ENHANCED 2-STEP MODAL */}
        <Modal show={modalType !== null} onClose={closeModal} maxWidth="2xl">
            <div className={`relative ${isDark ? "bg-gray-900 border border-gray-700" : "bg-white"} rounded-2xl overflow-hidden shadow-2xl transition-all duration-300`}>

                {/* Close Button */}
                <button
                    onClick={closeModal}
                    className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} p-2 rounded-full hover:bg-gray-100 ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'text-gray-400'} z-50`}
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Modal Header */}
                <div className={`p-8 border-b ${isDark ? "border-gray-800 bg-gray-900/50" : "border-gray-100 bg-gray-50/50"}`}>
                    <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-brand-navy"}`}>
                        {modalType === 'edit' ? (isRTL ? "تعديل بيانات المدرسة" : "Edit School") : (isRTL ? "تسجيل مدرسة جديدة" : "Register New School")}
                    </h2>

                    {/* Stepper UI (Only for Add) */}
                    {modalType === 'add' && (
                        <div className="mt-8 relative px-12">
                            <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-1 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                            <div className="absolute left-12 top-1/2 -translate-y-1/2 h-1 bg-brand-yellow rounded-full transition-all duration-500" style={{ width: currentStep === 1 ? '0%' : '100%' }}></div>

                            <div className="flex justify-between relative z-10">
                                <StepBubble num={1} active={currentStep >= 1} label={isRTL ? "المدرسة" : "School"} isRTL={isRTL} isDark={isDark} />
                                <StepBubble num={2} active={currentStep >= 2} label={isRTL ? "المدير" : "Manager"} isRTL={isRTL} isDark={isDark} />
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={submitForm}>
                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                                    className="space-y-6"
                                >
                                    {/* Logo Upload */}
                                    <div className={`flex items-center gap-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                                        <div className="group relative w-24 h-24">
                                            <div className={`w-full h-full rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 transition-colors ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                                                {previewLogo ? (
                                                    <img src={previewLogo} className="w-full h-full object-cover" alt="Logo" />
                                                ) : (
                                                    <Camera className="w-8 h-8 text-gray-300" />
                                                )}
                                            </div>
                                            {previewLogo && (
                                                <button
                                                    type="button"
                                                    onClick={removeLogo}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        <div className={isRTL ? "text-right" : "text-left"}>
                                            <h4 className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-700"}`}>
                                                {isRTL ? "شعار المدرسة" : "School Logo"}
                                            </h4>
                                            <p className="text-xs text-gray-400 mb-3">{isRTL ? "PNG, JPG حتى 2MB" : "PNG, JPG up to 2MB"}</p>
                                            <label className="cursor-pointer bg-brand-navy text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
                                                {isRTL ? "رفع صورة" : "Upload Picture"}
                                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className={isRTL ? "text-right" : ""}>
                                            <InputLabel value={isRTL ? "اسم المدرسة" : "School Name"} />
                                            <TextInput
                                                value={data.name}
                                                onChange={e => setData("name", e.target.value)}
                                                className="w-full mt-1.5"
                                                required
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div className={isRTL ? "text-right" : ""}>
                                            <InputLabel value={isRTL ? "العنوان/الموقع" : "Address/Location"} />
                                            <TextInput
                                                value={data.address}
                                                onChange={e => setData("address", e.target.value)}
                                                className="w-full mt-1.5"
                                            />
                                            <InputError message={errors.address} />
                                        </div>
                                    </div>

                                    {/* Map Picker */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {isRTL ? "حدد موقع المدرسة على الخريطة" : "Select school location on map"}
                                            </p>
                                            {(data.latitude && data.longitude) && (
                                                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                                    <Check className="w-3 h-3" />
                                                    {isRTL ? "تم تحديد الموقع" : "Location Selected"}
                                                </span>
                                            )}
                                        </div>
                                        <div className="h-[250px] rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 shadow-inner">
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
                                                        address: address || prev.address
                                                    }));
                                                }}
                                            />
                                        </div>
                                        <InputError message={errors.latitude} />
                                    </div>

                                    {/* Status & Services */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
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

                                        <div className="flex flex-col justify-end">
                                            <label className={`flex items-center gap-3 cursor-pointer group ${isRTL ? "flex-row-reverse" : ""}`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${data.has_transport ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                                                    <BusIcon className="w-5 h-5" />
                                                </div>
                                                <div className={isRTL ? "text-right" : ""}>
                                                    <input type="checkbox" checked={data.has_transport} onChange={e => setData("has_transport", e.target.checked)} className="hidden" />
                                                    <p className={`text-xs font-bold ${data.has_transport ? 'text-blue-600' : 'text-gray-400'}`}>{isRTL ? "نظام النقل" : "Transport"}</p>
                                                    <p className="text-[10px] text-gray-400">{data.has_transport ? (isRTL ? "مفعل" : "Enabled") : (isRTL ? "معطل" : "Disabled")}</p>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="flex flex-col justify-end">
                                            <label className={`flex items-center gap-3 cursor-pointer group ${isRTL ? "flex-row-reverse" : ""}`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${data.has_attendance ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                                                    <ClipboardList className="w-5 h-5" />
                                                </div>
                                                <div className={isRTL ? "text-right" : ""}>
                                                    <input type="checkbox" checked={data.has_attendance} onChange={e => setData("has_attendance", e.target.checked)} className="hidden" />
                                                    <p className={`text-xs font-bold ${data.has_attendance ? 'text-emerald-600' : 'text-gray-400'}`}>{isRTL ? "الحضور" : "Attendance"}</p>
                                                    <p className="text-[10px] text-gray-400">{data.has_attendance ? (isRTL ? "مفعل" : "Enabled") : (isRTL ? "معطل" : "Disabled")}</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                    className="space-y-6"
                                >
                                    <div className={`p-4 rounded-2xl border bg-brand-navy dark:bg-indigo-900 shadow-xl flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <div className={isRTL ? "text-right" : ""}>
                                            <h4 className="text-white font-bold">{isRTL ? "تعيين مدير للمدرسة" : "Assign School Admin"}</h4>
                                            <p className="text-white/60 text-xs">{isRTL ? "هذا الحساب سيمتلك كامل الصلاحيات لإدارة المدرسة" : "This account will have full access to manage the school"}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-4 mb-4">
                                        <div className="relative group">
                                            <div className={`w-24 h-24 rounded-full border-4 border-dashed flex items-center justify-center overflow-hidden transition-all ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} group-hover:border-brand-yellow`}>
                                                {data.admin_image ? (
                                                    <img src={URL.createObjectURL(data.admin_image)} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Camera className="w-8 h-8 text-gray-300" />
                                                )}
                                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-bold">
                                                    {isRTL ? "تغيير الصورة" : "Change Image"}
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => setData('admin_image', e.target.files?.[0] || null)} />
                                                </label>
                                            </div>
                                            {data.admin_image && (
                                                <button onClick={() => setData('admin_image', null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{isRTL ? "الصورة الشخصية" : "Profile Picture"}</p>
                                            <p className="text-[10px] text-gray-500">{isRTL ? "اختياري" : "Optional"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className={isRTL ? "text-right" : ""}>
                                            <InputLabel value={isRTL ? "اسم المدير الرباعي" : "Manager Full Name"} />
                                            <div className="relative">
                                                <UserCog className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                                <TextInput
                                                    value={data.admin_name}
                                                    onChange={e => setData("admin_name", e.target.value)}
                                                    className={`w-full mt-1.5 ${isRTL ? 'pr-11' : 'pl-11'}`}
                                                    placeholder={isRTL ? "أدخل الاسم الكامل" : "Enter full name"}
                                                />
                                            </div>
                                            <InputError message={errors.admin_name} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className={isRTL ? "text-right" : ""}>
                                                <InputLabel value={isRTL ? "رقم الهوية" : "National ID"} />
                                                <div className="relative">
                                                    <Fingerprint className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                                    <TextInput
                                                        value={data.admin_national_id}
                                                        onChange={e => setData("admin_national_id", e.target.value)}
                                                        className={`w-full mt-1.5 ${isRTL ? 'pr-11' : 'pl-11'}`}
                                                        placeholder="1XXXXXXXXX"
                                                        required={data.create_admin}
                                                    />
                                                </div>
                                                <InputError message={errors.admin_national_id} />
                                            </div>
                                            <div className={isRTL ? "text-right" : ""}>
                                                <InputLabel value={isRTL ? "العنوان الشخصي" : "Personal Address"} />
                                                <div className="relative">
                                                    <MapPin className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                                    <TextInput
                                                        value={data.admin_address}
                                                        onChange={e => setData("admin_address", e.target.value)}
                                                        className={`w-full mt-1.5 ${isRTL ? 'pr-11' : 'pl-11'}`}
                                                        placeholder={isRTL ? "أدخل العنوان بالتفصيل" : "Enter personal address"}
                                                    />
                                                </div>
                                                <InputError message={errors.admin_address} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className={isRTL ? "text-right" : ""}>
                                                <InputLabel value={isRTL ? "البريد الإلكتروني" : "Email Address"} />
                                                <div className="relative">
                                                    <Mail className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                                    <TextInput
                                                        type="email"
                                                        value={data.admin_email}
                                                        onChange={e => setData("admin_email", e.target.value)}
                                                        className={`w-full mt-1.5 ${isRTL ? 'pr-11' : 'pl-11'}`}
                                                        placeholder="admin@example.com"
                                                    />
                                                </div>
                                                <InputError message={errors.admin_email} />
                                            </div>
                                            <div className={isRTL ? "text-right" : ""}>
                                                <InputLabel value={isRTL ? "رقم الجوال" : "Phone Number"} />
                                                <div className="relative">
                                                    <Phone className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                                    <TextInput
                                                        value={data.admin_phone}
                                                        onChange={e => setData("admin_phone", e.target.value)}
                                                        className={`w-full mt-1.5 ${isRTL ? 'pr-11' : 'pl-11'}`}
                                                        placeholder="50XXXXXXX"
                                                    />
                                                </div>
                                                <InputError message={errors.admin_phone} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className={isRTL ? "text-right" : ""}>
                                                <InputLabel value={isRTL ? "كلمة المرور" : "Password"} />
                                                <div className="relative">
                                                    <Lock className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                                    <TextInput
                                                        type="password"
                                                        value={data.admin_password}
                                                        onChange={e => setData("admin_password", e.target.value)}
                                                        className={`w-full mt-1.5 ${isRTL ? 'pr-11' : 'pl-11'}`}
                                                    />
                                                </div>
                                                <InputError message={errors.admin_password} />
                                            </div>
                                            <div className={isRTL ? "text-right" : ""}>
                                                <InputLabel value={isRTL ? "تأكيد كلمة المرور" : "Confirm Password"} />
                                                <div className="relative">
                                                    <Lock className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4 h-4 text-gray-400`} />
                                                    <TextInput
                                                        type="password"
                                                        value={data.admin_password_confirmation}
                                                        onChange={e => setData("admin_password_confirmation", e.target.value)}
                                                        className={`w-full mt-1.5 ${isRTL ? 'pr-11' : 'pl-11'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Actions */}
                    <div className={`px-8 py-5 border-t flex justify-between items-center ${isDark ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
                        {currentStep === 1 ? (
                            <button type="button" onClick={closeModal} className={`text-sm font-bold ${isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-800"}`}>
                                {isRTL ? "إلغاء النافذة" : "Cancel Wizard"}
                            </button>
                        ) : (
                            <button type="button" onClick={() => setCurrentStep(1)} className={`text-sm font-bold ${isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-800"}`}>
                                {isRTL ? "العودة للبيانات" : "Previous Step"}
                            </button>
                        )}

                        <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                            {modalType === 'add' && currentStep === 1 && (
                                <button
                                    type="button"
                                    onClick={() => { setData('create_admin', true); setCurrentStep(2); }}
                                    className="bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                                >
                                    {isRTL ? "التالي (إضافة مدير)" : "Next (Add Manager)"}
                                </button>
                            )}

                            {(modalType === 'edit' || currentStep === 2) && (
                                <PrimaryButton
                                    type="submit"
                                    disabled={processing}
                                    className="bg-brand-yellow text-brand-dark px-8 py-2.5 rounded-xl border-none font-black"
                                >
                                    {processing ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "إتمام وتطبيق" : "Complete & Save")}
                                </PrimaryButton>
                            )}

                            {modalType === 'add' && currentStep === 1 && (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    onClick={() => setData('create_admin', false)}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold border transition-all ${isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-white shadow-sm"}`}
                                >
                                    {isRTL ? "حفظ بدون مدير" : "Save Without Manager"}
                                </button>
                            )}
                        </div>
                    </div>
                </form>

            </div>
        </Modal>

    </AuthenticatedLayout>
  );
}

// ─── COMPONENTS ───────────────────────────────────────

function SchoolCard({ school, isDark, isRTL, onEdit }: { school: School; isDark: boolean; isRTL: boolean; onEdit: () => void }) {
    const { post } = useForm();
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
            whileHover={{ y: -5 }}
            className={`rounded-[2rem] border overflow-hidden transition-all duration-300 ${isDark ? "bg-gray-800/40 border-gray-700 hover:bg-gray-800 shadow-2xl" : "bg-white border-gray-100 shadow-sm hover:shadow-xl group"}`}
        >
            <div className={`h-28 relative ${localStatus === 'Active' ? 'bg-gradient-to-r from-[#041b3a] to-[#0f172a]' : 'bg-gray-500'}`}>
                {/* Status Badge */}
                <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`}>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 ${localStatus === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/20 text-white border border-white/30'}`}>
                        {localStatus === 'Active' ? (isRTL ? "نشطة" : "Active") : (isRTL ? "غير نشطة" : "Inactive")}
                    </span>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)]" style={{ backgroundSize: '20px 20px' }}></div>

                {/* Logo Overlapping */}
                <div className={`absolute -bottom-10 ${isRTL ? 'right-6' : 'left-6'} w-[84px] h-[84px] rounded-[1.25rem] border-[4px] ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-white'} shadow-xl overflow-hidden flex items-center justify-center p-2 z-10 transition-transform group-hover:scale-105`}>
                    {school.logo ? (
                        <img src={`/storage/${school.logo}`} className="w-full h-full object-contain" alt={school.name} />
                    ) : (
                        <SchoolIcon className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    )}
                </div>
            </div>

            <div className="pt-14 px-6 pb-6">
                <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                    <h4 className={`text-xl font-black truncate ${isDark ? "text-white" : "text-brand-navy"}`}>{school.name}</h4>
                    <p className={`text-xs flex items-center gap-1 mt-1.5 ${isDark ? "text-gray-400" : "text-gray-500"} ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{school.address || (isRTL ? "موقع غير محدد" : "No location")}</span>
                    </p>
                </div>

                <div className={`flex gap-3 mt-6 ${isRTL ? 'flex-row-reverse' : ''} items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800`}>
                    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <ServiceBadge icon={<BusIcon size={12}/>} active={school.has_transport === 1 || school.has_transport === true} label={isRTL ? "نقل" : "Bus"} isDark={isDark} />
                        <ServiceBadge icon={<ClipboardList size={12}/>} active={school.has_attendance === 1 || school.has_attendance === true} label={isRTL ? "حضور" : "Attendance"} isDark={isDark} />
                    </div>

                    <button
                        onClick={toggleStatus}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow ${
                            localStatus === 'Active' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                        title={isRTL ? "تغيير الحالة" : "Toggle Status"}
                    >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
                            localStatus === 'Active' ? (isRTL ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                        }`} />
                    </button>
                </div>

                <div className={`mt-6 grid grid-cols-2 gap-3 pt-4 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                    <Link
                        href={route('admin.schools.show', school.id)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-brand-navy/5 text-brand-navy hover:bg-brand-navy/10'}`}
                    >
                        <ExternalLink className="w-4 h-4" />
                        {isRTL ? "التفاصيل" : "Details"}
                    </Link>
                    <button
                        onClick={onEdit}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-brand-yellow text-brand-dark hover:bg-yellow-400' : 'bg-brand-yellow text-brand-dark hover:bg-yellow-500 shadow-sm'}`}
                    >
                        <Pencil className="w-4 h-4" />
                        {isRTL ? "تعديل" : "Edit"}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function ServiceBadge({ icon, active, label, isDark }: { icon: any, active: boolean, label: string, isDark: boolean }) {
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
            active
            ? (isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600')
            : (isDark ? 'bg-gray-800 border-gray-700 text-gray-600 grayscale' : 'bg-gray-50 border-gray-100 text-gray-400 grayscale')
        }`}>
            {icon}
            {label}
        </div>
    );
}

// ─── DASHBOARD COMPONENTS ─────────────────────────────

function SchoolsDistributionMap({ schools, isDark, isRTL }: { schools: School[], isDark: boolean, isRTL: boolean }) {
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const validSchools = schools.filter(s => s.latitude && s.longitude);

    // Default center to the average of points or a fallback (Oman)
    const center = useMemo(() => {
        if (validSchools.length === 0) return { lat: 23.5859, lng: 58.4059 };
        const lat = validSchools.reduce((sum, s) => sum + Number(s.latitude), 0) / validSchools.length;
        const lng = validSchools.reduce((sum, s) => sum + Number(s.longitude), 0) / validSchools.length;
        return { lat, lng };
    }, [validSchools]);

    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
                defaultCenter={center}
                defaultZoom={11}
                mapId={isDark ? "7d9c6c547846f49d" : "light_map_id"}
                styles={isDark ? darkMapStyles : lightMapStyles}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
            >
                {validSchools.map(school => (
                    <React.Fragment key={school.id}>
                        <AdvancedMarker
                            position={{ lat: Number(school.latitude), lng: Number(school.longitude) }}
                            onClick={() => setSelectedSchool(school)}
                        >
                            <motion.div
                                whileHover={{ scale: 1.1, y: -5 }}
                                className="relative flex flex-col items-center group cursor-pointer"
                            >
                                <div className={`p-1.5 rounded-2xl border-2 shadow-2xl transition-all duration-300 ${
                                    school.status === 'Active'
                                    ? 'bg-brand-navy border-white text-white'
                                    : 'bg-gray-500 border-gray-100 text-white grayscale'
                                }`}>
                                    <SchoolIcon className="w-5 h-5" />
                                </div>
                                <div className={`mt-2 px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 dark:border-gray-800 transition-opacity ${selectedSchool?.id === school.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <p className="text-[9px] font-black whitespace-nowrap dark:text-white uppercase tracking-tighter">{school.name}</p>
                                </div>
                            </motion.div>
                        </AdvancedMarker>

                        {selectedSchool?.id === school.id && (
                            <InfoWindow
                                position={{ lat: Number(school.latitude), lng: Number(school.longitude) }}
                                onCloseClick={() => setSelectedSchool(null)}
                            >
                                <div className={`p-4 min-w-[220px] ${isRTL ? 'text-right' : 'text-left'} dir-${isRTL ? 'rtl' : 'ltr'}`}>
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
                            </InfoWindow>
                        )}
                    </React.Fragment>
                ))}
            </Map>
        </APIProvider>
    );
}

// ─── HELPERS ───────────────────────────────────────────

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
      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 ${iconBgMap[color]}`}>
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

function StepBubble({ num, active, label, isRTL, isDark }: { num: number, active: boolean, label: string, isRTL: boolean, isDark: boolean }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
                active
                ? "bg-brand-yellow text-brand-dark scale-110 shadow-lg shadow-brand-yellow/20"
                : (isDark ? "bg-gray-800 text-gray-600" : "bg-gray-100 text-gray-400")
            }`}>
                {active && num < 2 ? <Check className="w-5 h-5" /> : num}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${active ? (isDark ? 'text-white' : 'text-brand-navy') : 'text-gray-400'}`}>
                {label}
            </span>
        </div>
    );
}

function SchoolListRow({ school, isDark, isRTL, onEdit }: { school: School; isDark: boolean; isRTL: boolean; onEdit: () => void }) {
    const { post } = useForm();
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
                    <div className={`w-12 h-12 rounded-xl border-2 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} flex items-center justify-center p-1.5 shrink-0`}>
                        {school.logo ? (
                            <img src={`/storage/${school.logo}`} className="w-full h-full object-contain" alt={school.name} />
                        ) : (
                            <SchoolIcon className={`w-6 h-6 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                        )}
                    </div>
                    <div className={isRTL ? "text-right" : "text-left"}>
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-brand-navy'}`}>{school.name}</div>
                        <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{school.enrollments_count || 0} {isRTL ? 'طالب' : 'Students'}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className={`flex items-center gap-1.5 text-xs ${isRTL ? 'flex-row-reverse text-right' : 'text-left'} ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[200px]">{school.address || (isRTL ? "موقع غير محدد" : "No location")}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-center">
                <button
                    onClick={toggleStatus}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                        localStatus === 'Active'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    } ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${localStatus === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                    {localStatus === 'Active' ? (isRTL ? "نشط" : "Active") : (isRTL ? "غير نشط" : "Inactive")}
                </button>
            </td>
            <td className="px-6 py-4">
                <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <ServiceBadge icon={<BusIcon size={12}/>} active={school.has_transport === 1 || school.has_transport === true} label={isRTL ? "نقل" : "Bus"} isDark={isDark} />
                    <ServiceBadge icon={<ClipboardList size={12}/>} active={school.has_attendance === 1 || school.has_attendance === true} label={isRTL ? "حضور" : "Attendance"} isDark={isDark} />
                </div>
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
