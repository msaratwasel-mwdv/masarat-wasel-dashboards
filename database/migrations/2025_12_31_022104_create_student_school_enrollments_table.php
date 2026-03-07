<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_school_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');

            // قمنا بإضافة هذا العمود لربط الطالب بفصل دراسي داخل هذه المدرسة
            $table->foreignId('classroom_id')->nullable()->constrained('classrooms')->onDelete('set null');

            // بيانات النقل حسب الـ ERD
            $table->float('bus_distance_from_home')->nullable();
            $table->string('assigned_absence_supervisor')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status')->default('active'); // active, transferred, graduated
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_school_enrollments');
    }
};
