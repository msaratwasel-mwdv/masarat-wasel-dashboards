import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  School as SchoolIcon,
  Calendar,
  FileText,
  ArrowRight,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import OmaniRial from "@/Components/OmaniRial";
import { Installment } from "./types";

interface Props {
  installment: Installment;
  isDark: boolean;
  isRTL: boolean;
  onPay: (installment: Installment) => void;
}

export default function InstallmentCard({ installment, isDark, isRTL, onPay }: Props) {
  const isPaid = installment.status === "paid";
  const isPartiallyPaid = installment.status === "partially_paid";
  const remainingAmount = Math.max(0, installment.amount - (installment.paid_amount || 0));

  // Determine if overdue
  const isOverdue =
    !isPaid &&
    installment.due_date &&
    new Date(installment.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  const percentPaid = installment.amount > 0
    ? Math.min(100, Math.round(((installment.paid_amount || 0) / installment.amount) * 100))
    : 0;

  return (
    <div
      className={`group rounded-3xl border transition-all duration-300 hover:shadow-xl flex flex-col justify-between overflow-hidden ${
        isPaid
          ? "bg-white dark:bg-gray-800/80 border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400"
          : isOverdue
          ? "bg-white dark:bg-gray-800/80 border-rose-200 dark:border-rose-900/40 hover:border-rose-400"
          : isPartiallyPaid
          ? "bg-white dark:bg-gray-800/80 border-amber-200 dark:border-amber-900/40 hover:border-amber-400"
          : "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-brand-yellow"
      }`}
    >
      {/* Top Header Row */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-start justify-between gap-3">
          {/* School info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-navy/5 dark:bg-brand-navy/30 border border-brand-navy/10 dark:border-brand-navy/40 flex items-center justify-center p-1.5 flex-shrink-0">
              {installment.school?.logo ? (
                <img
                  src={`/storage/${installment.school.logo}`}
                  className="w-full h-full object-contain"
                  alt=""
                />
              ) : (
                <SchoolIcon className="w-6 h-6 text-brand-navy dark:text-brand-yellow" />
              )}
            </div>
            <div>
              <h4 className="font-black text-sm text-gray-900 dark:text-white leading-tight">
                {installment.school?.name || "-"}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  {isRTL ? `القسط رقم ${installment.installment_number}` : `Installment #${installment.installment_number}`}
                </span>
                {installment.subscription?.plan?.name_ar && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-navy/5 dark:bg-brand-navy/40 text-brand-navy dark:text-brand-yellow font-black border border-brand-navy/10">
                    {isRTL ? installment.subscription.plan.name_ar : (installment.subscription.plan.name_en || installment.subscription.plan.name)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            {isPaid ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isRTL ? "مسدد بالكامل" : "Paid in Full"}</span>
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isRTL ? "متأخر عن السداد" : "Overdue"}</span>
              </span>
            ) : isPartiallyPaid ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Clock className="w-3.5 h-3.5" />
                <span>{isRTL ? "مسدد جزئياً" : "Partially Paid"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                <Clock className="w-3.5 h-3.5" />
                <span>{isRTL ? "بانتظار السداد" : "Pending"}</span>
              </span>
            )}
          </div>
        </div>

        {/* Due Date & Paid Info */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 font-bold">
            <Calendar className="w-4 h-4 text-brand-yellow" />
            <span>{isRTL ? "تاريخ الاستحقاق:" : "Due Date:"}</span>
            <span className="text-gray-900 dark:text-gray-200 font-mono">
              {new Date(installment.due_date).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          {installment.installment_payments?.[0]?.payment_transaction?.payment_method && (
            <div className="flex items-center gap-1 font-bold text-[11px] text-gray-600 dark:text-gray-300">
              <CreditCard className="w-3.5 h-3.5 text-gray-400" />
              <span className="capitalize">
                {installment.installment_payments[0].payment_transaction.payment_method === "bank_transfer"
                  ? (isRTL ? "حوالة بنكية" : "Bank Transfer")
                  : installment.installment_payments[0].payment_transaction.payment_method === "cash"
                  ? (isRTL ? "نقدي" : "Cash")
                  : (isRTL ? "شيك" : "Cheque")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Financial Details & Progress */}
      <div className="p-6 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              {isPaid ? (isRTL ? "المبلغ المسدد" : "Amount Paid") : (isRTL ? "المبلغ المتبقي" : "Remaining Due")}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5" dir="ltr">
              <span
                className={`text-2xl lg:text-3xl font-black font-mono tracking-tight ${
                  isPaid
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isOverdue
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-brand-navy dark:text-brand-yellow"
                }`}
              >
                {remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <OmaniRial className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="text-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              {isRTL ? "إجمالي القسط" : "Total Amount"}
            </span>
            <span className="text-sm font-black font-mono text-gray-700 dark:text-gray-300" dir="ltr">
              {installment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-normal">ر.ع.</span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-black text-gray-400">
            <span>{isRTL ? "نسبة التحصيل" : "Collection"}</span>
            <span>{percentPaid}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isPaid
                  ? "bg-emerald-500"
                  : isPartiallyPaid
                  ? "bg-amber-500"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
              style={{ width: `${percentPaid}%` }}
            />
          </div>
        </div>

        {/* Receipt Attachment Link */}
        {installment.receipt_path && (
          <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>{isRTL ? "إيصال سداد مرفق" : "Receipt Attached"}</span>
            </div>
            <a
              href={`/storage/${installment.receipt_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isRTL ? "معاينة الملف" : "View File"}
            </a>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {!isPaid && (
        <div className="p-4 bg-gray-50/80 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={() => onPay(installment)}
            className="w-full py-3 px-4 bg-brand-navy hover:bg-brand-dark dark:bg-brand-yellow dark:text-brand-dark text-white rounded-2xl font-black text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isRTL ? "تسجيل تحصيل وسداد هذا القسط" : "Record Payment for this Installment"}</span>
            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
