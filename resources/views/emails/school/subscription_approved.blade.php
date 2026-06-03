<!DOCTYPE html>
<html dir="{{ $lang === 'en' ? 'ltr' : 'rtl' }}" lang="{{ $lang === 'en' ? 'en' : 'ar' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $lang === 'en' ? 'Subscription Request Approved' : 'موافقة طلب الاشتراك' }}</title>
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
            text-align: {{ $lang === 'en' ? 'left' : 'right' }};
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
        .info-box {
            background-color: #f8fafc; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 4px;
            border-{{ $lang === 'en' ? 'left' : 'right' }}: 4px solid;
        }
        .info-box.yellow { border-color: #fbbf24; }
        .info-box.navy { border-color: #0f172a; }
        .info-list {
            list-style-type: none; 
            padding-{{ $lang === 'en' ? 'left' : 'right' }}: 0; 
            margin-bottom: 0;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>{{ $lang === 'en' ? 'Masarat Wasel' : 'مسارات واصل' }}</h1>
            </div>
            
            <div class="content">
                @if($lang === 'en')
                    <h2>Welcome to the world of Masarat Wasel Excellence!</h2>
                    <p>We are very pleased to inform you that the subscription request for your esteemed school (<strong>{{ $school->name_en ?? $school->name }}</strong>) has been <span class="highlight">officially approved</span>.</p>
                    
                    <p>We are proud to have you join us and are ready to provide the best school transport management technologies to ensure the safety of students and facilitate daily operations.</p>

                    <div class="info-box yellow">
                        <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">Login Details:</h3>
                        <ul class="info-list">
                            <li><strong>Username:</strong> {{ $school->contact_email }}</li>
                            <li><strong>Password:</strong> The password you created during registration.</li>
                        </ul>
                    </div>

                    <div class="info-box navy">
                        <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">Approved Subscription Details:</h3>
                        <ul class="info-list">
                            <li><strong>Plan:</strong> {{ $subscription->plan->name_en ?? $subscription->plan->name ?? 'Selected Plan' }}</li>
                            <li><strong>Total Amount:</strong> {{ number_format($subscription->final_price, 2) }} OMR</li>
                            <li><strong>Approved Installments:</strong> {{ $subscription->installments()->count() }} Installments</li>
                        </ul>
                    </div>
                    
                    <div class="btn-container">
                        <a href="{{ url('/login') }}" class="btn">Login to Dashboard</a>
                    </div>
                    
                    <p>Once you log in, we recommend setting up students, buses, and drivers data to fully activate the system. You can also view installment details and due dates from the dashboard.</p>
                    <p>If you have any questions, our support team is always available to serve you.</p>
                @else
                    <h2>مرحباً بك في عالم مسارات واصل للتميز!</h2>
                    <p>يسعدنا جداً إبلاغك بأنه قد تمت <span class="highlight">الموافقة رسمياً</span> على طلب اشتراك مدرستكم الموقرة (<strong>{{ $school->name }}</strong>).</p>
                    
                    <p>نحن فخورون بانضمامكم إلينا، ومستعدون لتقديم أفضل تقنيات إدارة النقل المدرسي لمؤسستكم لضمان أمن وسلامة أبنائنا الطلاب وتسهيل العمليات اليومية.</p>

                    <div class="info-box yellow">
                        <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">تفاصيل تسجيل الدخول:</h3>
                        <ul class="info-list">
                            <li><strong>اسم المستخدم:</strong> {{ $school->contact_email }}</li>
                            <li><strong>كلمة المرور:</strong> هي كلمة المرور التي قمت بإنشائها أثناء طلب التسجيل.</li>
                        </ul>
                    </div>

                    <div class="info-box navy">
                        <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">تفاصيل الاشتراك المعتمد:</h3>
                        <ul class="info-list">
                            <li><strong>الباقة:</strong> {{ $subscription->plan->name ?? 'الباقة المختارة' }}</li>
                            <li><strong>إجمالي المبلغ:</strong> {{ number_format($subscription->final_price, 2) }} ر.ع</li>
                            <li><strong>عدد الأقساط المعتمدة:</strong> {{ $subscription->installments()->count() }} أقساط</li>
                        </ul>
                    </div>
                    
                    <div class="btn-container">
                        <a href="{{ url('/login') }}" class="btn">تسجيل الدخول للوحة التحكم</a>
                    </div>
                    
                    <p>بمجرد دخولك، ننصحك بالبدء في إعداد بيانات الطلاب، الحافلات، والسائقين لتفعيل المنظومة بشكل كامل. يمكنك أيضاً الاطلاع على تفاصيل الأقساط ومواعيد استحقاقها من خلال لوحة التحكم.</p>
                    <p>إذا كان لديك أي استفسار، فريق الدعم لدينا متواجد دائماً لخدمتك.</p>
                @endif
            </div>
            
            <div class="footer">
                @if($lang === 'en')
                    &copy; {{ date('Y') }} Masarat Wasel. All rights reserved.<br>
                    This is an automated message, please do not reply.
                @else
                    &copy; {{ date('Y') }} مسارات واصل. جميع الحقوق محفوظة.<br>
                    هذه رسالة آلية، يرجى عدم الرد عليها.
                @endif
            </div>
        </div>
    </div>
</body>
</html>
