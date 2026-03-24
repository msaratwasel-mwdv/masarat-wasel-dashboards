import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import axios from "axios";
import useTranslation from "@/hooks/useTranslation";

// ================== Types ==================
interface BusOption { id: number; bus_number: string; plate_number: string; }
interface SupervisorOption { id: number; name: string; phone: string; }
interface GroupOption { id: number; name: string; bus_id: number; bus?: { id: number; bus_number: string }; }
interface StudentRow {
    number: number; name: string;
    bus_at_door: string | null; bus_nearby: string | null;
    boarding_time: string | null; alighting_time: string | null;
    status: "arrived" | "absent";
}
interface TripReport {
    date: string; bus_number: string; plate_number: string;
    supervisor_name: string; supervisor_phone: string;
    group_name: string; direction: string; direction_label: string;
    trip_start_time: string; trip_end_time: string;
    students: StudentRow[];
}

// ================== Component ==================
export default function TripReports() {
    const { buses, supervisors, groups, school } = usePage().props as any;
    const { t, isRtl } = useTranslation();

    const [busId, setBusId] = useState("");
    const [tripType, setTripType] = useState("both");
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
    const [supervisorId, setSupervisorId] = useState("");
    const [groupId, setGroupId] = useState("");
    const [reports, setReports] = useState<TripReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        setLoading(true); setSearched(true);
        try {
            const params: any = { trip_type: tripType, date_from: dateFrom, date_to: dateTo };
            if (busId) params.bus_id = busId;
            if (supervisorId) params.supervisor_id = supervisorId;
            if (groupId) params.group_id = groupId;
            const res = await axios.get(route("school.trip-reports.data"), { params });
            setReports(res.data.reports || []);
        } catch (e) { console.error(e); setReports([]); }
        finally { setLoading(false); }
    };

    const handleReset = () => {
        setBusId(""); setTripType("both");
        setDateFrom(new Date().toISOString().split("T")[0]);
        setDateTo(new Date().toISOString().split("T")[0]);
        setSupervisorId(""); setGroupId("");
        setReports([]); setSearched(false);
    };

    const dirLabel = (d: string) => d === "to_school" ? (isRtl ? "رحلة ذهاب" : "Morning Trip") : d === "to_home" ? (isRtl ? "رحلة عودة" : "Afternoon Trip") : (isRtl ? "ذهاب و عودة" : "Round Trip");
    const statusLabel = (s: string) => s === "arrived" ? (isRtl ? "وصل" : "Arrived") : (isRtl ? "غائب" : "Absent");

    const inputCls = "w-full rounded-xl border-2 border-orange-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all";
    const selectCls = `${inputCls} appearance-none`;
    const selectStyle = {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "1.25rem 1.25rem",
        backgroundPosition: isRtl ? "left 0.75rem center" : "right 0.75rem center",
        paddingInlineEnd: "2.5rem",
    } as React.CSSProperties;

    return (
        <SchoolAuthenticatedLayout header={<span>{isRtl ? "تقارير الرحلات" : "Trip Reports"}</span>}>
            <Head title={isRtl ? "تقارير الرحلات" : "Trip Reports"} />
            <div className="space-y-6">

                {/* ===== PAGE TITLE ===== */}
                <div className="print:hidden">
                    <h1 className="text-2xl md:text-3xl font-black text-orange-500">{isRtl ? "تقارير الرحلات" : "Trip Reports"}</h1>
                </div>

                {/* ===== FILTER FORM ===== */}
                <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">{isRtl ? "رقم الحافلة" : "Bus Number"}</label>
                            <select value={busId} onChange={e => setBusId(e.target.value)} className={selectCls} style={selectStyle}>
                                <option value="">{isRtl ? "اختر الباص" : "Select Bus"}</option>
                                {buses?.map((b: BusOption) => <option key={b.id} value={b.id}>{b.bus_number} - {b.plate_number}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">{isRtl ? "نوع الرحلة" : "Trip Type"}</label>
                            <select value={tripType} onChange={e => setTripType(e.target.value)} className={selectCls} style={selectStyle}>
                                <option value="both">{isRtl ? "ذهاب و عودة" : "Round Trip"}</option>
                                <option value="to_school">{isRtl ? "ذهاب" : "Morning"}</option>
                                <option value="to_home">{isRtl ? "عودة" : "Afternoon"}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">{isRtl ? "من" : "From"}</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">{isRtl ? "إلى" : "To"}</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">{isRtl ? "اسم المشرف" : "Supervisor"}</label>
                            <select value={supervisorId} onChange={e => setSupervisorId(e.target.value)} className={selectCls} style={selectStyle}>
                                <option value="">-</option>
                                {supervisors?.map((s: SupervisorOption) => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">{isRtl ? "اسم المجموعة" : "Group"}</label>
                            <select value={groupId} onChange={e => setGroupId(e.target.value)} className={selectCls} style={selectStyle}>
                                <option value="">-</option>
                                {groups?.map((g: GroupOption) => <option key={g.id} value={g.id}>{g.name}{g.bus ? ` (${g.bus.bus_number})` : ""}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <button onClick={handleSearch} disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50">
                            {loading ? (isRtl ? "جاري البحث..." : "Searching...") : (isRtl ? "بحث" : "Search")}
                        </button>
                        <button onClick={handleReset} className="w-full py-3.5 rounded-xl font-bold text-orange-500 bg-white dark:bg-slate-800 border-2 border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all">
                            {isRtl ? "إعادة تعيين" : "Reset"}
                        </button>
                    </div>
                </div>

                {/* Empty / Loading */}
                {searched && !loading && reports.length === 0 && (
                    <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{isRtl ? "لا توجد بيانات" : "No Data Found"}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{isRtl ? "لم يتم العثور على سجلات" : "No records found"}</p>
                    </div>
                )}
                {loading && (
                    <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-12 text-center">
                        <div className="animate-spin w-12 h-12 mx-auto border-4 border-orange-500 border-t-transparent rounded-full"></div>
                        <p className="text-sm text-gray-700 dark:text-gray-200 mt-4 font-medium">{isRtl ? "جاري التحميل..." : "Loading..."}</p>
                    </div>
                )}

                {/* Print Button */}
                {reports.length > 0 && (
                    <div className="force-print-hide print-btn-container print:hidden flex justify-end">
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-[#1B3A5C] hover:bg-[#15304d] transition-all shadow-md text-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            {isRtl ? "طباعة التقرير" : "Print Report"}
                        </button>
                    </div>
                )}

                {/* ================================================================= */}
                {/* ===== REPORT CARDS — Professional & Print-Ready ===== */}
                {/* ================================================================= */}
                {reports.map((report, idx) => (
                    <div key={idx} className="report-card bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

                        {/* ========== HEADER ========== */}
                        <div className="px-10 pt-8">
                            {/* Logos Row */}
                            <div className="flex justify-between items-center mb-6">
                                {/* Masarat Wasel Logo (Right side in RTL) */}
                                <div className="flex-shrink-0">
                                    <img src="/assets/images/masarat-wasel-logo-rtl.jpg" alt="Masarat Wasel" className="report-logo rounded-xl" style={{ height: 60, objectFit: "contain" }} />
                                </div>

                                {/* School Name (Centered) */}
                                <div className="flex-1 text-center px-4">
                                    <h2 className="report-school-name text-xl font-black text-gray-900 dark:text-white">
                                        {school?.name || (isRtl ? "المدرسة العصرية العالمية" : "International Modern School")}
                                    </h2>
                                </div>

                                {/* School Logo (Left side in RTL) */}
                                <div className="flex-shrink-0">
                                    {school?.logo ? (
                                        <img src={school.logo} alt="School" className="report-logo rounded-xl" style={{ width: 60, height: 60, objectFit: "contain" }} />
                                    ) : (
                                        <div style={{ width: 60, height: 60 }} className="rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 dark:from-blue-700 dark:to-blue-800 flex items-center justify-center shadow-md border border-gray-200">
                                            <span className="text-2xl font-black text-white">{school?.name?.charAt(0) || "م"}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Separator line under logos — hidden in print */}
                            <div className="no-print-line border-b border-gray-300 dark:border-gray-600 mb-6"></div>

                            {/* Report Title & Direction Row */}
                            <div className="flex justify-between items-end mb-6 px-2">
                                <div className="text-right w-1/3">
                                    {/* Empty space to balance */}
                                </div>
                                <div className="text-center w-1/3">
                                    <h3 className="report-title text-lg font-black text-gray-900 dark:text-white">
                                        {isRtl ? "تقارير رحلات الحافلات" : "Bus Trip Reports"}
                                    </h3>
                                </div>
                                <div className="text-left w-1/3 font-bold text-gray-900 dark:text-gray-200">
                                    {dirLabel(report.direction)}
                                </div>
                            </div>

                            {/* Trip Info — Clean grid, no borders */}
                            <div className="report-info grid grid-cols-3 gap-x-6 gap-y-2 text-[13px] mb-6">
                                {[
                                    [isRtl ? "المجموعة" : "Group", report.group_name],
                                    [isRtl ? "التاريخ" : "Date", report.date],
                                    [isRtl ? "رقم الباص" : "Bus No.", report.bus_number],
                                    [isRtl ? "المشرف" : "Supervisor", report.supervisor_name],
                                    [isRtl ? "بدأ الرحلة" : "Trip Start", report.trip_start_time],
                                    [isRtl ? "رقم اللوحة" : "Plate", report.plate_number],
                                    [isRtl ? "الهاتف" : "Phone", report.supervisor_phone],
                                    [isRtl ? "انتهاء الرحلة" : "Trip End", report.trip_end_time],
                                ].map(([label, value], i) => (
                                    <p key={i}>
                                        <span className="report-label font-bold text-blue-900 dark:text-sky-200">{label}</span>
                                        <span className="text-gray-900 dark:text-white mx-1">:</span>
                                        <span className="report-value text-gray-900 dark:text-white font-medium">{value}</span>
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* ========== STUDENTS TABLE ========== */}
                        <div className="px-10 pb-8">
                            <table className="report-table w-full border-collapse border border-gray-300 dark:border-gray-600" style={{ fontSize: 12 }}>
                                <thead>
                                    {/* ALWAYS dark blue header — same in screen + print + PDF */}
                                    <tr style={{ backgroundColor: "#1B3A5C" }}>
                                        {[
                                            isRtl ? "الرقم" : "#",
                                            isRtl ? "اسم الطالب" : "Student Name",
                                            isRtl ? "الحافلة عند الباب" : "Bus at Door",
                                            isRtl ? "الحافلة قريبة" : "Bus Nearby",
                                            isRtl ? "صعد الطالب" : "Boarding",
                                            isRtl ? "نزل الطالب" : "Alighting",
                                            isRtl ? "ملاحظة" : "Note",
                                        ].map((h, i) => (
                                            <th key={i} style={{ color: "#fff", borderColor: "#2a5580" }} className="px-2 py-2.5 text-center font-bold border whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.students.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
                                                {isRtl ? "لا يوجد طلاب" : "No students"}
                                            </td>
                                        </tr>
                                    ) : report.students.map((s, i) => (
                                        <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}>
                                            <td className="px-2 py-2 text-center font-bold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">{s.number}</td>
                                            <td className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">{s.name}</td>
                                            <td className="px-2 py-2 text-center text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 font-mono">{s.bus_at_door || "-"}</td>
                                            <td className="px-2 py-2 text-center text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 font-mono">{s.bus_nearby || "-"}</td>
                                            <td className="px-2 py-2 text-center text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 font-mono">{s.boarding_time || "-"}</td>
                                            <td className="px-2 py-2 text-center text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 font-mono">{s.alighting_time || "-"}</td>
                                            <td className={`px-2 py-2 text-center font-bold border border-gray-300 dark:border-gray-600 ${s.status === "arrived" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                                                {statusLabel(s.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Report Footer */}
                            <div className="report-footer mt-8 pt-3 border-t border-gray-300 dark:border-gray-600 flex items-center justify-between text-xs font-medium text-gray-800 dark:text-gray-200">
                                <span>{report.date}</span>
                                <span>{idx + 1}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ==================== PRINT CSS ==================== */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* === HIDE non-report elements === */
                    .print\\:hidden, .print-btn-container, aside, nav, header, button, hr { display: none !important; }

                    /* Force hide layout bars that might bypass Tailwind print:hidden */
                    #app > div > aside { display: none !important; }
                    #app > div > main > header { display: none !important; }
                    #app > div > div { display: none !important; } /* Mobile nav */

                    html, body {
                        background: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        color: #000 !important;
                        font-size: 11px !important;
                    }

                    /* Reset main container padding to allow full page print */
                    main { margin: 0 !important; padding: 0 !important; }
                    main > div { padding: 0 !important; }

                    @page { margin: 0; size: auto; }

                    /* === KILL ALL borders globally first === */
                    *, *::before, *::after {
                        border-color: transparent !important;
                    }

                    /* === Report card === */
                    .report-card {
                        background: #fff !important;
                        border: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        page-break-after: always;
                        margin: 0 !important;
                        padding: 1.5cm !important;
                        overflow: visible !important;
                    }
                    .report-card:last-child { page-break-after: auto; }

                    /* === All text black === */
                    .report-card, .report-card * { color: #000 !important; }

                    /* === School name === */
                    .report-school-name { color: #1B3A5C !important; font-size: 16px !important; }

                    /* === Title === */
                    .report-title { color: #1B3A5C !important; font-size: 14px !important; }

                    /* === Logos === */
                    .report-logo { height: 56px !important; width: auto !important; max-width: 160px !important; }

                    /* === Info labels === */
                    .report-label { color: #1B3A5C !important; }
                    .report-value { color: #000 !important; }
                    .report-info { font-size: 11px !important; }

                    /* === Header Layout Alignment Helpers for Print === */
                    .flex { display: flex !important; }
                    .justify-between { justify-content: space-between !important; }
                    .items-center { align-items: center !important; }
                    .items-end { align-items: flex-end !important; }
                    .text-center { text-align: center !important; }
                    .text-right { text-align: right !important; }
                    .text-left { text-align: left !important; }
                    .w-1\\/3 { width: 33.333333% !important; }

                    /* === RESTORE table borders only === */
                    .report-table,
                    .report-table th,
                    .report-table td {
                        border: 1px solid #d1d5db !important;
                    }

                    /* === Table header === */
                    .report-table thead tr { background-color: #1B3A5C !important; }
                    .report-table thead th {
                        color: #fff !important;
                        border-color: #2a5580 !important;
                        font-size: 10px !important;
                        padding: 6px 4px !important;
                    }

                    /* === Table body === */
                    .report-table td { font-size: 10px !important; padding: 5px 4px !important; color: #1a1a1a !important; }
                    .report-table tbody tr:nth-child(odd) { background: #fff !important; }
                    .report-table tbody tr:nth-child(even) { background: #f8fafc !important; }

                    /* === Status colors === */
                    [class*="text-green"] { color: #15803d !important; }
                    [class*="text-red"] { color: #b91c1c !important; }

                    /* === RESTORE footer border only === */
                    .report-footer {
                        border-top: 1px solid #d1d5db !important;
                        color: #333 !important;
                        margin-top: 16px !important;
                    }

                    /* === Remove all dark backgrounds === */
                    [class*="dark:bg-"], [class*="dark:!bg-"] { background: transparent !important; }
                }
            `}} />
        </SchoolAuthenticatedLayout>
    );
}
