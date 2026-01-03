<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // أضف فقط الحقول التي تأكدت أنها غير موجودة
            if (!Schema::hasColumn('students', 'gender')) {
                $table->enum('gender', ['male', 'female'])->nullable()->after('national_id');
            }
            
            if (!Schema::hasColumn('students', 'image')) {
                $table->string('image')->nullable()->after('gender');
            }
            
            if (!Schema::hasColumn('students', 'school_id')) {
                $table->foreignId('school_id')->nullable()->after('supervisor_id')->constrained();
            }
            
            // لا تضيف guardian_id و supervisor_id إذا كانت موجودة بالفعل
            // national_id موجودة بالفعل كما يظهر من الخطأ
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['gender', 'image', 'school_id']);
        });
    }
};