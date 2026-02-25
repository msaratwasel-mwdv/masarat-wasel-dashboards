import { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";

interface Participant {
  id: number;
  name: string;
  role: string;
}

interface LastMessage {
  body: string;
  sender: string;
  created_at: string;
}

interface ConversationItem {
  id: number;
  type: string;
  title: string | null;
  school: { id: number; name: string } | null;
  participants: Participant[];
  last_message: LastMessage | null;
  messages_count: number;
  updated_at: string;
}

interface SchoolFilter {
  id: number;
  name: string;
}

interface Props {
  conversations: {
    data: ConversationItem[];
    current_page: number;
    last_page: number;
    total: number;
  };
  schools: SchoolFilter[];
  filters: {
    search?: string;
    school_id?: string;
  };
}

export default function Index({ conversations, schools, filters }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch] = useState(filters.search || "");
  const [schoolFilter, setSchoolFilter] = useState(filters.school_id || "");

  const applyFilters = () => {
    router.get(
      route("admin.chat.index"),
      {
        search: search || undefined,
        school_id: schoolFilter || undefined,
      },
      { preserveState: true, replace: true }
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "parent":
        return isDark
          ? "bg-blue-900/40 text-blue-300 border-blue-700"
          : "bg-blue-100 text-blue-800 border-blue-200";
      case "driver":
        return isDark
          ? "bg-green-900/40 text-green-300 border-green-700"
          : "bg-green-100 text-green-800 border-green-200";
      case "supervisor":
        return isDark
          ? "bg-purple-900/40 text-purple-300 border-purple-700"
          : "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return isDark
          ? "bg-gray-700 text-gray-300 border-gray-600"
          : "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleLabel = (role: string) => {
    if (!isRTL) return role;
    switch (role) {
      case "parent":
        return "ولي أمر";
      case "driver":
        return "سائق";
      case "supervisor":
        return "مشرفة";
      default:
        return role;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return isRTL ? "الآن" : "Just now";
    if (hours < 24) return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
    if (days < 7) return isRTL ? `منذ ${days} يوم` : `${days}d ago`;
    return d.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: conversations.total,
      active: conversations.data.filter((c) => c.last_message).length,
    };
  }, [conversations]);

  return (
    <AuthenticatedLayout
      header={
        <h2
          className={`font-semibold text-xl ${
            isDark ? "text-gray-200" : "text-gray-800"
          } leading-tight`}
        >
          {isRTL ? "مراقبة المحادثات" : "Conversation Monitor"}
        </h2>
      }
    >
      <Head title={isRTL ? "المحادثات" : "Conversations"} />

      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* --- Stats --- */}
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${
              isRTL ? "rtl" : ""
            }`}
          >
            {[
              {
                title: isRTL ? "إجمالي المحادثات" : "Total Conversations",
                value: stats.total,
                gradient:
                  "shadow-indigo-500/30 bg-gradient-to-br from-indigo-400 to-indigo-600",
                icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
              },
              {
                title: isRTL ? "محادثات نشطة" : "Active Chats",
                value: stats.active,
                gradient:
                  "shadow-green-500/30 bg-gradient-to-br from-green-400 to-green-600",
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
              },
              {
                title: isRTL ? "المدارس" : "Schools",
                value: schools.length,
                gradient:
                  "shadow-amber-500/30 bg-gradient-to-br from-amber-400 to-amber-600",
                icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                } p-4 rounded-2xl shadow-sm border flex items-center justify-between transition-all hover:shadow-md`}
              >
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {stat.title}
                  </p>
                  <p
                    className={`text-2xl font-extrabold ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${stat.gradient}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={stat.icon}
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* --- Filters --- */}
          <div
            className={`flex flex-col md:flex-row justify-between items-center mb-6 gap-4 ${
              isRTL ? "md:flex-row-reverse" : ""
            }`}
          >
            {/* Search */}
            <div className="relative w-full md:w-96">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder={isRTL ? "البحث بالاسم..." : "Search by name..."}
                className={`w-full ${
                  isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                } py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
              <svg
                className={`w-5 h-5 absolute top-2.5 ${
                  isRTL ? "right-3" : "left-3"
                } text-gray-400`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* School Filter */}
            <select
              value={schoolFilter}
              onChange={(e) => {
                setSchoolFilter(e.target.value);
                router.get(
                  route("admin.chat.index"),
                  {
                    search: search || undefined,
                    school_id: e.target.value || undefined,
                  },
                  { preserveState: true, replace: true }
                );
              }}
              className={`px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 transition ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="">{isRTL ? "كل المدارس" : "All Schools"}</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* --- Conversations Table --- */}
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } shadow-xl rounded-2xl overflow-hidden border`}
          >
            <div className="overflow-x-auto">
              <table
                className={`min-w-full divide-y ${
                  isDark ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                <thead
                  className={`${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}
                >
                  <tr>
                    <th
                      className={`px-6 py-4 text-xs font-bold ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      } uppercase tracking-wider ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {isRTL ? "المشاركون" : "Participants"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-bold ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      } uppercase tracking-wider ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {isRTL ? "المدرسة" : "School"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-bold ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      } uppercase tracking-wider ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {isRTL ? "آخر رسالة" : "Last Message"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-bold ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      } uppercase tracking-wider text-center`}
                    >
                      {isRTL ? "الرسائل" : "Messages"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-bold ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      } uppercase tracking-wider ${
                        isRTL ? "text-left" : "text-right"
                      }`}
                    >
                      {isRTL ? "الإجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`${
                    isDark
                      ? "bg-gray-800 divide-gray-700"
                      : "bg-white divide-gray-200"
                  } divide-y`}
                >
                  {conversations.data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg
                            className="w-16 h-16 mb-4 opacity-30"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <p className="text-sm font-medium">
                            {isRTL
                              ? "لا توجد محادثات حتى الآن."
                              : "No conversations found."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    conversations.data.map((conv) => (
                      <tr
                        key={conv.id}
                        className={`${
                          isDark
                            ? "hover:bg-gray-700/50"
                            : "hover:bg-indigo-50/30"
                        } transition-colors duration-200`}
                      >
                        {/* Participants */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            {conv.participants.map((p) => (
                              <div
                                key={p.id}
                                className={`flex items-center gap-2 ${
                                  isRTL ? "flex-row-reverse" : ""
                                }`}
                              >
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    p.role === "parent"
                                      ? "bg-blue-500"
                                      : p.role === "driver"
                                      ? "bg-green-500"
                                      : "bg-purple-500"
                                  } text-white`}
                                >
                                  {p.name.charAt(0)}
                                </div>
                                <div
                                  className={isRTL ? "text-right" : "text-left"}
                                >
                                  <span
                                    className={`text-sm font-semibold block ${
                                      isDark ? "text-white" : "text-gray-900"
                                    }`}
                                  >
                                    {p.name}
                                  </span>
                                  <span
                                    className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded border ${getRoleBadge(
                                      p.role
                                    )}`}
                                  >
                                    {getRoleLabel(p.role)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* School */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {conv.school ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isDark
                                  ? "bg-amber-900/30 text-amber-300"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {conv.school.name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Last Message */}
                        <td className="px-6 py-4">
                          {conv.last_message ? (
                            <div className="max-w-xs">
                              <p
                                className={`text-sm truncate ${
                                  isDark ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                <span className="font-semibold">
                                  {conv.last_message.sender}:
                                </span>{" "}
                                {conv.last_message.body}
                              </p>
                              <p
                                className={`text-xs mt-0.5 ${
                                  isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                              >
                                {formatDate(conv.last_message.created_at)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              {isRTL ? "لا توجد رسائل" : "No messages"}
                            </span>
                          )}
                        </td>

                        {/* Messages Count */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              isDark
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {conv.messages_count}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`flex items-center justify-end gap-2 ${
                              isRTL ? "flex-row-reverse" : ""
                            }`}
                          >
                            <Link
                              href={route("admin.chat.show", conv.id)}
                              className={`p-2 rounded-lg transition ${
                                isDark
                                  ? "text-gray-400 hover:text-indigo-400 hover:bg-gray-700"
                                  : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                              }`}
                              title={
                                isRTL ? "عرض المحادثة" : "View Conversation"
                              }
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {conversations.last_page > 1 && (
              <div
                className={`px-6 py-4 border-t flex items-center justify-between ${
                  isDark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {isRTL
                    ? `صفحة ${conversations.current_page} من ${conversations.last_page}`
                    : `Page ${conversations.current_page} of ${conversations.last_page}`}
                </p>
                <div className="flex gap-2">
                  {conversations.current_page > 1 && (
                    <Link
                      href={route("admin.chat.index", {
                        page: conversations.current_page - 1,
                        ...filters,
                      })}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        isDark
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {isRTL ? "السابق" : "Prev"}
                    </Link>
                  )}
                  {conversations.current_page < conversations.last_page && (
                    <Link
                      href={route("admin.chat.index", {
                        page: conversations.current_page + 1,
                        ...filters,
                      })}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        isDark
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {isRTL ? "التالي" : "Next"}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
