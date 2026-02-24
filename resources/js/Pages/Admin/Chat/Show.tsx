import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import Modal from "@/Components/Modal";

interface Participant {
  id: number;
  name: string;
  role: string;
}

interface MessageItem {
  id: number;
  body: string;
  type: string;
  sender: {
    id: number;
    name: string;
    role: string;
  };
  created_at: string;
  deleted_at: string | null;
}

interface ConversationDetail {
  id: number;
  type: string;
  title: string | null;
  school: { id: number; name: string } | null;
  participants: Participant[];
}

interface Props {
  conversation: ConversationDetail;
  messages: {
    data: MessageItem[];
    current_page: number;
    last_page: number;
    total: number;
  };
}

export default function Show({ conversation, messages }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(
    null
  );
  const [selectedUser, setSelectedUser] = useState<Participant | null>(null);

  const alertForm = useForm({ alert_message: "" });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "parent":
        return "bg-blue-500";
      case "driver":
        return "bg-green-500";
      case "supervisor":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "parent":
        return isDark
          ? "bg-blue-900/40 text-blue-300"
          : "bg-blue-100 text-blue-700";
      case "driver":
        return isDark
          ? "bg-green-900/40 text-green-300"
          : "bg-green-100 text-green-700";
      case "supervisor":
        return isDark
          ? "bg-purple-900/40 text-purple-300"
          : "bg-purple-100 text-purple-700";
      default:
        return isDark
          ? "bg-gray-700 text-gray-300"
          : "bg-gray-100 text-gray-700";
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

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeOnly = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(isRTL ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteMessage = () => {
    if (!selectedMessage) return;
    router.delete(route("admin.chat.messages.destroy", selectedMessage.id), {
      onSuccess: () => {
        setShowDeleteModal(false);
        setSelectedMessage(null);
      },
    });
  };

  const handleAlertUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    alertForm.post(route("admin.chat.alert", selectedUser.id), {
      onSuccess: () => {
        setShowAlertModal(false);
        setSelectedUser(null);
        alertForm.reset();
      },
    });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: MessageItem[] }[] = [];
  let currentGroup: { date: string; messages: MessageItem[] } | null = null;

  messages.data.forEach((msg) => {
    const msgDate = new Date(msg.created_at).toLocaleDateString(
      isRTL ? "ar-SA" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
    if (!currentGroup || currentGroup.date !== msgDate) {
      currentGroup = { date: msgDate, messages: [] };
      groupedMessages.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  });

  return (
    <AuthenticatedLayout
      header={
        <div
          className={`flex items-center gap-4 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <Link
            href={route("admin.chat.index")}
            className={`p-2 rounded-lg transition ${
              isDark
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <svg
              className={`w-5 h-5 ${isRTL ? "" : "rotate-180"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
          <h2
            className={`font-semibold text-xl ${
              isDark ? "text-gray-200" : "text-gray-800"
            } leading-tight`}
          >
            {isRTL ? "تفاصيل المحادثة" : "Conversation Details"}
          </h2>
        </div>
      }
    >
      <Head title={isRTL ? "تفاصيل المحادثة" : "Conversation Details"} />

      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
          {/* --- Conversation Info Header --- */}
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-2xl shadow-lg border mb-6 p-6`}
          >
            <div
              className={`flex items-start justify-between ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              {/* Participants */}
              <div>
                <h3
                  className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {isRTL ? "المشاركون" : "Participants"}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {conversation.participants.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                        isDark ? "bg-gray-700/50" : "bg-gray-50"
                      } ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getRoleColor(
                          p.role
                        )}`}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <div className={isRTL ? "text-right" : "text-left"}>
                        <span
                          className={`text-sm font-semibold block ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {p.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getRoleBadge(
                            p.role
                          )}`}
                        >
                          {getRoleLabel(p.role)}
                        </span>
                      </div>

                      {/* Alert Button */}
                      <button
                        onClick={() => {
                          setSelectedUser(p);
                          setShowAlertModal(true);
                        }}
                        className={`p-1.5 rounded-lg transition ${
                          isDark
                            ? "text-gray-500 hover:text-yellow-400 hover:bg-gray-600"
                            : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
                        }`}
                        title={isRTL ? "إرسال تنبيه" : "Send Alert"}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* School Badge */}
              {conversation.school && (
                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    isDark
                      ? "bg-amber-900/30 text-amber-300"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {conversation.school.name}
                </div>
              )}
            </div>
          </div>

          {/* --- Messages --- */}
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-2xl shadow-lg border overflow-hidden`}
          >
            {/* Messages Container */}
            <div
              className={`p-6 space-y-6 max-h-[60vh] overflow-y-auto ${
                isDark ? "bg-gray-900/30" : "bg-gray-50/50"
              }`}
            >
              {groupedMessages.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 opacity-30"
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
                  <p className="font-medium">
                    {isRTL
                      ? "لا توجد رسائل في هذه المحادثة."
                      : "No messages in this conversation."}
                  </p>
                </div>
              ) : (
                groupedMessages.map((group, groupIdx) => (
                  <div key={groupIdx}>
                    {/* Date Divider */}
                    <div className="flex items-center justify-center my-4">
                      <div
                        className={`px-4 py-1 rounded-full text-xs font-medium ${
                          isDark
                            ? "bg-gray-700 text-gray-400"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {group.date}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-3">
                      {group.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`group flex items-start gap-3 ${
                            isRTL ? "flex-row-reverse" : ""
                          } ${msg.deleted_at ? "opacity-50" : ""}`}
                        >
                          {/* Avatar */}
                          <div
                            className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${getRoleColor(
                              msg.sender.role
                            )}`}
                          >
                            {msg.sender.name.charAt(0)}
                          </div>

                          {/* Message Bubble */}
                          <div className="flex-1 max-w-xl">
                            <div
                              className={`flex items-center gap-2 mb-1 ${
                                isRTL ? "flex-row-reverse" : ""
                              }`}
                            >
                              <span
                                className={`text-sm font-bold ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {msg.sender.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getRoleBadge(
                                  msg.sender.role
                                )}`}
                              >
                                {getRoleLabel(msg.sender.role)}
                              </span>
                              <span
                                className={`text-xs ${
                                  isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                              >
                                {formatTimeOnly(msg.created_at)}
                              </span>
                            </div>

                            <div
                              className={`px-4 py-2.5 rounded-2xl ${
                                msg.deleted_at
                                  ? isDark
                                    ? "bg-red-900/20 border border-red-800/30"
                                    : "bg-red-50 border border-red-200"
                                  : isDark
                                  ? "bg-gray-700"
                                  : "bg-white shadow-sm border border-gray-100"
                              }`}
                            >
                              {msg.deleted_at ? (
                                <p
                                  className={`text-sm italic ${
                                    isDark ? "text-red-400" : "text-red-500"
                                  }`}
                                >
                                  {isRTL
                                    ? "🚫 تم حذف هذه الرسالة من قبل الإدارة"
                                    : "🚫 This message was deleted by admin"}
                                </p>
                              ) : (
                                <p
                                  className={`text-sm leading-relaxed ${
                                    isDark ? "text-gray-200" : "text-gray-700"
                                  }`}
                                >
                                  {msg.body}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Delete Action - appears on hover */}
                          {!msg.deleted_at && (
                            <button
                              onClick={() => {
                                setSelectedMessage(msg);
                                setShowDeleteModal(true);
                              }}
                              className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${
                                isDark
                                  ? "text-gray-600 hover:text-red-400 hover:bg-gray-700"
                                  : "text-gray-300 hover:text-red-500 hover:bg-red-50"
                              }`}
                              title={isRTL ? "حذف الرسالة" : "Delete Message"}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with stats */}
            <div
              className={`px-6 py-3 border-t ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <p
                className={`text-xs ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {isRTL
                  ? `إجمالي الرسائل: ${messages.total}`
                  : `Total messages: ${messages.total}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Delete Message Modal --- */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className={`p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {isRTL ? "حذف الرسالة" : "Delete Message"}
              </h3>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {isRTL
                  ? "هل أنت متأكد من حذف هذه الرسالة؟ سيتم إخفاؤها عن جميع المستخدمين."
                  : "Are you sure? This message will be hidden from all users."}
              </p>
            </div>
          </div>

          {selectedMessage && (
            <div
              className={`p-3 rounded-lg mb-4 ${
                isDark ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <p
                className={`text-xs font-bold mb-1 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {selectedMessage.sender.name}
              </p>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {selectedMessage.body}
              </p>
            </div>
          )}

          <div
            className={`flex gap-3 justify-end ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <button
              onClick={() => setShowDeleteModal(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                isDark
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={handleDeleteMessage}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition"
            >
              {isRTL ? "حذف الرسالة" : "Delete Message"}
            </button>
          </div>
        </div>
      </Modal>

      {/* --- Alert User Modal --- */}
      <Modal show={showAlertModal} onClose={() => setShowAlertModal(false)}>
        <form
          onSubmit={handleAlertUser}
          className={`p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {isRTL ? "إرسال تنبيه" : "Send Alert"}
              </h3>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {isRTL
                  ? `إرسال تنبيه إداري إلى ${selectedUser?.name}`
                  : `Send admin alert to ${selectedUser?.name}`}
              </p>
            </div>
          </div>

          <textarea
            value={alertForm.data.alert_message}
            onChange={(e) => alertForm.setData("alert_message", e.target.value)}
            rows={3}
            placeholder={
              isRTL ? "اكتب رسالة التنبيه هنا..." : "Type alert message here..."
            }
            className={`w-full rounded-lg border p-3 text-sm focus:ring-2 focus:ring-yellow-500 transition ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />

          <div
            className={`flex gap-3 justify-end mt-4 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setShowAlertModal(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                isDark
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={alertForm.processing || !alertForm.data.alert_message}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition disabled:opacity-50"
            >
              {isRTL ? "إرسال التنبيه" : "Send Alert"}
            </button>
          </div>
        </form>
      </Modal>
    </AuthenticatedLayout>
  );
}
