<?php

namespace App\Exports;

use App\Models\Student;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class StudentsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithColumnFormatting
{
    protected $isTemplate;
    protected $schoolId;

    public function __construct($isTemplate = false) { 
        $this->isTemplate = $isTemplate; 
        $this->schoolId = Auth::user()->getSchoolId();
    }

    public function collection()
    {
        if ($this->isTemplate) return collect([[]]);
        
        return Student::inSchool($this->schoolId)
            ->with(['guardians'])
            ->get();
    }

            public function headings(): array
    {
        return [
            [__('exports.notices.students')],
            [
                __('exports.columns.student_first_name_ar'),
                __('exports.columns.student_last_name_ar'),
                __('exports.columns.student_first_name_en'),
                __('exports.columns.student_last_name_en'),
                __('exports.columns.student_national_id'),
                __('exports.columns.gender'),
                __('exports.columns.guardian_national_id'),
                __('exports.columns.guardian_name'),
                __('exports.columns.guardian_phone'),
                __('exports.columns.relationship')
            ]
        ];
    }

    public function map($row): array
    {
        if ($this->isTemplate) return [];
        
        $guardian = $row->guardians->first();
        
        return [
            $row->first_name_ar,
            $row->last_name_ar,
            $row->first_name_en,
            $row->last_name_en,
            $row->national_id ? ' ' . $row->national_id : '',
            $row->gender,
            $guardian ? (' ' . $guardian->national_id) : '',
            $guardian ? ($guardian->name ?? $guardian->first_name_ar) : '',
            $guardian ? (' ' . $guardian->phone) : '',
            $guardian && $guardian->pivot ? $guardian->pivot->relationship_type : ''
        ];
    }

    public function columnFormats(): array { 
        return [
            'E'=>NumberFormat::FORMAT_TEXT,
            'G'=>NumberFormat::FORMAT_TEXT,
            'I'=>NumberFormat::FORMAT_TEXT
        ]; 
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->setRightToLeft(app()->getLocale() === 'ar');
        $sheet->getDefaultRowDimension()->setRowHeight(25);
        $sheet->getStyle('A:J')->applyFromArray([
            'alignment'=>[
                'horizontal'=>\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical'=>\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER
            ]
        ]);
        
        $sheet->mergeCells('A1:J1');
        $sheet->getStyle('A1')->applyFromArray([
            'font'=>['bold'=>true,'color'=>['argb'=>'FFFFFFFF'],'size'=>11],
            'fill'=>['fillType'=>\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,'color'=>['argb'=>'FFDC2626']]
        ]);
        $sheet->getRowDimension(1)->setRowHeight(35);
        
        $sheet->getStyle('A2:J2')->applyFromArray([
            'font'=>['bold'=>true,'color'=>['argb'=>'FF000000'],'size'=>10],
            'fill'=>['fillType'=>\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,'color'=>['argb'=>'FFFFFFFF']],
            'borders'=>['allBorders'=>['borderStyle'=>\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,'color'=>['argb'=>'FFCCCCCC']]]
        ]);
        $sheet->getRowDimension(2)->setRowHeight(30);
        
        // Mandatory Columns: Student First Name AR (A2), Last Name AR (B2), Student ID (E2), Gender (F2), Guardian ID (G2)
        foreach (['A2','B2','E2','F2','G2'] as $c) { 
            $sheet->getStyle($c)->applyFromArray([
                'font'=>['bold'=>true,'color'=>['argb'=>'FFFFFFFF']],
                'fill'=>['fillType'=>\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,'color'=>['argb'=>'FF0F2044']]
            ]); 
        }
        
        return [];
    }
}
