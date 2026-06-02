<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>موافقة طلب الاشتراك</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            color: #334155;
            line-height: 1.6;
        }
        .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
        }
        .header {
            background-color: #0f172a; /* brand-navy */
            padding: 30px 20px;
            text-align: center;
            border-bottom: 5px solid #fbbf24; /* brand-yellow */
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
            text-align: right;
        }
        .content h2 {
            color: #0f172a;
            font-size: 20px;
            margin-top: 0;
        }
        .content p {
            font-size: 16px;
            color: #475569;
            margin-bottom: 20px;
        }
        .highlight {
            color: #d97706;
            font-weight: bold;
        }
        .btn-container {
            text-align: center;
            margin: 35px 0;
        }
        .btn {
            display: inline-block;
            background-color: #fbbf24; /* brand-yellow */
            color: #0f172a;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 6px -1px rgba(251, 191, 36, 0.4);
        }
        .footer {
            background-color: #f1f5f9;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>مسارات واصل</h1>
            </div>
            
            <div class="content">
                <h2>مرحباً بك في عالم مسارات واصل للتميز!</h2>
                <p>يسعدنا جداً إبلاغك بأنه قد تمت <span class="highlight">الموافقة رسمياً</span> على طلب اشتراك مدرستكم الموقرة (<strong>{{ $school->name }}</strong>).</p>
                
                <p>نحن فخورون بانضمامكم إلينا، ومستعدون لتقديم أفضل تقنيات إدارة النقل المدرسي لمؤسستكم لضمان أمن وسلامة أبنائنا الطلاب وتسهيل العمليات اليومية.</p>

                <p>يمكنك الآن تسجيل الدخول إلى لوحة تحكم الإدارة الخاصة بمدرستك باستخدام البريد الإلكتروني وكلمة المرور التي قمت بإعدادها أثناء طلب الاشتراك.</p>
                
                <div class="btn-container">
                    <a href="{{ url('/login') }}" class="btn">تسجيل الدخول للوحة التحكم</a>
                </div>
                
                <p>بمجرد دخولك، ننصحك بالبدء في إعداد بيانات الطلاب، الحافلات، والسائقين لتفعيل المنظومة بشكل كامل.</p>
                <p>إذا كان لديك أي استفسار، فريق الدعم لدينا متواجد دائماً لخدمتك.</p>
            </div>
            
            <div class="footer">
                &copy; {{ date('Y') }} مسارات واصل. جميع الحقوق محفوظة.<br>
                هذه رسالة آلية، يرجى عدم الرد عليها.
            </div>
        </div>
    </div>
</body>
</html>
