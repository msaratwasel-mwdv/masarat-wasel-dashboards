import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import { Search, User, FileText, CheckCircle, XCircle } from "lucide-react";
import {
  DS_pageWrapper,
  DS_pageTitle,
  DS_card,
  DS_tableWrapper,
  DS_tableBase,
  DS_tableHead,
  DS_tableTh,
  DS_tableRow,
  DS_tableTd,
  DS_searchInput,
  DS_avatar,
} from "@/lib/DS";

export default function DriversIndex({ auth, drivers, filters }: any) {
  const { t, isRtl } = useTranslation();
  const [search, setSearch] = useState(filters.search || "");

  const handleSearch = (e: any) => {
    e.preventDefault();
    router.get(route('school.drivers.index'), { search }, { preserveState: true });
  };

  return (
    <SchoolAuthenticatedLayout user={auth.user} header={<h2 className={DS_pageTitle}>{isRtl ? "سائقو الحافلات" : "Bus Drivers"}</h2>}>
      <Head title={isRtl ? "السائقون" : "Drivers"} />

      <div className={DS_pageWrapper}>
        <div className={DS_card}>
          {/* Header & Search */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                {isRtl ? "قائمة السائقين المعينين" : "Assigned Drivers List"}
            </h3>
            <form onSubmit={handleSearch} className="w-full sm:w-1/3 relative">
              <input
                type="text"
                placeholder={isRtl ? "البحث بالاسم، الهوية، أو الجوال..." : "Search by name, ID, or phone..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${DS_searchInput} ${isRtl ? 'pr-10' : 'pl-10'}`}
              />
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            </form>
          </div>

          {/* Table */}
          <div className={DS_tableWrapper}>
            <table className={DS_tableBase}>
              <thead className={DS_tableHead}>
                <tr>
                  <th className={DS_tableTh(isRtl)}>{isRtl ? "السائق" : "Driver"}</th>
                  <th className={DS_tableTh(isRtl)}>{isRtl ? "الرقم المدني" : "Civil ID"}</th>
                  <th className={DS_tableTh(isRtl)}>{isRtl ? "رقم الجوال" : "Phone"}</th>
                  <th className={DS_tableTh(isRtl)}>{isRtl ? "رقم الرخصة" : "License No."}</th>
                  <th className={DS_tableTh(isRtl)}>{isRtl ? "الحافلة" : "Assigned Bus"}</th>
                  <th className={DS_tableTh(isRtl)}>{isRtl ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver: any) => (
                  <tr key={driver.id} className={DS_tableRow}>
                    <td className={DS_tableTd}>
                      <div className="flex items-center gap-3">
                        <img
                          src={driver.image ? `/storage/${driver.image}` : "/images/default-avatar.png"}
                          alt=""
                          className={DS_avatar}
                        />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{isRtl ? driver.name : (driver.name_en || driver.name)}</p>
                          <p className="text-xs text-gray-500">{driver.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${DS_tableTd} font-mono text-sm`}>{driver.national_id || "—"}</td>
                    <td className={`${DS_tableTd} font-mono text-sm`}>{driver.phone || "—"}</td>
                    <td className={DS_tableTd}>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {driver.license_number || "—"}
                        </span>
                        {driver.license_expiry_date && (
                          <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {driver.license_expiry_date}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={DS_tableTd}>
                      {driver.bus_number ? (
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-full border border-blue-100 dark:border-blue-800">
                          {driver.bus_number}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className={DS_tableTd}>
                      {driver.status === 'active' ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                          <CheckCircle className="w-4 h-4" /> {isRtl ? "نشط" : "Active"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-500 font-bold text-xs">
                          <XCircle className="w-4 h-4" /> {isRtl ? "غير نشط" : "Inactive"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {drivers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-bold">
                      {isRtl ? "لا يوجد سائقين مطابقين للبحث." : "No drivers found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
