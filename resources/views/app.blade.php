<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'مسارات واصل') }}</title>

        <!-- Google Site Name JSON-LD Schema -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "{{ app()->getLocale() === 'ar' ? 'مسارات واصل' : 'Masarat Wasel' }}",
          "alternateName": [
            "واصل",
            "شركة مسارات واصل",
            "Masarat Wasel",
            "Wasel"
          ],
          "url": "{{ url('/') }}"
        }
        </script>

        <!-- Google Organization Schema (Structured Data for Brand Credibility) -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "{{ app()->getLocale() === 'ar' ? 'مسارات واصل' : 'Masarat Wasel' }}",
          "alternateName": [
            "واصل",
            "شركة مسارات واصل",
            "Masarat Wasel",
            "Wasel"
          ],
          "url": "{{ url('/') }}",
          "logo": "{{ asset('images/logo2.png') }}",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+96879967769",
            "contactType": "customer service",
            "areaServed": "OM",
            "availableLanguage": ["Arabic", "English"]
          },
          "sameAs": [
            "https://www.instagram.com/wasel_company?igsh=MXhvOXhxN3l0c2Zvdw==",
            "https://www.linkedin.com/in/msarat-wasel-company-4a244b3b2",
            "https://www.facebook.com/share/1F7AL1CXs6/"
          ]
        }
        </script>

        <!-- Favicon Infrastructure (Server-side rendered with absolute URLs) -->
        <link rel="shortcut icon" href="{{ asset('favicon.ico') }}" type="image/x-icon">
        <link rel="icon" type="image/png" sizes="48x48" href="{{ asset('images/logo-white.png') }}">
        <link rel="icon" type="image/png" sizes="96x96" href="{{ asset('images/logo-white.png') }}">
        <link rel="icon" type="image/png" sizes="144x144" href="{{ asset('images/logo-white.png') }}">
        <link rel="icon" type="image/png" sizes="192x192" href="{{ asset('images/logo-white.png') }}">
        <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('images/logo-white.png') }}">

        <!-- Server-side Rendered SEO Metadata (Inertia will overwrite this dynamically once loaded) -->
        @if(isset($page['component']) && $page['component'] === 'Welcome')
            <meta name="description" content="شركة مسارات واصل هي المنصة الرائدة لنقل الطلاب وإدارة الحافلات المدرسية في سلطنة عمان. نقدم تطبيقاً ذكياً لتتبع حافلات المدارس بأمان وربط أولياء الأمور والمشرفات والمدارس لحظياً." inertia>
            <meta name="keywords" content="شركة مسارات واصل, شركة نقل طلاب, خدمات النقل المدرسي, تطبيق النقل المدرسي, تتبع الحافلات المدرسية, نقل الطلاب بأمان, حافلات المدارس, تطبيق ولي الأمر" inertia>
            
            <link rel="canonical" href="{{ url('/') }}" inertia>
            <link rel="alternate" href="{{ url('/') }}" hreflang="ar" inertia>
            <link rel="alternate" href="{{ url('/en') }}" hreflang="en" inertia>
            <link rel="alternate" href="{{ url('/') }}" hreflang="x-default" inertia>

            <!-- Open Graph / Facebook -->
            <meta property="og:type" content="website" inertia>
            <meta property="og:url" content="{{ url('/') }}" inertia>
            <meta property="og:title" content="مسارات واصل | نقل ذكي وآمن للمدارس في سلطنة عمان" inertia>
            <meta property="og:description" content="شركة مسارات واصل هي المنصة الرائدة لنقل الطلاب وإدارة الحافلات المدرسية في سلطنة عمان. نقدم تطبيقاً ذكياً لتتبع حافلات المدارس بأمان." inertia>
            <meta property="og:image" content="{{ asset('images/logo2.png') }}" inertia>

            <!-- Twitter -->
            <meta property="twitter:card" content="summary_large_image" inertia>
            <meta property="twitter:url" content="{{ url('/') }}" inertia>
            <meta property="twitter:title" content="مسارات واصل | نقل ذكي وآمن للمدارس في سلطنة عمان" inertia>
            <meta property="twitter:description" content="تطبيق ذكي لتتبع حافلات المدارس بأمان في سلطنة عمان." inertia>
            <meta property="twitter:image" content="{{ asset('images/logo2.png') }}" inertia>
        @elseif(isset($page['component']) && $page['component'] === 'Subscription')
            <meta name="description" content="اشترك الآن في منصة مسارات واصل للتحول الرقمي الكامل في إدارة النقل المدرسي. باقات مرنة لتأمين وتتبع حافلات الطلاب في سلطنة عمان." inertia>
            <meta name="keywords" content="اشتراك النقل المدرسي, أسعار النقل المدرسي, تسجيل مدرسة مسارات واصل, باقات النقل المدرسي, تكلفة نظام تتبع الحافلات" inertia>
            
            <link rel="canonical" href="{{ route('subscription') }}" inertia>

            <!-- Open Graph / Facebook -->
            <meta property="og:type" content="website" inertia>
            <meta property="og:url" content="{{ route('subscription') }}" inertia>
            <meta property="og:title" content="انضم لمنصة مسارات واصل | طلب اشتراك مدرسة" inertia>
            <meta property="og:description" content="اشترك الآن في منصة مسارات واصل للتحول الرقمي الكامل في إدارة النقل المدرسي." inertia>
            <meta property="og:image" content="{{ asset('assets/images/masarat-wasel-logo.jpg') }}" inertia>

            <!-- Twitter -->
            <meta property="twitter:card" content="summary_large_image" inertia>
            <meta property="twitter:url" content="{{ route('subscription') }}" inertia>
            <meta property="twitter:title" content="انضم لمنصة مسارات واصل | طلب اشتراك مدرسة" inertia>
            <meta property="twitter:description" content="اشترك الآن في منصة مسارات واصل للتحول الرقمي الكامل في إدارة النقل المدرسي." inertia>
            <meta property="twitter:image" content="{{ asset('assets/images/masarat-wasel-logo.jpg') }}" inertia>
        @elseif(isset($page['component']) && $page['component'] === 'Events')
            <meta name="description" content="تابع أحدث أخبار شركة مسارات واصل، فعالياتنا، ورش العمل، وأحدث الإضافات لأسطول النقل المدرسي في سلطنة عمان." inertia>
            <meta name="keywords" content="أخبار النقل المدرسي, فعاليات مسارات واصل, ورش عمل سلامة الحافلات, أخبار حافلات عمان" inertia>
            
            <link rel="canonical" href="{{ route('events.index') }}" inertia>

            <!-- Open Graph / Facebook -->
            <meta property="og:type" content="website" inertia>
            <meta property="og:url" content="{{ route('events.index') }}" inertia>
            <meta property="og:title" content="الفعاليات والأخبار | مسارات واصل" inertia>
            <meta property="og:description" content="تابع أحدث أخبار شركة مسارات واصل، فعالياتنا، ورش العمل، وأحدث الإضافات لأسطول النقل المدرسي." inertia>
            <meta property="og:image" content="{{ asset('assets/images/masarat-wasel-logo.jpg') }}" inertia>

            <!-- Twitter -->
            <meta property="twitter:card" content="summary_large_image" inertia>
            <meta property="twitter:url" content="{{ route('events.index') }}" inertia>
            <meta property="twitter:title" content="الفعاليات والأخبار | مسارات واصل" inertia>
            <meta property="twitter:description" content="تابع أحدث أخبار شركة مسارات واصل، فعالياتنا، ورش العمل، وأحدث الإضافات لأسطول النقل المدرسي." inertia>
            <meta property="twitter:image" content="{{ asset('assets/images/masarat-wasel-logo.jpg') }}" inertia>
        @else
            <!-- Fallback Meta tags for other subpages -->
            <meta name="description" content="مسارات واصل - منصة النقل المدرسي الذكي والآمن في سلطنة عمان" inertia>
            <link rel="canonical" href="{{ url()->current() }}" inertia>
            
            <!-- Open Graph / Facebook -->
            <meta property="og:type" content="website" inertia>
            <meta property="og:title" content="مسارات واصل" inertia>
            <meta property="og:description" content="منصة النقل المدرسي الذكي والآمن في سلطنة عمان" inertia>
            <meta property="og:image" content="{{ asset('images/logo2.png') }}" inertia>
            
            <!-- Twitter -->
            <meta property="twitter:card" content="summary_large_image" inertia>
            <meta property="twitter:title" content="مسارات واصل" inertia>
            <meta property="twitter:description" content="منصة النقل المدرسي الذكي والآمن في سلطنة عمان" inertia>
            <meta property="twitter:image" content="{{ asset('images/logo2.png') }}" inertia>
        @endif

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])

        @if(isset($page['component']) && $page['component'] === 'Welcome')
            <link rel="stylesheet" href="{{ asset('css/main.css') }}" />
            <link rel="stylesheet" href="{{ asset('css/landing.css') }}" />
            <link rel="stylesheet" href="{{ asset('css/enhanced.css') }}" />
        @endif

        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>

