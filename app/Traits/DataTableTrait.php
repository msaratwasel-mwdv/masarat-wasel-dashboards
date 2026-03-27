<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Trait DataTableTrait
 *
 * يوفر وظائف موحدة للبحث والترتيب والتصفح في الجداول الإدارية.
 * يُستخدم مع مكون BaseDataTable في الواجهة الأمامية.
 *
 * Usage:
 *   $this->applyDataTable($query, $request, ['name', 'email', 'school.name']);
 */
trait DataTableTrait
{
    /**
     * Apply search, sort, and pagination to a query.
     *
     * @param Builder $query          The Eloquent query builder
     * @param Request $request        The incoming request (search, sort, direction, per_page)
     * @param array   $searchColumns  Columns to search in. Support dot notation for relations (e.g. 'school.name')
     * @param int     $defaultPerPage Default items per page
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    protected function applyDataTable(
        Builder $query,
        Request $request,
        array $searchColumns = [],
        int $defaultPerPage = 15,
        ?\Closure $exportCallback = null
    ) {
        // 1. Search
        $search = $request->input('search');
        if ($search && count($searchColumns) > 0) {
            $query->where(function (Builder $q) use ($search, $searchColumns) {
                foreach ($searchColumns as $i => $column) {
                    $method = $i === 0 ? 'where' : 'orWhere';

                    // Support relation columns: 'school.name' → whereHas('school', ...)
                    if (str_contains($column, '.')) {
                        [$relation, $field] = explode('.', $column, 2);
                        $q->{$i === 0 ? 'whereHas' : 'orWhereHas'}($relation, function ($rq) use ($field, $search) {
                            $rq->where($field, 'like', "%{$search}%");
                        });
                    } else {
                        $q->{$method}($column, 'like', "%{$search}%");
                    }
                }
            });
        }

        // 2. Sort
        $sortColumn = $request->input('sort');
        $sortDirection = $request->input('direction', 'desc');
        if ($sortColumn && in_array($sortDirection, ['asc', 'desc'])) {
            $query->orderBy($sortColumn, $sortDirection);
        } else {
            $query->latest();
        }

        // 3. Export interception
        if ($request->has('export')) {
            $format = $request->get('export');
            return $this->handleExport($query, $format, $exportCallback);
        }

        // 4. Paginate
        $perPage = min((int) $request->input('per_page', $defaultPerPage), 100);

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Handles exporting the query results to CSV or PDF.
     */
    protected function handleExport(Builder $query, string $format, ?\Closure $exportCallback = null)
    {
        // Don't fetch millions of rows, cap it to 5000 to prevent memory exhaustion
        $data = $query->take(5000)->get();
        if ($exportCallback) {
            $data = $data->map($exportCallback);
        } else {
            // Default mapping: just toArray without relations if it's too complex
            $data = $data->map(function ($item) {
                return collect($item->toArray())->filter(function ($value) {
                    return !is_array($value) && !is_object($value);
                })->toArray();
            });
        }

        if ($data->isEmpty()) {
            return redirect()->back()->with('error', 'لا توجد بيانات لتصديرها (No data to export)');
        }

        $headers = array_keys($data->first());
        $filename = 'export_' . date('Y_m_d_His');

        if ($format === 'csv' || $format === 'excel') {
            $headersResp = [
                "Content-type"        => "text/csv; charset=UTF-8",
                "Content-Disposition" => "attachment; filename={$filename}.csv",
                "Pragma"              => "no-cache",
                "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
                "Expires"             => "0"
            ];

            $callback = function () use ($data, $headers) {
                $file = fopen('php://output', 'w');
                // UTF-8 BOM for Excel to read Arabic correctly
                fputs($file, "\xEF\xBB\xBF");
                fputcsv($file, $headers);
                foreach ($data as $row) {
                    fputcsv($file, (array) $row);
                }
                fclose($file);
            };

            return response()->stream($callback, 200, $headersResp);
        }

        if ($format === 'pdf') {
            // We use simple HTML table for PDF
            $html = '<html dir="rtl"><head><meta charset="utf-8">';
            $html .= '<style>
                body { font-family: "dejavu sans", sans-serif; font-size: 13px; color: #1e293b; direction: rtl; } 
                h2 { text-align: center; color: #1e293b; margin-bottom: 20px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; } 
                th { background-color: #f1f5f9; color: #475569; padding: 12px; text-align: right; font-size: 11px; font-weight: bold; border-bottom: 2px solid #e2e8f0; }
                td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #334155; text-align: right; }
                tr:nth-child(even) { background-color: #fafbfc; }
            </style>';
            $html .= '</head><body>';
            $html .= '<h2>تصدير البيانات - ' . date('Y-m-d') . '</h2>';
            $html .= '<table><thead><tr>';
            foreach ($headers as $header) {
                $html .= '<th>' . htmlspecialchars($header) . '</th>';
            }
            $html .= '</tr></thead><tbody>';
            foreach ($data as $row) {
                $html .= '<tr>';
                foreach ((array) $row as $value) {
                    $html .= '<td>' . htmlspecialchars((string) $value) . '</td>';
                }
                $html .= '</tr>';
            }
            $html .= '</tbody></table></body></html>';

            $pdf = \Mccarlosen\LaravelMpdf\Facades\LaravelMpdf::loadHTML($html);
            return $pdf->download("{$filename}.pdf");
        }

        return redirect()->back();
    }
}
