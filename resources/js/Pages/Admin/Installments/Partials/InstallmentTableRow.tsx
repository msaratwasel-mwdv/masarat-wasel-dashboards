import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  School as SchoolIcon,
  FileText,
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

export default function InstallmentTableRow({
  installment,
  isDark,
  isRTL,
  onPay,
}: Props) {
  const isPaid = installment.status === "paid";
  const isPartiallyPaid = installment.status === "partially_paid";
  const remainingAmount = Math.max(0, installment.amount - (installment.paid_amount || 0));

  const isOverdue =
    !isPaid &&
    installment.due_date &&
    new Date(installment.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  return (
    <tr className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
      {/* School Info & Installment # */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-navy/5 dark:bg-brand-navy/30 border border-brand-navy/10 flex items-center justify-center p-1.5 flex-shrink-0">
            {installment.school?.logo ? (
              <img
                src={`/storage/${installment.school.logo}`}
                className="w-full h-full object-contain"
                alt=""
              />
            ) : (
              <SchoolIcon className="w-5 h-5 text-brand-navy dark:text-brand-yellow" />
            )}
          </div>
          <div>
            <h5 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
              {installment.school?.name || "-"}
            </h5>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400 font-bold">
                {isRTL ? `القسط ${installment.installment_number}` : `Inst. #${installment.installment_number}`}
              </span>
              {installment.subscription?.plan?.name_ar && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold">
                  {isRTL ? installment.subscription.plan.name_ar : (installment.subscription.plan.name_en || installment.subscription.plan.name)}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Due Date */}
      <td className="px-6 py-4 text-center">
        <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
          {new Date(installment.due_date).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4 text-center">
        {isPaid ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>{isRTL ? "مسدد" : "Paid"}</span>
          </span>
        ) : isOverdue ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>{isRTL ? "متأخر" : "Overdue"}</span>
          </span>
        ) : isPartiallyPaid ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            <span>{isRTL ? "سداد جزئي" : "Partial"}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
            <Clock className="w-3 h-3" />
            <span>{isRTL ? "معلق" : "Pending"}</span>
          </span>
        )}
      </td>

      {/* Total Amount */}
      <td className="px-6 py-4 text-center">
        <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300" dir="ltr">
          {installment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.ع.
        </span>
      </td>

      {/* Remaining Amount */}
      <td className="px-6 py-4 text-center">
        <span
          className={`font-mono text-sm font-black ${
            isPaid
              ? "text-emerald-600 dark:text-emerald-400"
              : isOverdue
              ? "text-rose-600 dark:text-rose-400"
              : "text-brand-navy dark:text-brand-yellow"
          }`}
          dir="ltr"
        >
          {remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.ع.
        </span>
      </td>

      {/* Receipt */}
      <td className="px-6 py-4 text-center">
        {installment.receipt_path ? (
          <a
            href={`/storage/${installment.receipt_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isRTL ? "معاينة" : "View"}</span>
          </a>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-center">
        {!isPaid ? (
          <button
            type="button"
            onClick={() => onPay(installment)}
            className="px-3.5 py-1.5 rounded-xl bg-brand-navy hover:bg-brand-dark dark:bg-brand-yellow dark:text-brand-dark text-white font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            {isRTL ? "تسجيل تحصيل" : "Collect"}
          </button>
        ) : (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isRTL ? "تم السداد" : "Paid"}</span>
          </span>
        )}
      </td>
    </tr>
  );
}
