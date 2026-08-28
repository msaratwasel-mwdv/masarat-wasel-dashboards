import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import React, { useState, useMemo } from "react";
import PrimaryButton from "@/Components/PrimaryButton";
import {
  School as SchoolIcon,
  Plus,
  Search,
  LayoutGrid,
  Map as MapIcon,
  List as ListIcon,
  Filter,
} from "lucide-react";
import {
  DS_pageTitle,
  DS_gridCols,
  DS_tableWrapper,
  DS_card,
  DS_tableBase,
  DS_tableHead,
} from "@/lib/DS";

import { School, PlanData } from "./Partials/types";
import SchoolStatCards from "./Partials/SchoolStatCards";
import SchoolCard from "./Partials/SchoolCard";
import SchoolListRow from "./Partials/SchoolListRow";
import SchoolsDistributionMap from "./Partials/SchoolsDistributionMap";
import SchoolModal from "./Partials/SchoolModal";

interface Props {
  schools: School[];
  plans: PlanData[];
}

export default function SchoolsIndex({ schools, plans }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [viewMode, setViewMode] = useState<"grid" | "map" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [modalType, setModalType] = useState<"add" | "edit" | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Filtered Schools
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const matchesSearch =
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (school.address && school.address.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" || school.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [schools, searchQuery, statusFilter]);

  const counts = useMemo(
    () => ({
      all: filteredSchools.length,
      active: filteredSchools.filter((s) => s.status === "Active").length,
      inactive: filteredSchools.filter((s) => s.status !== "Active").length,
    }),
    [filteredSchools]
  );

  const handleOpenAdd = () => {
    setSelectedSchool(null);
    setModalType("add");
  };

  const handleOpenEdit = (school: School) => {
    setSelectedSchool(school);
    setModalType("edit");
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedSchool(null);
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
          <div>
            <h2 className={DS_pageTitle}>{isRTL ? "إدارة المدارس" : "Schools Management"}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isRTL
                ? "إدارة المؤسسات التعليمية، إعداد الباقات والأقساط، وتتبع الأداء والطلاب."
                : "Manage educational institutions, subscriptions, installments, and performance."}
            </p>
          </div>

          <PrimaryButton
            onClick={handleOpenAdd}
            className="w-full md:w-auto bg-[#f5b800] text-[#0f2044] hover:bg-yellow-500 shadow-lg px-6 py-2.5 rounded-xl font-black border-none active:scale-95"
          >
            <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {isRTL ? "إضافة مدرسة جديدة" : "Add New School"}
          </PrimaryButton>
        </div>
      }
    >
      <Head title={isRTL ? "المدارس" : "Schools"} />

      <div className={`space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        {/* Top Summary Stats */}
        <SchoolStatCards counts={counts} isDark={isDark} isRTL={isRTL} />

        {/* Toolbar & Filters */}
        <div
          className={`flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl border ${
            isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-100"
          } shadow-sm`}
        >
          {/* Search Box */}
          <div
            className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${
              isDark
                ? "bg-gray-900 border-gray-700 focus-within:border-brand-yellow"
                : "bg-gray-50 border-gray-200 focus-within:border-brand-navy focus-within:ring-2 focus-within:ring-brand-navy/20"
            }`}
          >
            <Search className={`w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
            <input
              type="text"
              placeholder={isRTL ? "البحث باسم المدرسة أو العنوان..." : "Search by school name or address..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold p-0 w-full"
            />
          </div>

          {/* Status Filter & View Switchers */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div
              className={`flex items-center px-4 py-2.5 rounded-2xl border transition-all ${
                isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
              }`}
            >
              <Filter
                className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} ${isDark ? "text-gray-500" : "text-gray-400"}`}
              />
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

            {/* View Mode Buttons */}
            <div
              className={`flex items-center gap-1 p-1.5 rounded-2xl ${
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
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === "list"
                    ? isDark
                      ? "bg-brand-yellow/20 text-brand-yellow shadow-sm"
                      : "bg-white text-brand-navy shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title={isRTL ? "قائمة" : "List"}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === "map"
                    ? isDark
                      ? "bg-brand-yellow/20 text-brand-yellow shadow-sm"
                      : "bg-white text-brand-navy shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title={isRTL ? "خريطة" : "Map"}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {filteredSchools.length === 0 ? (
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
              <SchoolIcon className={`w-10 h-10 ${isDark ? "text-gray-500" : "text-gray-300"}`} />
            </div>
            <h4 className={`text-lg font-bold ${isDark ? "text-white" : "text-brand-navy"}`}>
              {isRTL ? "لا توجد مدارس مسجلة" : "No Schools Registered"}
            </h4>
            <p className={`text-sm mt-2 mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {isRTL ? "ابدأ بإضافة أول مدرسة للنظام الآن" : "Start by adding the first school to the system"}
            </p>
            <PrimaryButton onClick={handleOpenAdd} className="bg-brand-navy text-white px-8">
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
                  <th className="px-6 py-4 text-center">{isRTL ? "الباقة" : "Plan"}</th>
                  <th className="px-6 py-4 text-center">{isRTL ? "الحالة" : "Status"}</th>
                  <th className="px-6 py-4 text-center">{isRTL ? "الحافلات" : "Buses"}</th>
                  <th className="px-6 py-4 text-center">{isRTL ? "الطلاب" : "Students"}</th>
                  <th className="px-6 py-4 text-center">{isRTL ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredSchools.map((school) => (
                  <SchoolListRow
                    key={school.id}
                    school={school}
                    isDark={isDark}
                    isRTL={isRTL}
                    onEdit={() => handleOpenEdit(school)}
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
                onEdit={() => handleOpenEdit(school)}
              />
            ))}
          </div>
        )}

        {/* Multi-step Comprehensive School Modal */}
        <SchoolModal
          show={modalType !== null}
          modalType={modalType}
          currentSchool={selectedSchool}
          plans={plans}
          isDark={isDark}
          isRTL={isRTL}
          onClose={handleCloseModal}
        />
      </div>
    </AuthenticatedLayout>
  );
}
