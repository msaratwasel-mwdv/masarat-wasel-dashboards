import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import {
  Wallet,
  X,
  CheckCircle2,
  Building2,
  Calendar,
  CreditCard,
  Banknote,
  Receipt,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import OmaniRial from "@/Components/OmaniRial";
import { toast } from "react-toastify";
import { Installment, SchoolData } from "./types";

interface Props {
  show: boolean;
  installment: Installment | null;
  schools: SchoolData[];
  isDark: boolean;
  isRTL: boolean;
  onClose: () => void;
}

export default function PaymentModal({
  show,
  installment,
  schools,
  isDark,
  isRTL,
  onClose,
}: Props) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!show) return;
    setErrors({});
    setProcessing(false);

    if (installment) {
      setSelectedSchoolId(installment.school_id);
      const remaining = Math.max(0, installment.amount - (installment.paid_amount || 0));
      setAmount(remaining);
      setPaymentMethod("bank_transfer");
      setReferenceNumber("");
    } else {
      setSelectedSchoolId(schools.length > 0 ? schools[0].id : null);
      const defaultSchool = schools.length > 0 ? schools[0] : null;
      setAmount(defaultSchool ? defaultSchool.total_due : 0);
      setPaymentMethod("bank_transfer");
      setReferenceNumber("");
    }
  }, [show, installment, schools]);

  const handleSchoolChange = (schoolId: number) => {
    setSelectedSchoolId(schoolId);
    const found = schools.find((s) => s.id === schoolId);
    if (found) {
      setAmount(found.total_due);
    }
  };

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);

  // Target installment ID to pay
  const targetInstallmentId =
    installment?.id || selectedSchool?.oldest_installment?.id;

  const currentDue = installment
    ? Math.max(0, installment.amount - (installment.paid_amount || 0))
    : selectedSchool
    ? selectedSchool.total_due
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!targetInstallmentId) {
      toast.error(isRTL ? "يرجى اختيار مدرسة لديها أقساط مستحقة" : "Please select a school with pending balance");
      return;
    }

    if (amount <= 0) {
      toast.error(isRTL ? "يرجى إدخال مبلغ تحصيل صحيح" : "Please enter a valid amount");
      return;
    }

    setProcessing(true);
    setErrors({});

    router.post(
      route("admin.subscriptions.installments.pay", targetInstallmentId),
      {
        payment_method: paymentMethod,
        amount: Number(amount),
        reference_number: referenceNumber || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setProcessing(false);
          onClose();
        },
        onError: (errs) => {
          setProcessing(false);
          setErrors(errs as Record<string, string>);
          const first = Object.values(errs)[0];
          toast.error(first ? (first as string) : (isRTL ? "حدث خطأ أثناء حفظ الدفعة" : "Failed to record payment"));
        },
      }
    );
  };

  const paymentMethods = [
    { id: "bank_transfer", label: isRTL ? "حوالة بنكية" : "Bank Transfer", icon: Building2 },
    { id: "cash", label: isRTL ? "نقدي" : "Cash", icon: Banknote },
    { id: "cheque", label: isRTL ? "شيك بنكي" : "Cheque", icon: Receipt },
    { id: "online", label: isRTL ? "دفع إلكتروني" : "Online Card", icon: CreditCard },
  ];

  return (
    <Modal show={show} onClose={onClose} maxWidth="xl">
      <div
        className={`relative ${
          isDark ? "bg-gray-900 border border-gray-700 text-gray-100" : "bg-white text-gray-800"
        } rounded-[2rem] overflow-hidden shadow-2xl transition-all`}
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

        {/* Modal Header */}
        <div
          className={`px-8 pt-7 pb-5 border-b ${
            isDark ? "border-gray-800 bg-gray-900/60" : "border-gray-100 bg-gray-50/60"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black">
                {isRTL ? "تسجيل تحصيل مالي" : "Record Payment Collection"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {installment
                  ? isRTL
                    ? `سداد القسط رقم #${installment.installment_number} لمدرسة ${installment.school?.name || ""}`
                    : `Pay installment #${installment.installment_number}`
                  : isRTL
                  ? "تسجيل دفعة جديدة وتطبيقها على أقدم الأقساط المستحقة"
                  : "Record payment applied to oldest dues"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {/* If no specific installment, let user choose school */}
          {!installment && (
            <div className={isRTL ? "text-right" : ""}>
              <InputLabel value={isRTL ? "المدرسة المستفيدة *" : "Select School *"} />
              <select
                value={selectedSchoolId ? String(selectedSchoolId) : ""}
                onChange={(e) => handleSchoolChange(Number(e.target.value))}
                className={`w-full rounded-2xl mt-1.5 border-none h-[44px] px-4 text-xs font-bold transition-all cursor-pointer ${
                  isDark
                    ? "bg-gray-800 text-white ring-1 ring-gray-700 focus:ring-brand-yellow"
                    : "bg-gray-50 text-gray-800 ring-1 ring-gray-200 focus:ring-brand-navy"
                }`}
              >
                {schools.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name} (
                    {isRTL ? "المستحق: " : "Due: "}
                    {s.total_due.toFixed(2)} ر.ع.)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Current Due Highlight Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0a142c] to-[#11244d] text-white flex items-center justify-between gap-4 shadow-lg border border-white/10">
            <div className={isRTL ? "text-right" : "text-left"}>
              <span className="text-[11px] text-white/70 uppercase font-bold tracking-wider">
                {isRTL ? "المبلغ المستحق حالياً" : "Current Outstanding Balance"}
              </span>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5" dir="ltr">
                {currentDue.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-white">ر.ع.</span>
              </div>
            </div>

            {installment && (
              <div className="text-xs text-white/80 font-bold bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-yellow" />
                <span>{isRTL ? `القسط ${installment.installment_number}` : `Inst. #${installment.installment_number}`}</span>
              </div>
            )}
          </div>

          {/* Payment Amount Input */}
          <div className={isRTL ? "text-right" : ""}>
            <InputLabel value={isRTL ? "المبلغ المراد سداده (ر.ع.) *" : "Amount to Pay (OMR) *"} />
            <div className="relative mt-1.5">
              <TextInput
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full text-lg font-mono font-black pr-12"
                placeholder="0.00"
                required
              />
              <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-4" : "right-4"} text-xs font-bold text-gray-400`}>
                ر.ع.
              </div>
            </div>
            <InputError message={errors.amount} className="mt-1" />
          </div>

          {/* Payment Method Pills */}
          <div className={isRTL ? "text-right" : ""}>
            <InputLabel value={isRTL ? "طريقة السداد *" : "Payment Method *"} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
              {paymentMethods.map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-brand-navy dark:bg-brand-yellow text-white dark:text-brand-dark border-transparent shadow-md"
                        : isDark
                        ? "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-black">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference / Transaction Number */}
          <div className={isRTL ? "text-right" : ""}>
            <InputLabel value={isRTL ? "رقم المرجع / الحوالة / الإيصال" : "Reference / Receipt Number"} />
            <TextInput
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full mt-1.5 text-xs font-bold"
              placeholder={isRTL ? "مثال: TXN-892182 أو رقم الشيك..." : "e.g. TXN-892182"}
            />
          </div>

          {/* Modal Actions */}
          <div className={`pt-4 border-t flex items-center justify-between gap-3 ${isDark ? "border-gray-800" : "border-gray-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </button>

            <button
              type="submit"
              disabled={processing || amount <= 0}
              className="px-7 py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isRTL ? "جاري التأكيد..." : "Processing..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{isRTL ? "تأكيد التحصيل المالي" : "Confirm Collection"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
