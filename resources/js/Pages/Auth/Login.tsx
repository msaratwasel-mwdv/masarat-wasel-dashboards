import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";

export default function Login({
  status,
  canResetPassword,
}: {
  status?: string;
  canResetPassword: boolean;
}) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();

    post(route("login"), {
      onFinish: () => reset("password"),
    });
  };

  return (
    <div className="mt-28 w-full">
      <Head title="Log in" />

      {/* --- Main Login Card Container --- */}
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* 1. Header Section (Logo & Branding) */}
        <div className="pt-10 pb-6 text-center bg-gradient-to-b from-gray-50 to-white">
          <div className="flex justify-center mb-4 relative">
            {/* Decorative Circle behind Logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-brand-yellow/10 rounded-full blur-xl"></div>

            <div className="relative z-10 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <ApplicationLogo className="w-16 h-16 fill-current text-brand-dark" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-brand-dark tracking-tight">
            مسارات <span className="text-brand-yellow">واصل</span>
          </h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            School Transport Management System
          </p>
        </div>

        <div className="px-8 pb-10">
          {/* --- Status Message --- */}
          {status && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 text-sm font-medium text-green-700 border border-green-200 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              {status}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            {/* 2. Email Field with Icon */}
            <div className="space-y-1">
              <InputLabel
                htmlFor="email"
                value="Email / Username"
                className="text-gray-700 font-bold ml-1"
              />
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400 group-focus-within:text-brand-yellow transition-colors"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <TextInput
                  id="email"
                  type="email"
                  name="email"
                  value={data.email}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/20 transition-all duration-200 text-sm"
                  autoComplete="username"
                  isFocused={true}
                  placeholder="Enter your email"
                  onChange={(e) => setData("email", e.target.value)}
                />
              </div>
              <InputError message={errors.email} className="ml-1" />
            </div>

            {/* 3. Password Field with Icon */}
            <div className="space-y-1">
              <InputLabel
                htmlFor="password"
                value="Password"
                className="text-gray-700 font-bold ml-1"
              />
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400 group-focus-within:text-brand-yellow transition-colors"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <TextInput
                  id="password"
                  type="password"
                  name="password"
                  value={data.password}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/20 transition-all duration-200 text-sm"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  onChange={(e) => setData("password", e.target.value)}
                />
              </div>
              <InputError message={errors.password} className="ml-1" />
            </div>

            {/* 4. Remember Me & Forgot Password */}
            <div className="flex items-center justify-between py-2">
              <label className="flex items-center cursor-pointer">
                <Checkbox
                  name="remember"
                  checked={data.remember}
                  onChange={(e) => setData("remember", e.target.checked)}
                  className="w-5 h-5 text-brand-yellow border-gray-300 rounded focus:ring-brand-yellow"
                />
                <span className="ms-2 text-sm text-gray-600 font-medium">
                  Remember me
                </span>
              </label>

              {canResetPassword && (
                <Link
                  href={route("password.request")}
                  className="text-sm font-semibold text-brand-dark hover:text-brand-yellow transition-colors"
                >
                  Forgot Password?
                </Link>
              )}
            </div>

            {/* 5. Submit Button (Main Action) */}
            <PrimaryButton
              className="w-full justify-center py-4 text-base font-bold rounded-xl shadow-lg shadow-brand-dark/20 bg-brand-dark hover:bg-brand-navy active:scale-[0.98] transition-all duration-200 border-none group"
              disabled={processing}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                <span className="group-hover:text-brand-yellow transition-colors">
                  Sign In
                </span>
              )}
            </PrimaryButton>

            {/* 6. Help / Support Link */}
            <div className="pt-4 text-center">
              <a
                href="#"
                className="inline-flex items-center text-sm text-gray-400 hover:text-brand-dark transition-colors gap-2"
              >
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                Need help? Contact Support
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="mt-8 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Masarat-Wa. All rights reserved.
      </div>
    </div>
  );
}
