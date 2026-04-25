import { useForm } from "@inertiajs/react";
import { Transition } from "@headlessui/react";
import { FormEventHandler, useRef } from "react";
import InputError from "@/Components/InputError";
import { useTheme } from "@/Contexts/ThemeContext";
import { DS_inputCls, DS_labelCls, DS_submitBtn } from "@/lib/DS";
import { Lock, KeyRound, ShieldCheck } from "lucide-react";

export default function UpdatePasswordForm() {
    const { isRTL: isRtl } = useTheme();
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, put, errors, reset, processing, recentlySuccessful } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route("password.update"), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset("password", "password_confirmation");
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset("current_password");
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className="space-y-6">
            <header>
                <h2 className="text-lg font-bold text-[#0f2044] dark:text-white">
                    {isRtl ? "أمان الحساب" : "Account Security"}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isRtl 
                        ? "تغيير كلمة المرور الخاصة بك بانتظام يساعد في الحفاظ على أمان حسابك."
                        : "Regularly changing your password helps keep your account secure."}
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 max-w-md">
                        <label className={DS_labelCls} htmlFor="current_password">
                            <KeyRound className="w-3 h-3 inline-block mb-1 mx-1" />
                            {isRtl ? "كلمة المرور الحالية" : "Current Password"}
                        </label>
                        <input
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) => setData("current_password", e.target.value)}
                            type="password"
                            className={DS_inputCls}
                            autoComplete="current-password"
                        />
                        <InputError message={errors.current_password} className="mt-2" />
                    </div>

                    <div className="max-w-md">
                        <label className={DS_labelCls} htmlFor="password">
                            <Lock className="w-3 h-3 inline-block mb-1 mx-1" />
                            {isRtl ? "كلمة المرور الجديدة" : "New Password"}
                        </label>
                        <input
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData("password", e.target.value)}
                            type="password"
                            className={DS_inputCls}
                            autoComplete="new-password"
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="max-w-md">
                        <label className={DS_labelCls} htmlFor="password_confirmation">
                            <ShieldCheck className="w-3 h-3 inline-block mb-1 mx-1" />
                            {isRtl ? "تأكيد كلمة المرور" : "Confirm New Password"}
                        </label>
                        <input
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData("password_confirmation", e.target.value)}
                            type="password"
                            className={DS_inputCls}
                            autoComplete="new-password"
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-[#243460]">
                    <button type="submit" className={DS_submitBtn(processing)} disabled={processing}>
                        {isRtl ? "تحديث كلمة المرور" : "Update Password"}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {isRtl ? "✓ تم التحديث بنجاح" : "✓ Password updated"}
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
