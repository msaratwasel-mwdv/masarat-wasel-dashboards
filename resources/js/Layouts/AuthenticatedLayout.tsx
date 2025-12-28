import { useState, PropsWithChildren, ReactNode } from "react";
import { Link, usePage } from "@inertiajs/react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { User } from "@/types";

export default function Authenticated({
  header,
  children,
}: PropsWithChildren<{ header?: ReactNode }>) {
  const user = usePage().props.auth.user;
  // محاكاة المسار الحالي لتفعيل الزر الأصفر (في الواقع نستخدم route().current())

  const menuItems = [
    { label: "Dashboard", route: "admin.dashboard", icon: "grid" },
    { label: "Schools", route: "admin.schools.index", icon: "school" }, // استبدل route بـ schools.index // سنربطها لاحقاً بصفحة المدارس
    { label: "Fleet Management", route: "admin.dashboard", icon: "bus" },
    { label: "Attendance", route: "admin.dashboard", icon: "user" },
    { label: "Notifications", route: "admin.dashboard", icon: "bell" },
    { label: "Settings", route: "profile.edit", icon: "cog" },
  ];

  return (
    <div
      className="min-h-screen bg-[#f1f5f9] flex font-sans text-right"
      dir="ltr"
    >
      {" "}
      {/* dir="ltr" لأن التصميم إنجليزي مؤقتاً للمطابقة */}
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-brand-dark text-white flex flex-col fixed h-full z-10">
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 pt-4">
          <span className="text-2xl font-bold tracking-wide">EduTrack</span>
        </div>
        <div className="px-6 pb-6 text-xs text-gray-400">Management Portal</div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item, index) => {
            const isActive = route().current(item.route); // جعلنا الأول نشطاً للمحاكاة
            return (
              <Link
                key={index}
                href={route(item.route)}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-[#fbbf24] text-black font-semibold shadow-md"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="w-6 h-6 mr-3">
                  {/* Simple Icons Rendering */}
                  {item.icon === "grid" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  )}
                  {item.icon === "school" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  )}
                  {item.icon === "bus" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  )}{" "}
                  {/* Bus Icon Placeholder */}
                  {item.icon === "user" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                  {item.icon === "bell" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  )}
                  {item.icon === "cog" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <Link
            method="post"
            href={route("logout")}
            as="button"
            className="flex items-center text-gray-400 hover:text-white transition w-full"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </Link>
        </div>
      </aside>
      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 ml-64">
        {" "}
        {/* ml-64 to account for fixed sidebar */}
        {/* TOP HEADER */}
        <header className="h-20 bg-white flex items-center justify-between px-8 sticky top-0 z-10">
          {/* Search Bar */}
          <div className="w-96 relative">
            <span className="absolute left-3 top-3 text-gray-400">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search schools..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm"
            />
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-gray-600 relative">
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>

            <div className="flex items-center space-x-3 border-l pl-4 border-gray-200">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold">
                AD
              </div>
              <span className="text-sm font-bold text-gray-700">
                ADMIN PANEL
              </span>
            </div>
          </div>
        </header>
        {/* PAGE CONTENT */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
