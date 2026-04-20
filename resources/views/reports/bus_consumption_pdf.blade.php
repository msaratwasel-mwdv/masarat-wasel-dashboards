<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <style>
        @page {
            header: page-header;
            footer: page-footer;
            margin-top: 40mm;
        }
        body {
            font-family: 'DejaVu Sans', 'sans-serif';
            font-size: 13px;
            color: #1e293b;
            line-height: 1.5;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        
        /* Official Header */
        .header-table {
            width: 100%;
            border-bottom: 3px solid #fbbf24;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .company-name {
            font-size: 22px;
            font-weight: bold;
            color: #0f172a;
        }
        .report-title {
            font-size: 18px;
            font-weight: bold;
            color: #64748b;
            margin-top: 5px;
        }
        
        /* Stats Grid */
        .stats-table {
            width: 100%;
            margin: 20px 0;
            border-spacing: 10px;
        }
        .stat-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 12px;
        }
        .stat-label {
            font-size: 10px;
            color: #64748b;
            font-weight: bold;
            text-transform: uppercase;
        }
        .stat-value {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
        }
        
        /* Info Section */
        .info-grid {
            width: 100%;
            background: #f1f5f9;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .info-label { font-weight: bold; color: #475569; width: 100px; }
        
        /* Table */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .data-table th {
            background: #1e293b;
            color: #ffffff;
            padding: 10px;
            font-size: 11px;
            border: 1px solid #1e293b;
        }
        .data-table td {
            padding: 8px;
            border: 1px solid #e2e8f0;
            font-size: 11px;
            text-align: center;
        }
        .bg-gray { background-color: #f8fafc; }
        
        /* Alert */
        .alert-card {
            border-right: 5px solid #ef4444;
            background: #fef2f2;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        /* Signatures */
        .signatures {
            margin-top: 50px;
            width: 100%;
        }
        .sig-box {
            text-align: center;
            padding-top: 40px;
        }
        .sig-line {
            border-top: 1px solid #94a3b8;
            margin: 0 20px;
            padding-top: 5px;
            font-weight: bold;
        }

        .logo {
            max-height: 80px;
        }
    </style>
</head>
<body>

    <htmlpageheader name="page-header">
        <table class="header-table">
            <tr>
                <td width="30%">
                    <img src="{{ $logoPath }}" class="logo">
                </td>
                <td width="40%" class="text-center">
                    <div class="company-name">مسارات واصل النقل والخدمات</div>
                    <div class="report-title">تقرير كفاءة استهلاك الوقود</div>
                </td>
                <td width="30%" class="text-right">
                    <div style="font-size: 11px; color: #64748b;">
                        تاريخ الإصدار: {{ date('Y-m-d H:i') }}<br>
                        الرقم المرجعي: REP-{{ date('ymd') }}-{{ $bus['id'] }}
                    </div>
                </td>
            </tr>
        </table>
    </htmlpageheader>

    <div class="info-grid">
        <table width="100%">
            <tr>
                <td width="50%">
                    <table>
                        <tr><td class="info-label">الحافلة:</td><td>{{ $bus['bus_number'] }}</td></tr>
                        <tr><td class="info-label">رقم اللوحة:</td><td>{{ $bus['plate_number'] }}</td></tr>
                        <tr><td class="info-label">الطراز:</td><td>{{ $bus['model'] }} / {{ $bus['year'] ?? 'N/A' }}</td></tr>
                    </table>
                </td>
                <td width="50%">
                    <table>
                        <tr><td class="info-label">فترة التقرير:</td>
                            <td>
                                @if(!empty($chart_data))
                                    {{ $chart_data[0]['date'] }} - {{ end($chart_data)['date'] }}
                                @else
                                    لا توجد بيانات
                                @endif
                            </td>
                        </tr>
                        <tr><td class="info-label">عدد السجلات:</td><td>{{ $stats['count'] }} إدخال</td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    @if($stats['is_outlier'])
    <div class="alert-card">
        <strong style="color: #ef4444;">🚨 تنبيه تجاوز الحد المسموح:</strong><br>
        هذه الحافلة تستهلك وقوداً بمعدل مرتفع ({{ $stats['efficiency'] }} SAR/KM) وهو ما يتجاوز متوسط الأسطول بنسبة <strong>{{ $stats['diff_percent'] }}%</strong>. يوصى بفحص المحرك أو مراجعة أسلوب القيادة.
    </div>
    @endif

    <table class="stats-table">
        <tr>
            <td width="25%">
                <div class="stat-box text-center">
                    <div class="stat-label">المسافة الفعلية</div>
                    <div class="stat-value">{{ number_format($stats['distance']) }} <small>KM</small></div>
                </div>
            </td>
            <td width="25%">
                <div class="stat-box text-center">
                    <div class="stat-label">إجمالي التكلفة</div>
                    <div class="stat-value">{{ number_format($stats['total_amount'], 2) }} <small>SAR</small></div>
                </div>
            </td>
            <td width="25%">
                <div class="stat-box text-center" style="background: {{ $stats['is_outlier'] ? '#fef2f2' : '#f0fdf4' }}">
                    <div class="stat-label">معدل الاستهلاك</div>
                    <div class="stat-value" style="color: {{ $stats['is_outlier'] ? '#ef4444' : '#22c55e' }}">{{ $stats['efficiency'] }}</div>
                </div>
            </td>
            <td width="25%">
                <div class="stat-box text-center">
                    <div class="stat-label">متوسط الأسطول</div>
                    <div class="stat-value">{{ $stats['fleet_avg'] }}</div>
                </div>
            </td>
        </tr>
    </table>

    <div style="margin-top: 30px; font-weight: bold; border-right: 4px solid #fbbf24; padding-right: 10px;">
        السجل التفصيلي للعمليات:
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th width="20%">التاريخ</th>
                <th width="20%">قراءة العداد (KM)</th>
                <th width="20%">المبلغ (ريال)</th>
                <th width="20%">المسافة المقطوعة</th>
                <th width="20%">التكلفة / كم</th>
            </tr>
        </thead>
        <tbody>
            @forelse($chart_data as $index => $row)
            <tr class="{{ $index % 2 == 0 ? '' : 'bg-gray' }}">
                <td>{{ $row['date'] }}</td>
                <td>{{ number_format($row['odometer']) }}</td>
                <td>{{ number_format($row['amount'], 2) }}</td>
                <td>
                    @if($index > 0)
                        {{ number_format($row['odometer'] - $chart_data[$index-1]['odometer']) }}
                    @else
                        -
                    @endif
                </td>
                <td style="font-weight: bold;">
                    @if($index > 0)
                        @php $d = $row['odometer'] - $chart_data[$index-1]['odometer']; @endphp
                        {{ $d > 0 ? round($row['amount'] / $d, 2) : '0.00' }}
                    @else
                        -
                    @endif
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="text-center" style="padding: 30px; color: #94a3b8;">لا توجد سجلات وقود متوفرة لهذه الفترة.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <table class="signatures">
        <tr>
            <td width="33%" class="sig-box">
                مدير الأسطول
                <div class="sig-line">التوقيع</div>
            </td>
            <td width="33%" class="sig-box">
                المسؤول اللوجستي
                <div class="sig-line">التوقيع</div>
            </td>
            <td width="33%" class="sig-box">
                المحاسبة
                <div class="sig-line">التوقيع</div>
            </td>
        </tr>
    </table>

    <htmlpagefooter name="page-footer">
        <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8;" class="text-center">
            صفحة {PAGENO} من {nbpg} | حافلة رقم: {{ $bus['bus_number'] }} | نظام مسارات واصل &copy; {{ date('Y') }}
        </div>
    </htmlpagefooter>

</body>
</html>
