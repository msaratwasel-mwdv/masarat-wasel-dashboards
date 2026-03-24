import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import InputError from '@/Components/InputError';
import { Mail, Lock, ArrowRight, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';

export default function Login({
    status,
}: {
    status?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] relative overflow-hidden font-sans" dir="rtl">
            <Head>
                <title>تسجيل الدخول - مسارات واصل</title>
                <meta name="description" content="تسجيل الدخول إلى منصة وصل للنقل المدرسي" />
                <link rel="icon" type="image/png" href="/assets/images/masarat-wasel-logo.jpg" />
            </Head>

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
            <div className="absolute top-0 left-0 -ml-20 -mt-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

            {/* Back to Home */}
            <Link 
                href="/" 
                className="absolute top-6 right-6 lg:top-10 lg:right-10 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium z-10 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm hover:shadow-md border border-slate-100"
            >
                <ArrowRight size={18} />
                <span>العودة للرئيسية</span>
            </Link>

            <div className="w-full max-w-md px-6 relative z-10">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 p-8 sm:p-10 transition-transform hover:-translate-y-1 duration-500">
                    
                    {/* Header */}
                    <div className="text-center mb-10">
                        <Link href="/" className="inline-block group">
                            <div className="mx-auto mb-4">
                                <img src="/assets/images/masarat-wasel-logo.jpg" alt="Masarat Wasel" className="h-14 object-contain rounded-xl mx-auto" />
                            </div>
                            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">مسارات واصل</h1>
                        </Link>
                        <p className="text-slate-500 mt-3 font-medium text-sm">منصة النقل المدرسي الذكية</p>
                    </div>

                    {status && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm font-medium text-emerald-700 text-center flex items-center justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            {status}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={submit} className="space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">تسجيل الدخول</h2>
                            <p className="text-slate-500 text-sm mt-1">أدخل بيانات الاعتماد للمتابعة للوحة التحكم</p>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 block" htmlFor="email">
                                عنوان البريد الإلكتروني
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className={`block w-full rounded-xl border-0 py-3.5 pr-11 pl-4 text-slate-800 bg-slate-50 shadow-sm ring-1 ring-inset ${errors.email ? 'ring-red-400 focus:ring-red-500 bg-red-50/50' : 'ring-slate-200 focus:ring-blue-500 focus:bg-white'} hover:bg-slate-100 transition-all duration-200 sm:text-sm sm:leading-6 focus:ring-2`}
                                    placeholder="name@example.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1 text-red-500 text-xs" />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 block" htmlFor="password">
                                كلمة المرور
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    className={`block w-full rounded-xl border-0 py-3.5 pr-11 pl-12 text-slate-800 bg-slate-50 shadow-sm ring-1 ring-inset ${errors.password ? 'ring-red-400 focus:ring-red-500 bg-red-50/50' : 'ring-slate-200 focus:ring-blue-500 focus:bg-white'} hover:bg-slate-100 transition-all duration-200 sm:text-sm sm:leading-6 focus:ring-2`}
                                    placeholder="••••••••"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-1 text-red-500 text-xs" />
                        </div>

                        {/* Options */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                    />
                                    <div className="w-5 h-5 rounded border border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center group-hover:border-blue-500">
                                        <svg className={`w-3 h-3 text-white fill-current transition-opacity ${data.remember ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 20 20">
                                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                                        </svg>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">تذكرني</span>
                            </label>
                            
                            <Link href={route('password.request')} className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                                نسيت كلمة المرور؟
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="w-full relative group overflow-hidden rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        جاري تسجيل الدخول...
                                    </>
                                ) : (
                                    'تسجيل الدخول'
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                        </button>

                        {/* Divider */}
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm font-medium leading-6">
                                <span className="bg-white px-4 text-slate-400">أو</span>
                            </div>
                        </div>

                        {/* Create Account */}
                        <div className="text-center pb-2">
                            <p className="text-slate-500 text-sm">
                                ليس لديك حساب؟{' '}
                                <Link 
                                    href={route('subscription')} 
                                    className="font-bold text-blue-600 hover:text-blue-500 transition-colors inline-block"
                                >
                                    إنشاء حساب مجاني
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
                
                {/* Minimal Footer */}
                <div className="mt-8 text-center px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium">
                    <p>© {new Date().getFullYear()} مسارات واصل. جميع الحقوق محفوظة.</p>
                    <ul className="flex items-center gap-4 mt-4 sm:mt-0">
                        <li><a href="#" className="hover:text-slate-800 transition-colors">سياسة الخصوصية</a></li>
                        <li><a href="#" className="hover:text-slate-800 transition-colors">شروط الاستخدام</a></li>
                        <li><a href="#" className="hover:text-slate-800 transition-colors">المساعدة</a></li>
                    </ul>
                </div>
            </div>
            
        </div>
    );
}
