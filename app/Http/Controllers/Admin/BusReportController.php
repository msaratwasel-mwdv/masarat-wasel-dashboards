<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Bus;
use App\Models\BusExpense;
use Carbon\Carbon;
use Mpdf\Mpdf;
use Illuminate\Support\Facades\DB;

class BusReportController extends Controller
{
    /**
     * Get Consumption Report Data (JSON)
     */
    public function getConsumptionReport(Request $request)
    {
        $request->validate([
            'bus_id' => 'required|exists:buses,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $busId = $request->bus_id;
        $start = Carbon::parse($request->start_date)->startOfDay();
        $end = Carbon::parse($request->end_date)->endOfDay();

        // Ensure chronological order
        $startDate = $start->min($end); // "من"
        $endDate = $start->max($end);   // "إلى"

        $bus = Bus::findOrFail($busId);
        $logoPath = public_path('assets/images/masarat-wasel-logo-rtl.jpg');

        // 1. Get Bus Specific Data
        $expenses = BusExpense::where('bus_id', $busId)
            ->where('type', 'fuel')
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date', 'asc')
            ->get();

        $totalAmount = $expenses->sum('amount');
        $count = $expenses->count();

        // Calculate Distance
        $distance = 0;
        if ($count >= 2) {
            $firstOdom = (int) filter_var($expenses->first()->extra_info, FILTER_SANITIZE_NUMBER_INT);
            $lastOdom = (int) filter_var($expenses->last()->extra_info, FILTER_SANITIZE_NUMBER_INT);
            $distance = $lastOdom - $firstOdom;
        }

        $efficiency = $distance > 0 ? ($totalAmount / $distance) : 0;

        // 2. Get Fleet Benchmarks (Same Period)
        // PostgreSQL compatibility: Use INTEGER instead of UNSIGNED
        $fleetData = DB::table('bus_expenses')
            ->select('bus_id', 
                DB::raw('SUM(CAST(amount AS NUMERIC)) as total_amount'), 
                DB::raw('MIN(NULLIF(regexp_replace(extra_info, \'\D\', \'\', \'g\'), \'\')::INTEGER) as min_odom'), 
                DB::raw('MAX(NULLIF(regexp_replace(extra_info, \'\D\', \'\', \'g\'), \'\')::INTEGER) as max_odom')
            )
            ->where('type', 'fuel')
            ->whereBetween('date', [$startDate, $endDate])
            ->groupBy('bus_id')
            ->get();

        $fleetEfficiencies = [];
        foreach ($fleetData as $data) {
            $dist = $data->max_odom - $data->min_odom;
            if ($dist > 0) {
                $fleetEfficiencies[] = $data->total_amount / $dist;
            }
        }

        $fleetAvg = count($fleetEfficiencies) > 0 ? array_sum($fleetEfficiencies) / count($fleetEfficiencies) : 0;
        
        // Static Target (e.g., 1.2 SAR/km for Mercedes)
        $staticTarget = 1.2; 

        // 3. Outlier Check (>15% deviation)
        $isOutlier = false;
        if ($efficiency > ($fleetAvg * 1.15) || $efficiency > ($staticTarget * 1.15)) {
            $isOutlier = true;
        }

        return response()->json([
            'bus' => $bus,
            'stats' => [
                'total_amount' => $totalAmount,
                'distance' => $distance,
                'efficiency' => round($efficiency, 3),
                'count' => $count,
                'fleet_avg' => round($fleetAvg, 3),
                'static_target' => $staticTarget,
                'is_outlier' => $isOutlier,
                'diff_percent' => $fleetAvg > 0 ? round((($efficiency - $fleetAvg) / $fleetAvg) * 100, 1) : 0,
            ],
            'chart_data' => $expenses->map(fn($e) => [
                'date' => $e->date,
                'amount' => $e->amount,
                'odometer' => (int) filter_var($e->extra_info, FILTER_SANITIZE_NUMBER_INT),
            ])
        ]);
    }

    /**
     * Export Report to PDF
     */
    public function exportPdf(Request $request)
    {
        ini_set('memory_limit', '512M');
        
        $data = $this->getConsumptionReport($request)->getData(true);
        $data['logoPath'] = public_path('assets/images/masarat-wasel-logo-rtl.jpg');
        
        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'margin_left' => 10,
            'margin_right' => 10,
            'margin_top' => 10,
            'margin_bottom' => 10,
            'autoArabic' => true,
        ]);

        $html = view('reports.bus_consumption_pdf', $data)->render();
        
        $mpdf->WriteHTML($html);
        return $mpdf->Output('Bus_Consumption_Report.pdf', 'D');
    }

    /**
     * Export Report to Excel (CSV)
     */
    public function exportExcel(Request $request)
    {
        $data = $this->getConsumptionReport($request)->getData(true);
        $bus = $data['bus'];
        $stats = $data['stats'];

        $filename = "Bus_Consumption_" . $bus['bus_number'] . ".csv";
        $headers = [
            "Content-type"        => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use ($data, $bus, $stats) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM for UTF-8 Excel

            // Header
            fputcsv($file, ['تقرير استهلاك الوقود', 'Fuel Consumption Report']);
            fputcsv($file, ['الحافلة', $bus['bus_number'] . ' (' . $bus['plate_number'] . ')']);
            
            if (!empty($data['chart_data'])) {
                fputcsv($file, ['الفترة', $data['chart_data'][0]['date'] . ' - ' . end($data['chart_data'])['date']]);
            } else {
                fputcsv($file, ['الفترة', 'لا توجد بيانات للفترة المختارة']);
            }
            
            fputcsv($file, []);

            // Summary Stats
            fputcsv($file, ['المؤشر', 'القيمة', 'Benchmark']);
            fputcsv($file, ['إجمالي المبلغ', $stats['total_amount'] . ' SAR', '-']);
            fputcsv($file, ['المسافة المقطوعة', $stats['distance'] . ' KM', '-']);
            fputcsv($file, ['معدل الاستهلاك (SAR/KM)', $stats['efficiency'], $stats['fleet_avg'] . ' (Fleet Avg)']);
            fputcsv($file, ['الهدف (Target)', $stats['static_target'], '-']);
            fputcsv($file, ['الحالة', $stats['is_outlier'] ? 'تنبيه: استهلاك مرتفع' : 'طبيعي', '-']);
            fputcsv($file, []);

            // Detailed Logs
            fputcsv($file, ['التاريخ', 'المبلغ', 'قراءة العداد']);
            foreach ($data['chart_data'] as $row) {
                fputcsv($file, [$row['date'], $row['amount'], $row['odometer']]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
