import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import { Search, User, PhoneCall, CheckCircle, XCircle } from "lucide-react";
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

export default function AssistantsIndex({ auth, assistants, filters }: any) {
  const { t, isRtl } = useTranslation();
  const [search, setSearch] = useState(filters.search || "");

  const handleSearch = (e: any) => {
    e.preventDefault();
    router.get(route('school.assistants.index'), { search }, { preserveState: true });
  };

  return (
    <SchoolAuthenticatedLayout user={auth.user} header={<h2 className={DS_pageTitle}>{isRtl ? "مشرفات الحافلات" : "Bus Supervisors"}</h2>}>
      <Head title={isRtl ? "مشرفات الحافلات" : "Bus Supervisors"} />

      <div className={DS_pageWrapper}>
        <div className={DS_card}>
          {/* Header & Search */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                {isRtl ? "قائمة المشرفات المعينات" : "Assigned Supervisors List"}
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
                  <th className={DS_tableTh(isRtl)}>{isRtl ? "المشرفة" : "Supervisor"}</th>
                  <th className={DS_tableTh(isRtl)}>{isRtl ? "الرقم المدني" : "Civil ID"}</th>
                  <th className={DS_tableTh(isRtl)}>{isRtl ? "رقم الجوال" : "Phone"}</th>
                  <th className={DS_tableTh(isRtl)}>{isRtl ? "التواصل وقت الطوارئ" : "Emergency Contact"}</th>
                  <th className={DS_tableTh(isRtl)}>{isRtl ? "الحافلة" : "Assigned Bus"}</th>
                  <th className={DS_tableTh(isRtl)}>{isRtl ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {assistants.map((assistant: any) => (
                  <tr key={assistant.id} className={DS_tableRow}>
                    <td className={DS_tableTd}>
                      <div className="flex items-center gap-3">
                        <img
                          src={assistant.image ? `/storage/${assistant.image}` : "/images/default-avatar.png"}
                          alt=""
                          className={DS_avatar}
                        />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{isRtl ? assistant.name : (assistant.name_en || assistant.name)}</p>
                          <p className="text-xs text-gray-500">{assistant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${DS_tableTd} font-mono text-sm`}>{assistant.national_id || "—"}</td>
                    <td className={`${DS_tableTd} font-mono text-sm`}>{assistant.phone || "—"}</td>
                    <td className={DS_tableTd}>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {assistant.emergency_contact_name || "—"}
                        </span>
                        {assistant.emergency_contact_phone && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                            <PhoneCall className="w-3 h-3" /> {assistant.emergency_contact_phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={DS_tableTd}>
                      {assistant.bus_number ? (
                        <span className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-bold text-xs rounded-full border border-yellow-100 dark:border-yellow-800">
                          {assistant.bus_number}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className={DS_tableTd}>
                      {assistant.status === 'active' ? (
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
                {assistants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-bold">
                      {isRtl ? "لا يوجد مشرفات حافلات مطابقات للبحث." : "No bus supervisors found."}
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
