import { Link, useForm, usePage } from "@inertiajs/react";
import { Transition } from "@headlessui/react";
import { FormEventHandler } from "react";
import InputError from "@/Components/InputError";
import { useTheme } from "@/Contexts/ThemeContext";
import { DS_inputCls, DS_labelCls, DS_submitBtn } from "@/lib/DS";
import { User, Mail, Phone, Fingerprint, MapPin, BadgeCheck } from "lucide-react";

export default function UpdateProfileInformationForm({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { isRTL: isRtl } = useTheme();
    const user = usePage().props.auth.user as any;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        first_name_ar: user.first_name_ar || "",
        second_name_ar: user.second_name_ar || "",
        third_name_ar: user.third_name_ar || "",
        last_name_ar: user.last_name_ar || "",
        email: user.email,
        phone: user.phone || "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route("profile.update"));
    };

    return (
        <section className="space-y-6">
            <header>
                <h2 className="text-lg font-bold text-[#0f2044] dark:text-white">
                    {isRtl ? "بيانات الحساب الشخصي" : "Personal Information"}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isRtl 
                        ? "تعديل اسمك وبريدك الإلكتروني ورقم الجوال المرتبط بحسابك."
                        : "Update your name, email address, and phone number associated with your account."}
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                {/* Name Section - Smart Grid */}
                <div className="p-6 rounded-[24px] bg-[#0f2044]/[0.02] dark:bg-[#0f2044]/20 border border-[#0f2044]/5 dark:border-[#243460] space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#f5b800]/20 text-[#f5b800] flex items-center justify-center">
                            <BadgeCheck className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black text-[#0f2044] dark:text-white uppercase tracking-wider">
                            {isRtl ? "بيانات الهوية والاسم" : "Identity & Name Information"}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="group">
                            <label className={DS_labelCls} htmlFor="first_name_ar">
                                <User className="w-3 h-3 inline-block mb-1 mx-1 group-focus-within:text-[#f5b800] transition-colors" />
                                {isRtl ? "الاسم الأول" : "First Name"}
                            </label>
                            <input
                                id="first_name_ar"
                                className={DS_inputCls}
                                value={data.first_name_ar}
                                onChange={(e) => setData("first_name_ar", e.target.value)}
                                required
                            />
                            <InputError className="mt-2" message={errors.first_name_ar} />
                        </div>
                        <div className="group">
                            <label className={DS_labelCls} htmlFor="second_name_ar">
                                {isRtl ? "اسم الأب" : "Father's Name"}
                            </label>
                            <input
                                id="second_name_ar"
                                className={DS_inputCls}
                                value={data.second_name_ar}
                                onChange={(e) => setData("second_name_ar", e.target.value)}
                            />
                            <InputError className="mt-2" message={errors.second_name_ar} />
                        </div>
                        <div className="group">
                            <label className={DS_labelCls} htmlFor="third_name_ar">
                                {isRtl ? "اسم الجد" : "Grandfather's Name"}
                            </label>
                            <input
                                id="third_name_ar"
                                className={DS_inputCls}
                                value={data.third_name_ar}
                                onChange={(e) => setData("third_name_ar", e.target.value)}
                            />
                            <InputError className="mt-2" message={errors.third_name_ar} />
                        </div>
                        <div className="group">
                            <label className={DS_labelCls} htmlFor="last_name_ar">
                                <Fingerprint className="w-3 h-3 inline-block mb-1 mx-1 group-focus-within:text-[#f5b800] transition-colors" />
                                {isRtl ? "اللقب/العائلة" : "Family Name"}
                            </label>
                            <input
                                id="last_name_ar"
                                className={DS_inputCls}
                                value={data.last_name_ar}
                                onChange={(e) => setData("last_name_ar", e.target.value)}
                                required
                            />
                            <InputError className="mt-2" message={errors.last_name_ar} />
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className={DS_labelCls} htmlFor="email">
                            <Mail className="w-3 h-3 inline-block mb-1 mx-1" />
                            {isRtl ? "البريد الإلكتروني" : "Email Address"}
                        </label>
                        <input
                            id="email"
                            type="email"
                            className={DS_inputCls}
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            required
                            autoComplete="username"
                        />
                        <InputError className="mt-2" message={errors.email} />
                    </div>

                    <div>
                        <label className={DS_labelCls} htmlFor="phone">
                            <Phone className="w-3 h-3 inline-block mb-1 mx-1" />
                            {isRtl ? "رقم الجوال" : "Phone Number"}
                        </label>
                        <input
                            id="phone"
                            className={DS_inputCls}
                            value={data.phone}
                            onChange={(e) => setData("phone", e.target.value)}
                            autoComplete="tel"
                        />
                        <InputError className="mt-2" message={errors.phone} />
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50">
                        <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
                            {isRtl ? "بريدك الإلكتروني غير مفعل." : "Your email address is unverified."}
                            <Link
                                href={route("verification.send")}
                                method="post"
                                as="button"
                                className="underline mx-2 hover:text-amber-900 dark:hover:text-amber-300"
                            >
                                {isRtl ? "انقر هنا لإعادة إرسال رسالة التفعيل." : "Click here to re-send the verification email."}
                            </Link>
                        </p>

                        {status === "verification-link-sent" && (
                            <div className="mt-2 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                {isRtl 
                                    ? "تم إرسال رابط تفعيل جديد إلى بريدك الإلكتروني." 
                                    : "A new verification link has been sent to your email address."}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-[#243460]">
                    <button type="submit" className={DS_submitBtn(processing)} disabled={processing}>
                        {isRtl ? "حفظ التغييرات" : "Save Changes"}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {isRtl ? "✓ تم الحفظ بنجاح" : "✓ Saved successfully"}
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
