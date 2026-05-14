import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, MessageCircle, Home, RefreshCw, ShieldX, FileQuestion, Clock, ServerCrash } from 'lucide-react';

interface ErrorPageProps {
    status: number;
}

export default function ErrorPage({ status }: ErrorPageProps) {
    const errorConfig: Record<number, { titleAr: string; titleEn: string; descAr: string; descEn: string; icon: JSX.Element; color: string }> = {
        403: {
            titleAr: 'الوصول مرفوض',
            titleEn: 'Access Denied',
            descAr: 'ليس لديك صلاحية للوصول إلى هذه الصفحة. تأكد من تسجيل دخولك بالحساب الصحيح.',
            descEn: 'You do not have permission to access this page. Make sure you are logged in with the correct account.',
            icon: <ShieldX className="w-16 h-16" />,
            color: 'from-orange-500 to-red-500',
        },
        404: {
            titleAr: 'الصفحة غير موجودة',
            titleEn: 'Page Not Found',
            descAr: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها. تأكد من صحة الرابط.',
            descEn: 'The page you are looking for does not exist or has been moved. Please check the URL.',
            icon: <FileQuestion className="w-16 h-16" />,
            color: 'from-blue-500 to-indigo-500',
        },
        419: {
            titleAr: 'انتهت صلاحية الجلسة',
            titleEn: 'Session Expired',
            descAr: 'انتهت صلاحية جلستك. يرجى تحديث الصفحة أو تسجيل الدخول مرة أخرى.',
            descEn: 'Your session has expired. Please refresh the page or log in again.',
            icon: <Clock className="w-16 h-16" />,
            color: 'from-amber-500 to-orange-500',
        },
        500: {
            titleAr: 'خطأ في الخادم',
            titleEn: 'Server Error',
            descAr: 'حدث خطأ غير متوقع في الخادم. فريقنا التقني تم إشعاره تلقائياً ويعمل على حل المشكلة.',
            descEn: 'An unexpected server error occurred. Our technical team has been automatically notified and is working to resolve the issue.',
            icon: <ServerCrash className="w-16 h-16" />,
            color: 'from-red-500 to-rose-600',
        },
        503: {
            titleAr: 'الخدمة غير متوفرة',
            titleEn: 'Service Unavailable',
            descAr: 'الخدمة غير متوفرة مؤقتاً بسبب أعمال الصيانة. سيتم استعادتها قريباً.',
            descEn: 'The service is temporarily unavailable due to maintenance. It will be restored shortly.',
            icon: <AlertTriangle className="w-16 h-16" />,
            color: 'from-purple-500 to-violet-600',
        },
    };

    const config = errorConfig[status] || {
        titleAr: 'حدث خطأ',
        titleEn: 'Something Went Wrong',
        descAr: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
        descEn: 'An unexpected error occurred. Please try again.',
        icon: <AlertTriangle className="w-16 h-16" />,
        color: 'from-slate-500 to-slate-700',
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] relative overflow-hidden font-sans" dir="rtl">
            <Head>
                <title>{`${status} - ${config.titleAr} | مسارات واصل`}</title>
                <link rel="icon" type="image/png" href="/images/logo2.png" />
            </Head>

            {/* Decorative Background */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
            <div className="absolute top-0 left-0 -ml-20 -mt-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

            <div className="w-full max-w-lg px-6 relative z-10">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 p-8 sm:p-12 text-center">

                    {/* Logo */}
                    <Link href="/" className="inline-block mb-8">
                        <img src="/images/logo2.png" alt="Masarat Wasel" className="h-14 object-contain rounded-xl mx-auto" />
                    </Link>

                    {/* Error Code */}
                    <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br ${config.color} text-white mb-6 shadow-lg`}>
                        {config.icon}
                    </div>

                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 mb-2">
                        {status}
                    </div>

                    <h1 className="text-2xl font-extrabold text-slate-800 mb-2">{config.titleAr}</h1>
                    <p className="text-sm text-slate-400 font-medium mb-4">{config.titleEn}</p>

                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                        {config.descAr}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            onClick={() => window.history.back()}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all text-sm"
                        >
                            <ArrowRight size={18} />
                            رجوع
                        </button>

                        <Link
                            href="/"
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm border border-slate-200"
                        >
                            <Home size={18} />
                            الرئيسية
                        </Link>

                        {status === 419 && (
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all text-sm shadow-lg"
                            >
                                <RefreshCw size={18} />
                                تحديث الصفحة
                            </button>
                        )}
                    </div>

                    {/* Contact Support */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-400 font-medium mb-3">هل تحتاج مساعدة؟</p>
                        <a
                            href="https://wa.me/96879967769"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 hover:-translate-y-0.5 transition-all text-sm shadow-lg shadow-green-500/20"
                        >
                            <MessageCircle size={16} />
                            تواصل مع الدعم الفني
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-slate-400 font-medium">
                    © {new Date().getFullYear()} مسارات واصل. جميع الحقوق محفوظة.
                </div>
            </div>
        </div>
    );
}
