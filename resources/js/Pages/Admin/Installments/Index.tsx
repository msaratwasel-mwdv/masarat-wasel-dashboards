import React, { useState, useMemo } from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useTheme } from "@/Contexts/ThemeContext";
import {
  Wallet,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import {
  DS_pageTitle,
  DS_gridCols,
  DS_tableWrapper,
  DS_card,
  DS_tableBase,
  DS_tableHead,
} from "@/lib/DS";

import { Installment, SchoolData } from "./Partials/types";
import InstallmentStatCards from "./Partials/InstallmentStatCards";
import InstallmentCard from "./Partials/InstallmentCard";
import InstallmentTableRow from "./Partials/InstallmentTableRow";
import PaymentModal from "./Partials/PaymentModal";

interface Props {
  installments: Installment[];
  schools: SchoolData[];
  initialSearch?: string;
}

export default function InstallmentsIndex({
  installments = [],
  schools = [],
  initialSearch = "",
}: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");

  // Payment Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);

  // Financial Calculations
  const stats = useMemo(() => {
    const totalAmount = installments.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const totalPaid = installments.reduce((sum, i) => sum + Number(i.paid_amount || 0), 0);
    const totalRemaining = Math.max(0, totalAmount - totalPaid);

    const now = new Date().setHours(0, 0, 0, 0);
    const overdueCount = installments.filter(
      (i) =>
        i.status !== "paid" &&
        i.due_date &&
        new Date(i.due_date).getTime() < now
    ).length;

    return { totalAmount, totalPaid, totalRemaining, overdueCount };
  }, [installments]);

  // Filtered Installments
  const filteredInstallments = useMemo(() => {
    return installments.filter((inst) => {
      const schoolName = inst.school?.name || "";
      const matchesSearch =
        schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(inst.installment_number).includes(searchQuery);

      const isPaid = inst.status === "paid";
      const isOverdue =
        !isPaid &&
        inst.due_date &&
        new Date(inst.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

      let matchesStatus = true;
      if (statusFilter === "pending") {
        matchesStatus = inst.status === "pending" || inst.status === "partially_paid";
      } else if (statusFilter === "paid") {
        matchesStatus = isPaid;
      } else if (statusFilter === "partially_paid") {
        matchesStatus = inst.status === "partially_paid";
      } else if (statusFilter === "overdue") {
        matchesStatus = isOverdue;
      }

      const matchesSchool =
        schoolFilter === "all" || String(inst.school_id) === schoolFilter;

      return matchesSearch && matchesStatus && matchesSchool;
    });
  }, [installments, searchQuery, statusFilter, schoolFilter]);

  const openPayForInstallment = (inst: Installment) => {
    setSelectedInstallment(inst);
    setPayModalOpen(true);
  };

  const openGlobalPay = () => {
    setSelectedInstallment(null);
    setPayModalOpen(true);
  };

  const closePayModal = () => {
    setPayModalOpen(false);
    setSelectedInstallment(null);
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
          <div>
            <h2 className={DS_pageTitle}>
              {isRTL ? "إدارة الأقساط والمتحصلات" : "Installments & Collections"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isRTL
                ? "متابعة دفعات المدارس، جداول السداد، وتسجيل التحصيل المالي المباشر."
                : "Manage school payment schedules, balances, and direct collections."}
            </p>
          </div>

          <PrimaryButton
            onClick={openGlobalPay}
            className="w-full md:w-auto bg-[#f5b800] text-[#0f2044] hover:bg-yellow-500 shadow-lg px-6 py-2.5 rounded-xl font-black border-none active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isRTL ? "تسجيل تحصيل مالي" : "Record Collection"}</span>
          </PrimaryButton>
        </div>
      }
    >
      <Head title={isRTL ? "إدارة الأقساط" : "Installments Management"} />

      <div className={`space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        {/* Top Summary Stat Cards */}
        <InstallmentStatCards
          totalAmount={stats.totalAmount}
          totalPaid={stats.totalPaid}
          totalRemaining={stats.totalRemaining}
          overdueCount={stats.overdueCount}
          isDark={isDark}
          isRTL={isRTL}
        />

        {/* Search, Status, School Filters & View Switchers */}
        <div
          className={`flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-3xl border ${
            isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-100"
          } shadow-sm`}
        >
          {/* Search Box */}
          <div
            className={`flex-1 w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${
              isDark
                ? "bg-gray-900 border-gray-700 focus-within:border-brand-yellow"
                : "bg-gray-50 border-gray-200 focus-within:border-brand-navy focus-within:ring-2 focus-within:ring-brand-navy/20"
            }`}
          >
            <Search className={`w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
            <input
              type="text"
              placeholder={isRTL ? "ابحث باسم المدرسة أو رقم القسط..." : "Search school name or installment #..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold p-0 w-full"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Status Filter */}
            <div
              className={`flex items-center px-3 py-2 rounded-2xl border transition-all ${
                isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
              }`}
            >
              <Filter className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} text-gray-400`} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs font-bold p-0 cursor-pointer"
              >
                <option value="all">{isRTL ? "جميع الحالات" : "All Status"}</option>
                <option value="pending">{isRTL ? "بانتظار السداد" : "Pending"}</option>
                <option value="partially_paid">{isRTL ? "مسدد جزئياً" : "Partially Paid"}</option>
                <option value="overdue">{isRTL ? "متأخر عن السداد" : "Overdue"}</option>
                <option value="paid">{isRTL ? "مسدد بالكامل" : "Paid"}</option>
              </select>
            </div>

            {/* School Filter */}
            {schools.length > 0 && (
              <div
                className={`flex items-center px-3 py-2 rounded-2xl border transition-all ${
                  isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
                }`}
              >
                <Building2 className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} text-gray-400`} />
                <select
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-xs font-bold p-0 cursor-pointer max-w-[150px]"
                >
                  <option value="all">{isRTL ? "كافة المدارس" : "All Schools"}</option>
                  {schools.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* View Switchers */}
            <div
              className={`flex items-center gap-1 p-1 rounded-2xl ${
                isDark ? "bg-gray-900 border border-gray-700" : "bg-gray-100 border border-gray-200"
              }`}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === "grid"
                    ? isDark
                      ? "bg-brand-yellow/20 text-brand-yellow shadow-sm"
                      : "bg-white text-brand-navy shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title={isRTL ? "شبكة" : "Grid"}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === "table"
                    ? isDark
                      ? "bg-brand-yellow/20 text-brand-yellow shadow-sm"
                      : "bg-white text-brand-navy shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title={isRTL ? "جدول" : "Table"}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content View */}
        {filteredInstallments.length === 0 ? (
          <div
            className={`p-12 rounded-[28px] border-2 border-dashed flex flex-col items-center justify-center ${
              isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-100"
            }`}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                isDark ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <Wallet className={`w-10 h-10 ${isDark ? "text-gray-500" : "text-gray-300"}`} />
            </div>
            <h4 className={`text-lg font-bold ${isDark ? "text-white" : "text-brand-navy"}`}>
              {isRTL ? "لا توجد أقساط مطابقة للبحث" : "No Installments Found"}
            </h4>
            <p className={`text-sm mt-1 mb-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {isRTL
                ? "جرب تغيير خيارات التصفية أو البحث باسم مدرسة أخرى"
                : "Try adjusting your search criteria or filters"}
            </p>
          </div>
        ) : viewMode === "table" ? (
          <div className={DS_tableWrapper + " " + DS_card}>
            <table className={DS_tableBase}>
              <thead className={DS_tableHead}>
                <tr>
                  <th className="px-6 py-4">{isRTL ? "المدرسة والقسط" : "School & Installment"}</th>
                  <th className="px-6 py-4 text-center">{isRTL ? "تاريخ الاستحقاق" : "Due Date"}</th>
                  <th className="px-6 py-4 text-center">{isRTL ? "الحالة" : "Status"}</th>
                  <th className="px-6 py-4 text-center">{isRTL ? "إجمالي القسط" : "Total Amount"}</th>
                  <th className="px-6 py-4 text-center">{isRTL ? "المبلغ المتبقي" : "Remaining Due"}</th>
                  <th className="px-6 py-4 text-center">{isRTL ? "الإيصال" : "Receipt"}</th>
                  <th className="px-6 py-4 text-center">{isRTL ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredInstallments.map((inst) => (
                  <InstallmentTableRow
                    key={inst.id}
                    installment={inst}
                    isDark={isDark}
                    isRTL={isRTL}
                    onPay={openPayForInstallment}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={DS_gridCols}>
            {filteredInstallments.map((inst) => (
              <InstallmentCard
                key={inst.id}
                installment={inst}
                isDark={isDark}
                isRTL={isRTL}
                onPay={openPayForInstallment}
              />
            ))}
          </div>
        )}

        {/* Unified Payment Collection Modal */}
        <PaymentModal
          show={payModalOpen}
          installment={selectedInstallment}
          schools={schools}
          isDark={isDark}
          isRTL={isRTL}
          onClose={closePayModal}
        />
      </div>
    </AuthenticatedLayout>
  );
}
