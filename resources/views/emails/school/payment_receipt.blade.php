<!DOCTYPE html>
<html dir="{{ $lang === 'en' ? 'ltr' : 'rtl' }}" lang="{{ $lang === 'en' ? 'en' : 'ar' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $lang === 'en' ? 'Payment Receipt' : 'سند قبض' }}</title>
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
            border-bottom: 5px solid #10b981; /* emerald-500 */
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
            color: #10b981;
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
        .balance-box {
            background-color: #fffbeb; 
            padding: 15px; 
            border-radius: 4px;
            border-{{ $lang === 'en' ? 'left' : 'right' }}: 4px solid #f59e0b;
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
                    <h2>Payment Receipt Notice</h2>
                    <p>Hello, {{ $school->name_en ?? $school->name }}</p>
                    <p>Thank you for your trust and commitment. We would like to inform you that the financial payment has been <span class="highlight">successfully received and confirmed</span>. Below are the payment details:</p>
                    
                    <div class="receipt-box">
                        <div class="receipt-row">
                            <span class="receipt-label">Transaction No:</span>
                            <span class="receipt-value">#{{ $transaction->id }}</span>
                        </div>
                        <div class="receipt-row">
                            <span class="receipt-label">Date:</span>
                            <span class="receipt-value" dir="ltr">{{ \Carbon\Carbon::parse($transaction->paid_at)->format('Y-m-d H:i') }}</span>
                        </div>
                        <div class="receipt-row">
                            <span class="receipt-label">Payment Method:</span>
                            <span class="receipt-value">{{ $transaction->payment_method }}</span>
                        </div>
                        <div class="receipt-row">
                            <span class="receipt-label">Amount Paid:</span>
                            <span class="receipt-value" style="color: #10b981; font-size: 18px;">{{ number_format($transaction->amount, 2) }} OMR</span>
                        </div>
                    </div>

                    <div class="balance-box">
                        <h3 style="margin-top: 0; color: #b45309; font-size: 16px;">Remaining Balance (Total Due):</h3>
                        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #b45309;">{{ number_format($remainingBalance, 2) }} OMR</p>
                    </div>
                    
                    <div class="btn-container">
                        <a href="{{ url('/login') }}" class="btn">View Invoices in Dashboard</a>
                    </div>
                    
                    <p>If you have any questions regarding this notice, please do not hesitate to contact us.</p>
                @else
                    <h2>إشعار استلام دفعة مالية</h2>
                    <p>مرحباً، {{ $school->name }}</p>
                    <p>نشكركم لثقتكم والتزامكم. نود إبلاغكم بأنه قد تم <span class="highlight">استلام وتأكيد</span> الدفعة المالية بنجاح. أدناه تجدون تفاصيل السداد:</p>
                    
                    <div class="receipt-box">
                        <div class="receipt-row">
                            <span class="receipt-label">رقم المعاملة:</span>
                            <span class="receipt-value">#{{ $transaction->id }}</span>
                        </div>
                        <div class="receipt-row">
                            <span class="receipt-label">تاريخ الدفع:</span>
                            <span class="receipt-value" dir="ltr">{{ \Carbon\Carbon::parse($transaction->paid_at)->format('Y-m-d H:i') }}</span>
                        </div>
                        <div class="receipt-row">
                            <span class="receipt-label">طريقة الدفع:</span>
                            <span class="receipt-value">{{ $transaction->payment_method }}</span>
                        </div>
                        <div class="receipt-row">
                            <span class="receipt-label">المبلغ المدفوع:</span>
                            <span class="receipt-value" style="color: #10b981; font-size: 18px;">{{ number_format($transaction->amount, 2) }} ر.ع</span>
                        </div>
                    </div>

                    <div class="balance-box">
                        <h3 style="margin-top: 0; color: #b45309; font-size: 16px;">الرصيد المتبقي (إجمالي المديونية):</h3>
                        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #b45309;">{{ number_format($remainingBalance, 2) }} ر.ع</p>
                    </div>
                    
                    <div class="btn-container">
                        <a href="{{ url('/login') }}" class="btn">عرض الفواتير في لوحة التحكم</a>
                    </div>
                    
                    <p>إذا كان لديكم أي استفسارات بخصوص هذا الإشعار، لا تترددوا في التواصل معنا.</p>
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
