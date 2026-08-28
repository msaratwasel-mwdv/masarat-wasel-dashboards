import React, { useState, useEffect, useMemo } from "react";
import { useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import FieldTripMapPicker from "@/Components/FieldTripMapPicker";
import { motion, AnimatePresence } from "framer-motion";
import {
  School as SchoolIcon,
  Check,
  X,
  Camera,
  UserCog,
  Mail,
  Phone,
  Lock,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Calendar,
  DollarSign,
  Calculator,
  Layers,
  Sparkles,
  RefreshCw,
  Bus as BusIcon,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-toastify";
import { School, PlanData } from "./types";

interface Props {
  show: boolean;
  modalType: "add" | "edit" | null;
  currentSchool: School | null;
  plans: PlanData[];
  isDark: boolean;
  isRTL: boolean;
  onClose: () => void;
}

export default function SchoolModal({
  show,
  modalType,
  currentSchool,
  plans,
  isDark,
  isRTL,
  onClose,
}: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

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
    admin_password: "",
    admin_password_confirmation: "",

    // Step 3: Subscription & Installments
    plan_id: null as number | null,
    installments_count: 1,
    price_per_student: 8,
    student_count: 20,
    start_date: new Date().toISOString().split("T")[0],
    billing_type: "yearly",
  });

  // Sync state when opening modal
  useEffect(() => {
    if (!show) return;

    setCurrentStep(1);
    clearErrors();

    if (modalType === "edit" && currentSchool) {
      setPreviewLogo(currentSchool.logo ? `/storage/${currentSchool.logo}` : null);
      const sub = currentSchool.current_subscription;
      const subNotes = sub?.notes || {};

      setData({
        _method: "post",
        name: currentSchool.name,
        address: currentSchool.address || "",
        latitude: currentSchool.latitude ? Number(currentSchool.latitude) : null,
        longitude: currentSchool.longitude ? Number(currentSchool.longitude) : null,
        status: currentSchool.status || "Active",
        has_transport: true,
        has_attendance: true,
        logo: null,
        create_admin: false,
        admin_name: "",
        admin_email: "",
        admin_phone: "",
        admin_password: "",
        admin_password_confirmation: "",
        plan_id: currentSchool.plan_id || sub?.plan_id || (plans.length > 0 ? plans[0].id : null),
        installments_count: subNotes.installments_count || (sub?.installments?.length || 1),
        price_per_student: subNotes.price_per_student || (sub?.plan?.price_per_student || 8),
        student_count: subNotes.student_count || (currentSchool.enrollments_count || 20),
        start_date: sub?.start_date ? sub.start_date.split("T")[0] : new Date().toISOString().split("T")[0],
        billing_type: subNotes.billing_type || "yearly",
      });
    } else {
      setPreviewLogo(null);
      reset();
      const defaultPlan = plans.length > 0 ? plans[0] : null;
      setData({
        _method: "post",
        name: "",
        address: "",
        latitude: null,
        longitude: null,
        status: "Active",
        has_transport: true,
        has_attendance: true,
        logo: null,
        create_admin: false,
        admin_name: "",
        admin_email: "",
        admin_phone: "",
        admin_password: "",
        admin_password_confirmation: "",
        plan_id: defaultPlan ? defaultPlan.id : null,
        installments_count: 1,
        price_per_student: defaultPlan ? (defaultPlan.price_per_student || 8) : 8,
        student_count: 20,
        start_date: new Date().toISOString().split("T")[0],
        billing_type: "yearly",
      });
    }
  }, [show, modalType, currentSchool]);

  // When selected plan changes, auto-update price_per_student
  const handlePlanSelect = (id: number | null) => {
    setData((prev) => {
      const selectedPlan = plans.find((p) => p.id === id);
      return {
        ...prev,
        plan_id: id,
        price_per_student: selectedPlan?.price_per_student || prev.price_per_student,
      };
    });
  };

  // Live Calculations for Contract & Installments
  const calculations = useMemo(() => {
    const totalAmount = (Number(data.price_per_student) || 0) * (Number(data.student_count) || 0);
    const count = Math.max(1, Number(data.installments_count) || 1);
    const perInstallment = totalAmount > 0 ? Math.round((totalAmount / count) * 100) / 100 : 0;

    const dates: { number: number; date: string; amount: number }[] = [];
    const baseDate = data.start_date ? new Date(data.start_date) : new Date();

    const intervalDays =
      count === 1 ? 0 : count === 2 ? 180 : count === 3 ? 120 : count === 4 ? 90 : 30;

    for (let i = 1; i <= count; i++) {
      const d = new Date(baseDate);
      if (i === 1) {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 7 + intervalDays * (i - 1));
      }
      dates.push({
        number: i,
        date: d.toISOString().split("T")[0],
        amount: perInstallment,
      });
    }

    return { totalAmount, perInstallment, dates };
  }, [data.price_per_student, data.student_count, data.installments_count, data.start_date]);

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

  // Step advancement with validation
  const goToNextStep = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (currentStep === 1) {
      if (!data.name.trim()) {
        toast.error(isRTL ? "يرجى إدخال اسم المدرسة أولاً" : "Please enter school name");
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (data.create_admin) {
        if (!data.admin_name?.trim() || !data.admin_email?.trim() || !data.admin_phone?.trim() || !data.admin_password) {
          toast.error(isRTL ? "يرجى استكمال بيانات مدير المدرسة أو إيقاف التفعيل للمتابعة" : "Please complete manager fields or disable toggle");
          return;
        }
      }
      setCurrentStep(3);
      return;
    }
  };

  // Strict submission only on step 3!
  const submitForm = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Guard: Never submit if not on the final step!
    if (currentStep < 3) {
      goToNextStep();
      return;
    }

    if (modalType === "add") {
      post(route("admin.schools.store"), {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(isRTL ? "تم تسجيل المدرسة وإعداد اشتراكها بنجاح!" : "School registered successfully!");
          onClose();
        },
        onError: (errs) => {
          const firstErr = Object.values(errs)[0];
          toast.error(firstErr ? (firstErr as string) : (isRTL ? "يرجى مراجعة وتصحيح الأخطاء" : "Please fix errors"));
        },
      });
    } else if (modalType === "edit" && currentSchool) {
      router.post(
        route("admin.schools.update", currentSchool.id),
        {
          ...data,
          _method: "PUT",
        },
        {
          forceFormData: true,
          preserveScroll: true,
          onSuccess: () => {
            toast.success(isRTL ? "تم حفظ وتحديث بيانات المدرسة والاشتراك!" : "School updated successfully!");
            onClose();
          },
          onError: (errs) => {
            const firstErr = Object.values(errs)[0];
            toast.error(firstErr ? (firstErr as string) : (isRTL ? "فشل الحفظ، تأكد من صحة البيانات" : "Update failed"));
          },
        }
      );
    }
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="5xl">
      <div
        className={`relative ${
          isDark ? "bg-gray-900 border border-gray-700 text-gray-100" : "bg-white text-gray-800"
        } rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-5 ${
            isRTL ? "left-5" : "right-5"
          } p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors z-50`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Navigation Stepper */}
        <div
          className={`px-8 pt-6 pb-4 border-b ${
            isDark ? "border-gray-800 bg-gray-900/60" : "border-gray-100 bg-gray-50/60"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-yellow/10 text-brand-dark dark:text-brand-yellow border border-brand-yellow/20">
              <SchoolIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black">
                {modalType === "edit"
                  ? (isRTL ? "تعديل بيانات المدرسة والاشتراك" : "Edit School & Subscription")
                  : (isRTL ? "تسجيل مدرسة جديدة" : "Register New School")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isRTL
                  ? "الخطوة " + currentStep + " من 3 — " + (currentStep === 1 ? "بيانات المدرسة وموقعها" : currentStep === 2 ? "تعيين مدير المدرسة" : "خطة الاشتراك والأقساط")
                  : "Step " + currentStep + " of 3"}
              </p>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="mt-4 flex items-center justify-center gap-2 sm:gap-4">
            <StepTab
              num={1}
              active={currentStep === 1}
              done={currentStep > 1}
              label={isRTL ? "بيانات المدرسة" : "School Info"}
              isDark={isDark}
              onClick={() => setCurrentStep(1)}
            />
            <div
              className={`h-0.5 w-8 sm:w-16 rounded-full transition-colors ${
                currentStep > 1 ? "bg-brand-yellow" : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
            <StepTab
              num={2}
              active={currentStep === 2}
              done={currentStep > 2}
              label={isRTL ? "مدير المدرسة (اختياري)" : "Manager (Optional)"}
              isDark={isDark}
              onClick={() => {
                if (!data.name.trim()) {
                  toast.error(isRTL ? "يرجى إدخال اسم المدرسة أولاً" : "Please enter school name");
                  return;
                }
                setCurrentStep(2);
              }}
            />
            <div
              className={`h-0.5 w-8 sm:w-16 rounded-full transition-colors ${
                currentStep > 2 ? "bg-brand-yellow" : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
            <StepTab
              num={3}
              active={currentStep === 3}
              done={false}
              label={isRTL ? "الاشتراك والأقساط" : "Plan & Installments"}
              isDark={isDark}
              onClick={() => {
                if (!data.name.trim()) {
                  toast.error(isRTL ? "يرجى إدخال اسم المدرسة أولاً" : "Please enter school name");
                  return;
                }
                setCurrentStep(3);
              }}
            />
          </div>
        </div>

        <form
          onSubmit={submitForm}
          onKeyDown={(e) => {
            if (e.key === "Enter" && currentStep < 3 && e.target instanceof HTMLInputElement) {
              e.preventDefault();
              goToNextStep();
            }
          }}
        >
          <div className="p-6 sm:p-7 min-h-[380px]">
            <AnimatePresence mode="wait">
              {/* ── STEP 1: SCHOOL INFO & LOCATION ── */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                >
                  {/* Left Column: Info Fields (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Logo Upload */}
                    <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className="group relative w-18 h-18 flex-shrink-0">
                        <div
                          className={`w-full h-full rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 transition-colors ${
                            isDark ? "border-gray-700" : "border-gray-200"
                          }`}
                        >
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
                        <h4 className="font-bold text-sm">{isRTL ? "شعار المدرسة" : "School Logo"}</h4>
                        <p className="text-xs text-gray-400 mb-1.5">
                          {isRTL ? "PNG, JPG حتى 2MB (اختياري)" : "PNG, JPG up to 2MB (Optional)"}
                        </p>
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
                        onChange={(e) => setData("name", e.target.value)}
                        className={`w-full mt-1.5 ${errors.name ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                        placeholder={isRTL ? "مثال: مدرسة مسقط الدولية" : "e.g. Muscat International School"}
                        required
                      />
                      <InputError message={errors.name} className="mt-1" />
                    </div>

                    {/* Address & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel value={isRTL ? "عنوان المدرسة" : "Address / City"} />
                        <TextInput
                          value={data.address}
                          onChange={(e) => setData("address", e.target.value)}
                          className={`w-full mt-1.5 ${errors.address ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                          placeholder={isRTL ? "المدينة، الحي..." : "City, District..."}
                        />
                        <InputError message={errors.address} className="mt-1" />
                      </div>

                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel value={isRTL ? "حالة المدرسة" : "Status"} />
                        <select
                          value={data.status}
                          onChange={(e) => setData("status", e.target.value)}
                          className={`w-full rounded-xl mt-1.5 border-none h-[42px] px-4 text-sm font-semibold transition-all ${
                            isDark
                              ? "bg-gray-800 text-white ring-1 ring-gray-700 focus:ring-brand-yellow"
                              : "bg-gray-50 text-gray-800 ring-1 ring-gray-200 focus:ring-brand-navy"
                          }`}
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
                      {data.latitude && data.longitude ? (
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

                    <div className="h-[210px] rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 shadow-inner">
                      <FieldTripMapPicker
                        lat={data.latitude}
                        lng={data.longitude}
                        isDark={isDark}
                        isRtl={isRTL}
                        onChange={(lat, lng, address) => {
                          setData((prev) => ({
                            ...prev,
                            latitude: lat,
                            longitude: lng,
                            address: prev.address || address,
                          }));
                        }}
                      />
                    </div>
                    <InputError message={errors.latitude} className="mt-1" />
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: OPTIONAL SCHOOL ADMIN (CLEAN 5 FIELDS) ── */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  {/* Optional Toggle Card */}
                  <div
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      data.create_admin
                        ? "bg-brand-navy/5 dark:bg-brand-navy/30 border-brand-yellow/40"
                        : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`p-2.5 rounded-2xl ${
                          data.create_admin
                            ? "bg-brand-yellow text-brand-dark"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                        }`}
                      >
                        <UserCog className="w-5 h-5" />
                      </div>
                      <div className={isRTL ? "text-right" : ""}>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          {isRTL ? "تعيين مدير للمدرسة الآن" : "Assign School Admin Now"}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {data.create_admin
                            ? (isRTL
                                ? "سيتم إنشاء حساب مدير كامل الصلاحيات لإدارة هذه المدرسة"
                                : "A manager account with full access will be created for this school")
                            : (isRTL
                                ? "اختياري: يمكنك المتابعة بدون إنشاء مدير الآن وتعيينه في أي وقت لاحقاً"
                                : "Optional: You can proceed now and assign a manager anytime later")}
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

                  {data.create_admin ? (
                    <div className="space-y-3.5">
                      {/* Full Name */}
                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel value={isRTL ? "اسم المدير الكامل *" : "Manager Full Name *"} />
                        <div className="relative">
                          <UserCog
                            className={`absolute top-1/2 -translate-y-1/2 ${
                              isRTL ? "right-4" : "left-4"
                            } w-4 h-4 text-gray-400`}
                          />
                          <TextInput
                            value={data.admin_name}
                            onChange={(e) => setData("admin_name", e.target.value)}
                            className={`w-full mt-1.5 ${isRTL ? "pr-11" : "pl-11"} ${
                              errors.admin_name ? "border-rose-500 ring-1 ring-rose-500" : ""
                            }`}
                            placeholder={isRTL ? "مثال: سالم بن حمد الهاشمي" : "Full Name"}
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
                            <Mail
                              className={`absolute top-1/2 -translate-y-1/2 ${
                                isRTL ? "right-4" : "left-4"
                              } w-4 h-4 text-gray-400`}
                            />
                            <TextInput
                              type="email"
                              value={data.admin_email}
                              onChange={(e) => setData("admin_email", e.target.value)}
                              className={`w-full mt-1.5 ${isRTL ? "pr-11" : "pl-11"} ${
                                errors.admin_email ? "border-rose-500 ring-1 ring-rose-500" : ""
                              }`}
                              placeholder="admin@school.com"
                              required={data.create_admin}
                            />
                          </div>
                          <InputError message={errors.admin_email} className="mt-1" />
                        </div>

                        <div className={isRTL ? "text-right" : ""}>
                          <InputLabel value={isRTL ? "رقم الهاتف *" : "Phone Number *"} />
                          <div className="relative">
                            <Phone
                              className={`absolute top-1/2 -translate-y-1/2 ${
                                isRTL ? "right-4" : "left-4"
                              } w-4 h-4 text-gray-400`}
                            />
                            <TextInput
                              value={data.admin_phone}
                              onChange={(e) => setData("admin_phone", e.target.value)}
                              className={`w-full mt-1.5 ${isRTL ? "pr-11" : "pl-11"} ${
                                errors.admin_phone ? "border-rose-500 ring-1 ring-rose-500" : ""
                              }`}
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
                            <Lock
                              className={`absolute top-1/2 -translate-y-1/2 ${
                                isRTL ? "right-4" : "left-4"
                              } w-4 h-4 text-gray-400`}
                            />
                            <TextInput
                              type="password"
                              value={data.admin_password}
                              onChange={(e) => setData("admin_password", e.target.value)}
                              className={`w-full mt-1.5 ${isRTL ? "pr-11" : "pl-11"} ${
                                errors.admin_password ? "border-rose-500 ring-1 ring-rose-500" : ""
                              }`}
                              placeholder="••••••••"
                              required={data.create_admin}
                            />
                          </div>
                          <InputError message={errors.admin_password} className="mt-1" />
                        </div>

                        <div className={isRTL ? "text-right" : ""}>
                          <InputLabel value={isRTL ? "تأكيد كلمة المرور *" : "Confirm Password *"} />
                          <div className="relative">
                            <Lock
                              className={`absolute top-1/2 -translate-y-1/2 ${
                                isRTL ? "right-4" : "left-4"
                              } w-4 h-4 text-gray-400`}
                            />
                            <TextInput
                              type="password"
                              value={data.admin_password_confirmation}
                              onChange={(e) => setData("admin_password_confirmation", e.target.value)}
                              className={`w-full mt-1.5 ${isRTL ? "pr-11" : "pl-11"}`}
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
                        {isRTL ? "تم تخطي إنشاء حساب المدير حالياً" : "Skipping manager creation"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                        {isRTL
                          ? "يمكنك إنشاء وتعيين مدير للمدرسة في أي وقت لاحقاً من قائمة إدارة مدراء المدارس."
                          : "You can assign a manager anytime later from the School Admins page."}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── STEP 3: SUBSCRIPTION & INSTALLMENTS (FULL-VIEW SIDE-BY-SIDE) ── */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                >
                  {/* Left Column: Plan Selector Cards (5 cols) */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs flex items-center gap-1.5 text-gray-900 dark:text-white">
                        <Sparkles className="w-4 h-4 text-brand-yellow" />
                        <span>{isRTL ? "اختر باقة الاشتراك" : "Select Subscription Plan"}</span>
                      </h4>
                      {data.plan_id && (
                        <button
                          type="button"
                          onClick={() => handlePlanSelect(null)}
                          className="text-[11px] font-bold text-rose-500 hover:underline"
                        >
                          {isRTL ? "بدون باقة" : "None"}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {plans.map((plan) => {
                        const isSelected = data.plan_id === plan.id;
                        const title = isRTL ? (plan.name_ar || plan.name) : (plan.name_en || plan.name);
                        const desc = isRTL ? (plan.description_ar || plan.description) : (plan.description_en || plan.description);

                        return (
                          <div
                            key={plan.id}
                            onClick={() => handlePlanSelect(plan.id)}
                            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-brand-yellow/10 border-brand-yellow shadow-md"
                                : isDark
                                ? "bg-gray-800/60 border-gray-700 hover:border-gray-600"
                                : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "bg-brand-dark border-brand-dark text-brand-yellow"
                                    : "border-gray-300 dark:border-gray-600"
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className={isRTL ? "text-right" : "text-left"}>
                                <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                                  <span>{title}</span>
                                  {plan.badge_ar && (
                                    <span className="text-[9px] bg-brand-yellow text-brand-dark px-1.5 py-0.2 rounded font-black">
                                      {plan.badge_ar}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{desc}</p>
                              </div>
                            </div>

                            <div className="text-end flex-shrink-0">
                              <span className="font-mono font-black text-sm text-brand-navy dark:text-brand-yellow">
                                {plan.price_per_student || 8}
                              </span>
                              <span className="text-[10px] text-gray-400 ms-1">{plan.currency || "ر.ع."}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Financial Terms & Live Calculation Schedule (7 cols) */}
                  <div className="lg:col-span-7 space-y-3.5">
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3.5">
                      <div className="flex items-center gap-2 font-bold text-xs text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        <Calculator className="w-4 h-4 text-brand-yellow" />
                        <span>{isRTL ? "خطة الدفع والأقساط التلقائية" : "Payment Terms & Installments"}</span>
                      </div>

                      {/* Inputs in 2x2 Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Installments Count */}
                        <div className={isRTL ? "text-right" : ""}>
                          <InputLabel value={isRTL ? "عدد الأقساط *" : "Installments *"} />
                          <select
                            value={data.installments_count}
                            onChange={(e) => setData("installments_count", Number(e.target.value))}
                            className={`w-full rounded-xl mt-1 border-none h-[38px] px-3 text-xs font-bold transition-all ${
                              isDark
                                ? "bg-gray-700 text-white ring-1 ring-gray-600 focus:ring-brand-yellow"
                                : "bg-white text-gray-800 ring-1 ring-gray-200 focus:ring-brand-navy"
                            }`}
                          >
                            <option value={1}>{isRTL ? "قسط 1 (دفعة سنوية كاملة)" : "1 Installment (Full)"}</option>
                            <option value={2}>{isRTL ? "قسطين (نصف سنوي - كل 6 أشهر)" : "2 Installments"}</option>
                            <option value={3}>{isRTL ? "3 أقساط (فصلي - كل 4 أشهر)" : "3 Installments"}</option>
                            <option value={4}>{isRTL ? "4 أقساط (ربع سنوي - كل 3 أشهر)" : "4 Installments"}</option>
                            <option value={10}>{isRTL ? "10 أقساط (شهري دراسي)" : "10 Installments"}</option>
                          </select>
                        </div>

                        {/* Price per student */}
                        <div className={isRTL ? "text-right" : ""}>
                          <InputLabel value={isRTL ? "سعر الطالب (ر.ع.) *" : "Price / Student *"} />
                          <TextInput
                            type="number"
                            step="0.5"
                            min="1"
                            value={data.price_per_student}
                            onChange={(e) => setData("price_per_student", Number(e.target.value))}
                            className="w-full mt-1 h-[38px] font-mono text-xs font-bold"
                            required
                          />
                        </div>

                        {/* Estimated Students */}
                        <div className={isRTL ? "text-right" : ""}>
                          <InputLabel value={isRTL ? "عدد الطلاب المعتمد *" : "Students Count *"} />
                          <TextInput
                            type="number"
                            min="1"
                            value={data.student_count}
                            onChange={(e) => setData("student_count", Number(e.target.value))}
                            className="w-full mt-1 h-[38px] font-mono text-xs font-bold"
                            required
                          />
                        </div>

                        {/* Start Date */}
                        <div className={isRTL ? "text-right" : ""}>
                          <InputLabel value={isRTL ? "تاريخ بدء العقد *" : "Start Date *"} />
                          <TextInput
                            type="date"
                            value={data.start_date}
                            onChange={(e) => setData("start_date", e.target.value)}
                            className="w-full mt-1 h-[38px] text-xs font-bold"
                            required
                          />
                        </div>
                      </div>

                      {/* Live Calculation Banner */}
                      <div className="p-3 rounded-xl bg-brand-navy text-white flex items-center justify-between gap-3 shadow-md">
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <span className="text-[10px] text-white/70 uppercase font-bold">
                            {isRTL ? "إجمالي العقد السنوي" : "Annual Contract"}
                          </span>
                          <div className="text-lg font-black text-brand-yellow font-mono leading-tight">
                            {calculations.totalAmount.toLocaleString()} <span className="text-[10px] text-white">ر.ع.</span>
                          </div>
                        </div>

                        <div className="h-6 w-px bg-white/20" />

                        <div className={isRTL ? "text-right" : "text-left"}>
                          <span className="text-[10px] text-white/70 uppercase font-bold">
                            {isRTL ? "قيمة كل قسط" : "Per Installment"}
                          </span>
                          <div className="text-base font-black text-emerald-400 font-mono leading-tight">
                            {calculations.perInstallment.toLocaleString()} <span className="text-[10px] text-white">ر.ع.</span>
                          </div>
                        </div>

                        <div className="h-6 w-px bg-white/20" />

                        <div className="text-[11px] font-bold text-white/90 flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-lg">
                          <Calendar className="w-3.5 h-3.5 text-brand-yellow" />
                          <span>{data.installments_count} {isRTL ? "دفعات" : "Payments"}</span>
                        </div>
                      </div>

                      {/* Timeline Badges */}
                      <div>
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1.5">
                          {isRTL ? "مواعيد استحقاق الأقساط المجدولة:" : "Scheduled Due Dates:"}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 max-h-[85px] overflow-y-auto">
                          {calculations.dates.map((item) => (
                            <div
                              key={item.number}
                              className={`p-1.5 rounded-lg border text-center ${
                                isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-2xs"
                              }`}
                            >
                              <div className="text-[9px] font-bold text-gray-400">
                                {isRTL ? `قسط ${item.number}` : `Inst. ${item.number}`}
                              </div>
                              <div className="text-[11px] font-black text-brand-navy dark:text-white font-mono">
                                {item.amount} ر.ع.
                              </div>
                              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                                {item.date}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Navigation Actions */}
          <div
            className={`px-8 py-3.5 border-t flex justify-between items-center ${
              isDark ? "bg-gray-800/40 border-gray-800" : "bg-gray-50/80 border-gray-100"
            } ${isRTL ? "flex-row-reverse" : ""}`}
          >
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={onClose}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors ${
                  isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className={`inline-flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-xl border transition-colors ${
                  isDark
                    ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span>{isRTL ? "السابق" : "Previous"}</span>
              </button>
            )}

            <div className="flex items-center gap-3">
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goToNextStep(e);
                  }}
                  className="bg-brand-navy text-white px-6 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                >
                  <span>{isRTL ? "متابعة" : "Next"}</span>
                  {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={processing}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    submitForm(e);
                  }}
                  className="bg-brand-yellow text-brand-dark px-7 py-2 rounded-xl text-xs font-black hover:bg-yellow-400 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
                        {modalType === "edit"
                          ? (isRTL ? "حفظ كافة التعديلات" : "Save Changes")
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
  );
}

function StepTab({
  num,
  active,
  done,
  label,
  isDark,
  onClick,
}: {
  num: number;
  active: boolean;
  done: boolean;
  label: string;
  isDark: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 group cursor-pointer focus:outline-none"
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
          active
            ? "bg-brand-yellow text-brand-dark scale-105 shadow-md shadow-brand-yellow/20 ring-2 ring-brand-yellow/40"
            : done
            ? "bg-emerald-500 text-white"
            : isDark
            ? "bg-gray-800 text-gray-500 group-hover:text-gray-300"
            : "bg-gray-100 text-gray-400 group-hover:text-gray-600"
        }`}
      >
        {done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : num}
      </div>
      <span
        className={`text-xs font-bold hidden sm:inline transition-colors ${
          active
            ? isDark
              ? "text-white"
              : "text-brand-navy"
            : done
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
