<?php

namespace App\Exports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class AssistantsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithColumnFormatting
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
        return User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))->with('assistant')->get();
    }

            public function headings(): array
    {
        return [
            [__('exports.notices.assistants')],
            [
                __('exports.columns.first_name_ar'),
                __('exports.columns.last_name_ar'),
                __('exports.columns.first_name_en'),
                __('exports.columns.last_name_en'),
                __('exports.columns.national_id'),
                __('exports.columns.phone'),
                __('exports.columns.email'),
                __('exports.columns.address'),
                __('exports.columns.emergency_contact_name'),
                __('exports.columns.emergency_contact_phone'),
                __('exports.columns.preferred_language')
            ]
        ];
    }

    public function map($row): array
    {
        if ($this->isTemplate) {
            return [];
        }

        return [
            $row->first_name_ar,
            $row->last_name_ar,
            $row->first_name_en,
            $row->last_name_en,
            $row->national_id ? ' ' . $row->national_id : '',
            $row->phone ? ' ' . $row->phone : '',
            $row->email,
            $row->address,
            $row->assistant?->emergency_contact_name,
            $row->assistant?->emergency_contact_phone ? ' ' . $row->assistant?->emergency_contact_phone : '',
            $row->preferred_language ?? 'ar',
        ];
    }

    public function columnFormats(): array
    {
        return [
            'E' => NumberFormat::FORMAT_TEXT,
            'F' => NumberFormat::FORMAT_TEXT,
            'J' => NumberFormat::FORMAT_TEXT,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // جعل الورقة من اليمين لليسار
        $sheet->setRightToLeft(app()->getLocale() === 'ar');

        // ارتفاع الصفوف الافتراضي ليكون أكبر
        $sheet->getDefaultRowDimension()->setRowHeight(25);

        // توسيط النص في جميع الخلايا
        $sheet->getStyle('A:K')->applyFromArray([
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER
            ]
        ]);

        // دمج خلايا الصف الأول للملاحظة
        $sheet->mergeCells('A1:K1');

        // تنسيق الصف الأول (الملاحظة)
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 12],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['argb' => 'FFDC2626']], // أحمر للتنبيه
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
        // E (National ID), F (Phone), I (Emergency Name), J (Emergency Phone)
        $mandatoryColumns = ['E2', 'F2', 'I2', 'J2'];
        foreach ($mandatoryColumns as $col) {
            $sheet->getStyle($col)->applyFromArray([
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['argb' => 'FF0F2044']],
            ]);
        }

        return [];
    }
}
