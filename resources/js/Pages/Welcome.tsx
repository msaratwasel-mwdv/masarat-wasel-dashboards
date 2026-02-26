import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { useEffect } from "react";

export default function Welcome({
  auth,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
  useEffect(() => {
    // Smooth scroll implementation
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (this: HTMLAnchorElement, e) {
        e.preventDefault();
        const defaultPrevented = e.defaultPrevented;
        const targetId = this.getAttribute("href");
        if (targetId) {
          const target = document.querySelector(targetId);
          if (target) {
            target.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }
      });
    });

    // Theme toggle logic (basic placeholder if main.js handled it, or let main.js handle it)
    const script = document.createElement("script");
    script.src = "/js/main.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>مسارات واصل - ثورة في إدارة النقل المدرسي</title>
        <meta
          name="description"
          content="مسارات واصل - منصة ذكية لإدارة النقل المدرسي. آمنة وفعالة وشفافة للمدارس الحديثة."
        />
        <link rel="stylesheet" href="/css/main.css" />
        <link rel="stylesheet" href="/css/landing.css" />
        <link rel="stylesheet" href="/css/enhanced.css" />
        <script src="https://unpkg.com/@phosphor-icons/web"></script>
        <link rel="icon" type="image/png" href="/assets/images/icon 3.png" />
      </Head>

      <div dir="rtl">
        {/* Navigation */}
        <nav className="navbar">
          <div className="container navbar-container">
            <Link href="/" className="navbar-brand">
              <img
                src="/assets/images/icon 3.png"
                alt="شعار مسارات واصل"
                style={{ width: "40px", height: "40px", objectFit: "contain" }}
              />
              <span>مسارات واصل</span>
            </Link>

            {/* Main Navigation */}
            <ul className="navbar-nav nav-links hide-mobile">
              <li>
                <a href="#home" className="nav-link">
                  الرئيسية
                </a>
              </li>
              <li>
                <a href="#features" className="nav-link">
                  المميزات
                </a>
              </li>
              <li>
                <a href="#services" className="nav-link">
                  الخدمات
                </a>
              </li>
              <li>
                <a href="#pricing" className="nav-link">
                  الأسعار
                </a>
              </li>
            </ul>

            {/* Action Buttons */}
            <ul className="navbar-nav nav-actions hide-mobile">
              <li>
                <button className="theme-toggle" aria-label="تبديل المظهر">
                  <i className="ph ph-moon" style={{ fontSize: "24px" }}></i>
                </button>
              </li>
              <li>
                <a href="/" className="nav-link" style={{ fontWeight: 600 }}>
                  English
                </a>
              </li>
              <li>
                <div className="divider-vertical"></div>
              </li>
              {auth.user ? (
                <li>
                  <Link
                    href={
                      auth.user.role === "admin"
                        ? route("admin.dashboard")
                        : route("school.dashboard")
                    }
                    className="btn btn-primary btn-sm"
                  >
                    لوحة التحكم
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link href={route("login")} className="nav-link">
                      تسجيل الدخول
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={route("subscription")}
                      className="btn btn-primary btn-sm"
                    >
                      اشترك الآن
                    </Link>
                  </li>
                </>
              )}
            </ul>

            {/* Mobile Menu Button */}
            <button
              className="hide-desktop mobile-menu-btn"
              aria-label="تبديل القائمة"
              aria-expanded="false"
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "var(--color-primary)",
              }}
              onClick={() => {
                alert("القائمة الخاصة بالجوال");
                // In React, typically state would toggle a mobile menu dropdown here
              }}
            >
              <i className="ph ph-list"></i>
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="home" className="hero">
          <div className="container hero-content">
            <h1 className="hero-title animate-fadeIn">
              ثورة في إدارة النقل المدرسي
            </h1>
            <p className="hero-subtitle animate-fadeIn">
              تتبع آمن وفعال وخالٍ من الإجهاد للمدارس الحديثة. راحة البال
              لأولياء الأمور والكفاءة التشغيلية لمديري الأساطيل.
            </p>

            <div className="hero-cta animate-fadeIn">
              {auth.user ? (
                <Link
                  href={
                    auth.user.role === "admin"
                      ? route("admin.dashboard")
                      : route("school.dashboard")
                  }
                  className="btn btn-primary btn-lg"
                >
                  لوحة التحكم
                </Link>
              ) : (
                <Link
                  href={route("subscription")}
                  className="btn btn-primary btn-lg"
                >
                  ابدأ الآن
                </Link>
              )}
              <a href="#features" className="btn btn-outline btn-lg">
                شاهد العرض التوضيحي
              </a>
            </div>

            <div className="hero-trust animate-fadeIn">
              <div className="trust-avatars">
                <div className="trust-avatar">م</div>
                <div className="trust-avatar">أ</div>
                <div className="trust-avatar">ن</div>
              </div>
              <span>موثوق من قبل أكثر من 200 مدرسة</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="section">
          <div className="container">
            <div className="features-header">
              <h2 className="features-title">مميزات مسارات واصل</h2>
              <p className="features-subtitle">
                أدوات شاملة مصممة لنقل أكثر كفاءة وتتبع في الوقت الفعلي
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="ph ph-map-pin"></i>
                </div>
                <h3 className="feature-title">التتبع الفوري</h3>
                <p className="feature-description">
                  تتبع GPS مباشر لكل مسار حافلة. يمكن لأولياء الأمور ومسؤولي
                  المدرسة تتبع عمليات الاستلام والتوصيل في الوقت الفعلي.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <i className="ph ph-brain"></i>
                </div>
                <h3 className="feature-title">
                  تحسين المسارات بالذكاء الاصطناعي
                </h3>
                <p className="feature-description">
                  خوارزميات ذكية تخطط مسارات فعالة لتقليل تكاليف الوقود ووقت
                  السفر، مع نقل الطلاب بأمان.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <i className="ph ph-chart-bar"></i>
                </div>
                <h3 className="feature-title">إدارة الحضور</h3>
                <p className="feature-description">
                  تسجيل تلقائي لحضور الطلاب. شاهد الطلاب الذين صعدوا أو فاتتهم
                  الحافلة مع تحديثات فورية.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <i className="ph ph-device-mobile"></i>
                </div>
                <h3 className="feature-title">تطبيق أولياء الأمور</h3>
                <p className="feature-description">
                  تطبيق جوال مخصص لأولياء الأمور لتتبع الحافلة، وتلقي الإشعارات،
                  ومشاهدة حالة صعود الطالب.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <i className="ph ph-steering-wheel"></i>
                </div>
                <h3 className="feature-title">لوحة تحكم السائق</h3>
                <p className="feature-description">
                  لوحة تحكم سهلة الاستخدام للسائقين لتسجيل الحضور، والتنقل في
                  المسارات، والتواصل مع إداريي المدرسة.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <i className="ph ph-wrench"></i>
                </div>
                <h3 className="feature-title">صيانة الأسطول</h3>
                <p className="feature-description">
                  تتبع تاريخ صيانة المركبات، وجداول الصيانة، واحصل على تذكيرات
                  للصيانة القادمة لضمان السلامة.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="section services">
          <div className="container">
            <div className="features-header">
              <h2 className="features-title">
                خدمات مصممة خصيصاً لكل صاحب مصلحة
              </h2>
              <p className="features-subtitle">
                وصل يربط النظام البيئي بأكمله، ويوفر قيمة محددة لكل شخص معني
                بالرحلة
              </p>
            </div>

            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon">
                  <i className="ph ph-graduation-cap"></i>
                </div>
                <h3 className="service-title">للطلاب</h3>
                <p className="service-description">
                  رحلات أكثر أماناً من وإلى المدرسة مع مسارات مراقبة وتتبع في
                  الوقت الفعلي.
                </p>
              </div>

              <div className="service-card">
                <div className="service-icon">
                  <i className="ph ph-buildings"></i>
                </div>
                <h3 className="service-title">للمدارس</h3>
                <p className="service-description">
                  كفاءة تشغيلية مع منصة رقمية بالكامل تدير الحافلات والمسارات
                  والامتثال.
                </p>
              </div>

              <div className="service-card">
                <div className="service-icon">
                  <i className="ph ph-users-three"></i>
                </div>
                <h3 className="service-title">لأولياء الأمور</h3>
                <p className="service-description">
                  راحة البال بمعرفة مكان طفلك في جميع الأوقات مع إشعارات
                  وتحديثات فورية.
                </p>
              </div>

              <div className="service-card">
                <div className="service-icon">
                  <i className="ph ph-bus"></i>
                </div>
                <h3 className="service-title">لشركات النقل</h3>
                <p className="service-description">
                  عمليات مبسطة، وتكاليف مخفضة، وعملاء راضون مع إدارة متقدمة
                  للمسارات.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing / Why Choose Section */}
        <section id="pricing" className="section why-choose">
          <div className="container">
            <div className="why-choose-content">
              <div className="why-choose-text">
                <h2>لماذا تختار سمارت باص؟</h2>
                <p>
                  نحن أكثر من مجرد تطبيق تتبع. مسارات واصل يقدم حلاً كاملاً
                  مصمماً للتعامل مع تعقيدات لوجستيات المدرسة الحديثة.
                </p>

                <ul className="benefit-list">
                  <li className="benefit-item">
                    <span className="benefit-icon">✓</span>
                    <span>كفاءة التكلفة</span>
                  </li>
                  <li className="benefit-item">
                    <span className="benefit-icon">✓</span>
                    <span>دعم على مدار الساعة</span>
                  </li>
                  <li className="benefit-item">
                    <span className="benefit-icon">✓</span>
                    <span>صديق للبيئة</span>
                  </li>
                  <li className="benefit-item">
                    <span className="benefit-icon">✓</span>
                    <span>خصوصية البيانات</span>
                  </li>
                  <li className="benefit-item">
                    <span className="benefit-icon">✓</span>
                    <span>متكامل بالكامل</span>
                  </li>
                  <li className="benefit-item">
                    <span className="benefit-icon">✓</span>
                    <span>تحديثات منتظمة</span>
                  </li>
                </ul>
              </div>

              <div className="why-choose-image">
                <img
                  src="/assets/images/bus-illustration.png"
                  alt="رسم توضيحي للحافلة المدرسية"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-section">
                <h3>مسارات واصل</h3>
                <p>
                  ثورة في كيفية إدارة المدارس للنقل اليومي بتقنية متطورة وفرق
                  دعم مخصصة للسلامة.
                </p>
              </div>

              <div className="footer-section">
                <h3>المنتج</h3>
                <ul className="footer-links">
                  <li>
                    <a href="#features">المميزات</a>
                  </li>
                  <li>
                    <a href="#services">للمدارس</a>
                  </li>
                  <li>
                    <a href="#pricing">الأسعار</a>
                  </li>
                  <li>
                    <a href="#faq">الأسئلة الشائعة</a>
                  </li>
                </ul>
              </div>

              <div className="footer-section">
                <h3>الشركة</h3>
                <ul className="footer-links">
                  <li>
                    <a href="#about">من نحن</a>
                  </li>
                  <li>
                    <a href="#careers">الوظائف</a>
                  </li>
                  <li>
                    <a href="#blog">المدونة</a>
                  </li>
                  <li>
                    <a href="#contact">اتصل بنا</a>
                  </li>
                </ul>
              </div>

              <div className="footer-section">
                <h3>اشترك في نشرتنا الإخبارية</h3>
                <p>
                  آخر الأخبار والمقالات والتحديثات التي ترسل إلى صندوق الوارد
                  الخاص بك أسبوعياً.
                </p>
                <form
                  className="footer-newsletter"
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert("شكراً لك على الاشتراك!");
                  }}
                >
                  <input
                    type="email"
                    placeholder="أدخل بريدك الإلكتروني"
                    required
                  />
                  <button type="submit">اشترك</button>
                </form>
              </div>
            </div>

            <div className="footer-bottom">
              <p>© 2024 مسارات واصل. جميع الحقوق محفوظة.</p>

              <ul className="footer-social">
                <li>
                  <a href="#" aria-label="تويتر">
                    𝕏
                  </a>
                </li>
                <li>
                  <a href="#" aria-label="فيسبوك">
                    f
                  </a>
                </li>
                <li>
                  <a href="#" aria-label="لينكد إن">
                    in
                  </a>
                </li>
                <li>
                  <a href="#" aria-label="إنستغرام">
                    📷
                  </a>
                </li>
              </ul>

              <ul className="footer-legal">
                <li>
                  <a href="#privacy">سياسة الخصوصية</a>
                </li>
                <li>
                  <a href="#terms">شروط الخدمة</a>
                </li>
                <li>
                  <a href="#cookies">إعدادات ملفات تعريف الارتباط</a>
                </li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
