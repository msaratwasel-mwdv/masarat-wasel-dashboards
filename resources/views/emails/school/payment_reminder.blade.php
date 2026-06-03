<!DOCTYPE html>
<html dir="{{ $lang === 'en' ? 'ltr' : 'rtl' }}" lang="{{ $lang === 'en' ? 'en' : 'ar' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $lang === 'en' ? 'Payment Reminder' : 'تذكير بالدفع' }}</title>
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
            background-color: #0f172a;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 5px solid {{ $isOverdue ? '#ef4444' : '#f59e0b' }};
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
            color: {{ $isOverdue ? '#ef4444' : '#d97706' }};
            font-weight: bold;
        }
        .btn-container {
            text-align: center;
            margin: 35px 0;
        }
        .btn {
            display: inline-block;
            background-color: #0f172a;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .receipt-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .receipt-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px dashed #cbd5e1;
        }
        .receipt-row:last-child {
            border-bottom: none;
        }
        .receipt-label {
            font-weight: bold;
            color: #334155;
        }
        .receipt-value {
            color: #0f172a;
            font-weight: bold;
        }
        .alert-box {
            padding: 15px; 
            border-radius: 4px;
            background-color: {{ $isOverdue ? '#fef2f2' : '#f0f9ff' }}; 
            border-{{ $lang === 'en' ? 'left' : 'right' }}: 4px solid {{ $isOverdue ? '#ef4444' : '#3b82f6' }};
        }
        .alert-text {
            margin: 0; 
            font-size: 15px; 
            color: {{ $isOverdue ? '#991b1b' : '#1e3a8a' }};
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
                    <h2>{{ $isOverdue ? 'Overdue Payment Notice' : 'Upcoming Payment Reminder' }}</h2>
                    <p>Hello, {{ $installment->school->name_en ?? $installment->school->name ?? 'Valued School' }}</p>
                    
                    @if($isOverdue)
                        <p>We would like to draw your attention that a financial payment is <span class="highlight">overdue</span> past its due date. Please arrange for prompt payment to ensure uninterrupted service.</p>
                    @else
                        <p>We would like to remind you that the due date for one of the financial installments of your Masarat Wasel subscription is <span class="highlight">approaching</span>.</p>
                    @endif
                    
                    <div class="receipt-box">
                        <div class="receipt-row">
                            <span class="receipt-label">Installment Number:</span>
                            <span class="receipt-value">#{{ $installment->installment_number }}</span>
                        </div>
                        <div class="receipt-row">
                            <span class="receipt-label">Due Date:</span>
                            <span class="receipt-value" dir="ltr" style="color: {{ $isOverdue ? '#ef4444' : '#0f172a' }};">{{ \Carbon\Carbon::parse($installment->due_date)->format('Y-m-d') }}</span>
                        </div>
                        <div class="receipt-row">
                            <span class="receipt-label">Amount Required:</span>
                            <span class="receipt-value" style="color: #0f172a; font-size: 18px;">{{ number_format(max(0, $installment->amount - $installment->paid_amount), 2) }} OMR</span>
                        </div>
                    </div>

                    <div class="alert-box">
                        <p class="alert-text">
                            @if($isOverdue)
                            Please settle the outstanding balance as soon as possible to avoid any disruption of system services for your school and buses.
                            @else
                            You can log in to the dashboard to view payment details, or contact us to complete the payment easily.
                            @endif
                        </p>
                    </div>
                    
                    <div class="btn-container">
                        <a href="{{ url('/login') }}" class="btn">Login & Complete Payment</a>
                    </div>
                    
                    <p>Thank you for your cooperation.</p>
                @else
                    <h2>{{ $isOverdue ? 'إشعار بتأخر السداد' : 'تذكير باستحقاق دفعة مالية' }}</h2>
                    <p>مرحباً، {{ $installment->school->name ?? 'المدرسة الكريمة' }}</p>
                    
                    @if($isOverdue)
                        <p>نود لفت انتباهكم إلى أن هنالك دفعة مالية <span class="highlight">تأخر سدادها</span> عن موعد الاستحقاق. نرجو منكم سرعة السداد لضمان استمرار الخدمة دون توقف.</p>
                    @else
                        <p>نود تذكيركم بأنه قد <span class="highlight">اقترب موعد استحقاق</span> سداد إحدى الدفعات المالية الخاصة باشتراككم في منصة مسارات واصل.</p>
                    @endif
                    
                    <div class="receipt-box">
                        <div class="receipt-row">
                            <span class="receipt-label">رقم الدفعة / القسط:</span>
                            <span class="receipt-value">#{{ $installment->installment_number }}</span>
                        </div>
                        <div class="receipt-row">
                            <span class="receipt-label">تاريخ الاستحقاق:</span>
                            <span class="receipt-value" dir="ltr" style="color: {{ $isOverdue ? '#ef4444' : '#0f172a' }};">{{ \Carbon\Carbon::parse($installment->due_date)->format('Y-m-d') }}</span>
                        </div>
                        <div class="receipt-row">
                            <span class="receipt-label">المبلغ المطلوب:</span>
                            <span class="receipt-value" style="color: #0f172a; font-size: 18px;">{{ number_format(max(0, $installment->amount - $installment->paid_amount), 2) }} ر.ع</span>
                        </div>
                    </div>

                    <div class="alert-box">
                        <p class="alert-text">
                            @if($isOverdue)
                            يرجى تسوية المديونية في أقرب وقت لتفادي أي انقطاع في خدمات النظام عن مدرستكم وحافلاتكم.
                            @else
                            يمكنكم تسجيل الدخول إلى لوحة التحكم واستعراض تفاصيل الدفع، أو التواصل معنا لإتمام عملية السداد بكل سهولة.
                            @endif
                        </p>
                    </div>
                    
                    <div class="btn-container">
                        <a href="{{ url('/login') }}" class="btn">تسجيل الدخول وإتمام الدفع</a>
                    </div>
                    
                    <p>شاكرين لكم حسن تعاونكم.</p>
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
