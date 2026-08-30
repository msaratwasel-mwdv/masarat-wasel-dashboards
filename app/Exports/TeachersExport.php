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

class TeachersExport implements FromCollection, ShouldAutoSize, WithColumnFormatting, WithHeadings, WithMapping, WithStyles
{
    protected $isTemplate;

    protected $schoolId;

    public function __construct($isTemplate = false, $schoolId = null)
    {
        $this->isTemplate = $isTemplate;
        $this->schoolId = $schoolId;
    }

    public function collection()
    {
        if ($this->isTemplate) {
            return collect([[]]);
        }

        return User::whereHas('roles', fn ($q) => $q->where('name', 'teacher'))
            ->when($this->schoolId, function ($query) {
                $query->whereHas('teacher', fn ($q) => $q->where('school_id', $this->schoolId));
            })
            ->with('teacher')
            ->get();
    }

    public function headings(): array
    {
        return [
            [__('exports.notices.teachers')],
            [
                __('exports.columns.first_name_ar'),
                __('exports.columns.last_name_ar'),
                __('exports.columns.first_name_en'),
                __('exports.columns.last_name_en'),
                __('exports.columns.national_id'),
                __('exports.columns.phone'),
                __('exports.columns.email'),
                __('exports.columns.address'),
                __('exports.columns.preferred_language'),
            ],
        ];
    }

    public function map($row): array
    {
        if ($this->isTemplate) {
            return [];
        }

        return [$row->first_name_ar, $row->last_name_ar, $row->first_name_en, $row->last_name_en,
            $row->national_id ? ' '.$row->national_id : '', $row->phone ? ' '.$row->phone : '',
            $row->email, $row->address, $row->preferred_language ?? 'ar'];
    }

    public function columnFormats(): array
    {
        return ['E' => NumberFormat::FORMAT_TEXT, 'F' => NumberFormat::FORMAT_TEXT];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->setRightToLeft(app()->getLocale() === 'ar');
        $sheet->getDefaultRowDimension()->setRowHeight(25);
        $sheet->getStyle('A:I')->applyFromArray(['alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER]]);
        $sheet->mergeCells('A1:I1');
        $sheet->getStyle('A1')->applyFromArray(['font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 12], 'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['argb' => 'FFDC2626']]]);
        $sheet->getRowDimension(1)->setRowHeight(35);
        $sheet->getStyle('A2:I2')->applyFromArray(['font' => ['bold' => true, 'color' => ['argb' => 'FF000000'], 'size' => 11], 'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['argb' => 'FFFFFFFF']], 'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['argb' => 'FFCCCCCC']]]]);
        $sheet->getRowDimension(2)->setRowHeight(30);
        foreach (['E2', 'F2'] as $c) {
            $sheet->getStyle($c)->applyFromArray(['font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']], 'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['argb' => 'FF0F2044']]]);
        }

        return [];
    }
}
