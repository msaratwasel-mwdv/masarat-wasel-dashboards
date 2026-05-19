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

class SchoolUsersExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithColumnFormatting
{
    protected $isTemplate;

    public function __construct($isTemplate = false)
    {
        $this->isTemplate = $isTemplate;
    }

    public function collection()
    {
        if ($this->isTemplate) {
            return collect([[]]);
        }
        return User::whereHas('roles', fn($q) => $q->where('name', 'school_admin'))->with('schoolAdmin.school')->get();
    }

    public function headings(): array
    {
        return [
            ['ملاحظة هامة: الأعمدة الملونة باللون الأزرق إجبارية (يجب تعبئتها)، بينما الأعمدة باللون الأبيض اختيارية.'],
            [
                'الاسم الأول (عربي)',
                'اسم الأب (عربي)',
                'اسم الجد (عربي)',
                'الاسم الأخير (عربي)',
                'الاسم الأول (انجليزي)',
                'اسم الأب (انجليزي)',
                'اسم الجد (انجليزي)',
                'الاسم الأخير (انجليزي)',
                'الرقم المدني',
                'رقم الجوال',
                'البريد الإلكتروني',
                'العنوان',
                'رقم المدرسة (ID)'
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
            $row->schoolAdmin?->school_id,
        ];
    }

    public function columnFormats(): array
    {
        return [
            'I' => NumberFormat::FORMAT_TEXT,
            'J' => NumberFormat::FORMAT_TEXT,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // جعل الورقة من اليمين لليسار
        $sheet->setRightToLeft(true);

        // ارتفاع الصفوف الافتراضي ليكون أكبر
        $sheet->getDefaultRowDimension()->setRowHeight(25);

        // توسيط النص في جميع الخلايا
        $sheet->getStyle('A:M')->applyFromArray([
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER
            ]
        ]);

        // دمج خلايا الصف الأول للملاحظة
        $sheet->mergeCells('A1:M1');

        // تنسيق الصف الأول (الملاحظة)
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 12],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['argb' => 'FFDC2626']], // أحمر للتنبيه
        ]);
        $sheet->getRowDimension(1)->setRowHeight(35);

        // التنسيق الافتراضي للصف الثاني (العناوين الاختيارية باللون الأبيض)
        $sheet->getStyle('A2:M2')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['argb' => 'FF000000'], 'size' => 11],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['argb' => 'FFFFFFFF']],
            'borders' => [
                'allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['argb' => 'FFCCCCCC']],
            ],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(30);

        // تنسيق الأعمدة الإجبارية باللون الأزرق الداكن
        $mandatoryColumns = ['A2', 'D2', 'I2', 'J2', 'M2'];
        foreach ($mandatoryColumns as $col) {
            $sheet->getStyle($col)->applyFromArray([
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['argb' => 'FF0F2044']],
            ]);
        }

        return [];
    }
}
