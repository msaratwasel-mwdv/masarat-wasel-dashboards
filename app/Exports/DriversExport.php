<?php

namespace App\Exports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DriversExport implements FromCollection, ShouldAutoSize, WithColumnFormatting, WithHeadings, WithMapping, WithStyles
{
    protected $isTemplate;

    public function __construct($isTemplate = false)
    {
        $this->isTemplate = $isTemplate;
    }

    public function collection()
    {
        if ($this->isTemplate) {
            return collect([[]]); // Return empty row for template
        }

        return User::whereHas('roles', fn ($q) => $q->where('name', 'driver'))->with('driver')->get();
    }

    public function headings(): array
    {
        return [
            [__('exports.notices.drivers')],
            [
                __('exports.columns.first_name_ar'),
                __('exports.columns.last_name_ar'),
                __('exports.columns.first_name_en'),
                __('exports.columns.last_name_en'),
                __('exports.columns.national_id'),
                __('exports.columns.phone'),
                __('exports.columns.email'),
                __('exports.columns.address'),
                __('exports.columns.license_number'),
                __('exports.columns.license_expiry'),
            ],
        ];
    }

    public function map($row): array
    {
        if ($this->isTemplate) {
            return [];
        }

        // إرجاع مسافة قبل الرقم لضمان عدم تحويله إلى صيغة علمية في بعض نسخ الإكسيل
        return [
            $row->first_name_ar,
            $row->last_name_ar,
            $row->first_name_en,
            $row->last_name_en,
            $row->national_id ? ' '.$row->national_id : '',
            $row->phone ? ' '.$row->phone : '',
            $row->email,
            $row->address,
            $row->driver?->license_number,
            $row->driver?->license_expiry_date,
        ];
    }

    public function columnFormats(): array
    {
        return [
            'E' => NumberFormat::FORMAT_TEXT,
            'F' => NumberFormat::FORMAT_TEXT,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // جعل الورقة من اليمين لليسار
        $sheet->setRightToLeft(app()->getLocale() === 'ar');

        // ارتفاع الصفوف الافتراضي ليكون أكبر
        $sheet->getDefaultRowDimension()->setRowHeight(25);

        // توسيط النص في جميع الخلايا (حتى العمود K)
        $sheet->getStyle('A:K')->applyFromArray([
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
        ]);

        // دمج خلايا الصف الأول للملاحظة (حتى العمود K)
        $sheet->mergeCells('A1:J1');

        // تنسيق الصف الأول (الملاحظة)
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 12],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['argb' => 'FFCCCCCC']], // أحمر للتنبيه
        ]);
        $sheet->getRowDimension(1)->setRowHeight(35);

        // التنسيق الافتراضي للصف الثاني (العناوين الاختيارية باللون الأبيض)
        $sheet->getStyle('A2:K2')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['argb' => 'FF000000'], 'size' => 11],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['argb' => 'FFFFFFFF']],
            'borders' => [
                'allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['argb' => 'FFCCCCCC']],
            ],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(30);

        // تنسيق الأعمدة الإجبارية باللون الأزرق الداكن
        $mandatoryColumns = ['A2', 'B2', 'E2', 'F2', 'I2', 'J2'];
        foreach ($mandatoryColumns as $col) {
            $sheet->getStyle($col)->applyFromArray([
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['argb' => 'FF0F2044']],
            ]);
        }

        return [];
    }
}
