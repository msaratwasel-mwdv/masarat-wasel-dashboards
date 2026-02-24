import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import axios from "axios";
// ملاحظة: للتجربة الحية مع Laravel Reverb
// import Echo from "laravel-echo";
// import Pusher from "pusher-js";

interface DemoData {
  parent: string;
  driver: string;
  supervisor: string;
  parent_id: number;
  driver_id: number;
  super_id: number;
}

interface Message {
  id?: number;
  body: string;
  sender_id: number;
  created_at: string;
  sender_name?: string;
  is_mine?: boolean;
}

export default function ChatSimulator({
  demoData,
  appUrl,
}: {
  demoData: DemoData;
  appUrl: string;
}) {
  const [activeUserRole, setActiveUserRole] = useState<
    "parent" | "driver" | "supervisor"
  >("parent");
  const [activeToken, setActiveToken] = useState(demoData?.parent || "");
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // تحديث التوكن عند تغيير المستخدم
  useEffect(() => {
    if (demoData) setActiveToken(demoData[activeUserRole]);
    setContacts([]);
    setActiveConversation(null);
    setMessages([]);
  }, [activeUserRole, demoData]);

  if (!demoData) {
    return (
      <AuthenticatedLayout
        header={
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            محاكي الشات
          </h2>
        }
      >
        <Head title="Chat Simulator Error" />
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div
              className="bg-red-50 p-6 rounded-lg text-red-600 font-bold border border-red-200"
              dir="rtl"
            >
              ⚠️ بيانات المحاكي غير موجودة بالكاش! يبدو أن الكاش تم تفريغه (أو
              لم يشتغل الSeeder بنجاح). الرجاء تشغيل السييدر أولاً من الترمنال
              عبر الأمر:
              <br />
              <br />
              <code
                className="bg-white px-2 py-1 rounded inline-block border text-red-500"
                dir="ltr"
              >
                php artisan db:seed --class=ChatDemoSeeder
              </code>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // جلب جهات الاتصال فور تغيير التوكن
  useEffect(() => {
    if (activeToken) {
      fetch("/api/chat/contacts", {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          Accept: "application/json",
        },
        credentials: "omit",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setContacts(data.data);
          }
        })
        .catch((err) => console.error("Error fetching contacts:", err));
    }
  }, [activeToken]);

  // التمرير للأسفل في المحادثة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (contactId: number) => {
    try {
      // 1. بدء/جلب المحادثة
      const convRes = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        credentials: "omit",
        body: JSON.stringify({ receiver_id: contactId }),
      });
      const convData = await convRes.json();

      if (!convData.success) {
        console.error("Failed to open conversation", convData);
        return;
      }

      const convId = convData.data.id;
      setActiveConversation(convData.data);

      // 2. جلب الرسائل
      const msgsRes = await fetch(
        `/api/chat/conversations/${convId}/messages`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
          credentials: "omit",
        }
      );
      const msgsData = await msgsRes.json();
      const messagesToSet = Array.isArray(msgsData.data)
        ? msgsData.data.reverse()
        : [];
      setMessages(messagesToSet);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const tempMsg = {
      body: newMessage,
      sender_id:
        activeUserRole === "parent"
          ? demoData.parent_id
          : activeUserRole === "driver"
          ? demoData.driver_id
          : demoData.super_id,
      created_at: new Date().toISOString(),
      is_mine: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    try {
      await fetch(`/api/chat/conversations/${activeConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        credentials: "omit",
        body: JSON.stringify({ body: tempMsg.body }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          محاكي الشات للـ APP
        </h2>
      }
    >
      <Head title="Chat Simulator" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">
              1. إختر من أنت الآن (تسجيل دخول وهمي)
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveUserRole("parent")}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  activeUserRole === "parent"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                👨‍👩‍👦 أنا ولي الأمر
              </button>
              <button
                onClick={() => setActiveUserRole("driver")}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  activeUserRole === "driver"
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                👨‍✈️ أنا السائق
              </button>
              <button
                onClick={() => setActiveUserRole("supervisor")}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  activeUserRole === "supervisor"
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                👩‍🏫 أنا المشرفة
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-500 font-mono bg-gray-50 p-2 rounded">
              Token: Bearer {activeToken.substring(0, 15)}...
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* جهات الاتصال */}
            <div className="md:col-span-1 bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b font-bold text-gray-700">
                جهات الاتصال (الخاصة بي)
              </div>
              <div className="p-2 space-y-1 h-[500px] overflow-y-auto">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => openConversation(contact.id)}
                    className="w-full text-right p-3 hover:bg-indigo-50 rounded-lg flex items-center justify-between border border-transparent hover:border-indigo-100 transition-all"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">
                        {contact.name}
                      </div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                        {contact.role === "parent"
                          ? "ولي أمر"
                          : contact.role === "driver"
                          ? "سائق"
                          : "مشرفة"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* نافذة المحادثة */}
            <div className="md:col-span-3 bg-white rounded-lg shadow-sm border flex flex-col h-[500px]">
              {activeConversation ? (
                <>
                  <div className="bg-indigo-600 px-6 py-4 flex flex-col justify-center rounded-t-lg">
                    <span className="text-white font-bold text-lg">
                      دردشة مع{" "}
                      {activeConversation.other_participants
                        ?.map((p: any) => p.name)
                        .join(", ") || "..."}
                    </span>
                  </div>

                  <div
                    className="flex-1 p-6 overflow-y-auto bg-gray-50 bg-opacity-50 space-y-4"
                    dir="rtl"
                  >
                    {messages.map((msg, idx) => {
                      const isMine = msg.is_mine ?? false;
                      return (
                        <div
                          key={idx}
                          className={`flex ${
                            isMine ? "justify-start" : "justify-end"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                              isMine
                                ? "bg-indigo-600 text-white rounded-tr-none"
                                : "bg-white border rounded-tl-none text-gray-800"
                            }`}
                          >
                            <div className="text-[15px]">{msg.body}</div>
                            <div
                              className={`text-[10px] mt-1 ${
                                isMine ? "text-indigo-200" : "text-gray-400"
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString(
                                "ar-SA",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <form
                    onSubmit={sendMessage}
                    className="p-4 bg-white border-t rounded-b-lg flex gap-3"
                    dir="rtl"
                  >
                    <input
                      type="text"
                      className="flex-1 rounded-full border-gray-300 px-6 py-3 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                      placeholder="اكتب رسالتك وتخيلك تستخدم الجوال..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-6 py-3 rounded-full hover:bg-indigo-700 font-bold shadow-md transition-all"
                    >
                      إرسال 🚀
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <svg
                    className="w-20 h-20 mb-4 opacity-20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-xl font-medium">
                    الرجاء اختيار جهة اتصال للبدء
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
