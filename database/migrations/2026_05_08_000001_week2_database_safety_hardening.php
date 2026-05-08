<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Week 2 — Database Safety Hardening
     * 1. Soft Deletes for students
     * 2. Missing Indexes (3 new)
     * 3. UNIQUE constraint on trips (bus_id, type, trip_date)
     * 4. CHECK constraints (trips status, bus capacity)
     * 5. Data cleanup: normalize 'completed' → 'finished' in trips
     */
    public function up(): void
    {
        // ─── 1. SOFT DELETES FOR STUDENTS ─────────────────────────
        Schema::table('students', function (Blueprint $table) {
            $table->softDeletes();
        });

        // ─── 2. MISSING INDEXES ───────────────────────────────────

        // تحسين بحث "الطلاب المخصصين لهذا الباص الصباحي/المسائي"
        Schema::table('students', function (Blueprint $table) {
            $table->index(['forth_bus_id', 'is_active'], 'idx_students_forth_bus_active');
            $table->index(['back_bus_id', 'is_active'], 'idx_students_back_bus_active');
        });

        // تحسين بحث الباصات حسب المدرسة والحالة
        Schema::table('buses', function (Blueprint $table) {
            $table->index(['school_id', 'status'], 'idx_buses_school_status');
        });

        // ─── 3. UNIQUE CONSTRAINT ON TRIPS ────────────────────────
        // منع إنشاء رحلتين من نفس النوع لنفس الباص في نفس اليوم
        // الـ index trips_bus_date_type_idx موجود لكنه ليس UNIQUE

        // حذف الـ index القديم (غير unique) ثم إعادة إنشائه كـ UNIQUE
        Schema::table('trips', function (Blueprint $table) {
            $table->dropIndex('trips_bus_date_type_idx');
        });
        Schema::table('trips', function (Blueprint $table) {
            $table->unique(['bus_id', 'type', 'trip_date'], 'unique_bus_type_date');
        });

        // ─── 4. DATA CLEANUP قبل الـ CHECK CONSTRAINTS ────────────
        // تحويل status 'completed' → 'finished' (بيانات قديمة من الـ seeder)
        DB::table('trips')
            ->where('status', 'completed')
            ->update(['status' => 'finished']);

        // ─── 5. CHECK CONSTRAINTS ─────────────────────────────────

        // التحقق من صحة قيم status في جدول الرحلات
        DB::statement("ALTER TABLE trips ADD CONSTRAINT chk_trips_status
            CHECK (status IN ('pending', 'awaiting_confirmation', 'in_progress',
                              'awaiting_video', 'finished', 'cancelled'))");

        // التحقق من سعة الباص (موجبة ومعقولة)
        DB::statement("ALTER TABLE buses ADD CONSTRAINT chk_bus_capacity
            CHECK (capacity > 0 AND capacity <= 100)");
    }

    public function down(): void
    {
        // Remove CHECK constraints
        DB::statement("ALTER TABLE buses DROP CONSTRAINT IF EXISTS chk_bus_capacity");
        DB::statement("ALTER TABLE trips DROP CONSTRAINT IF EXISTS chk_trips_status");

        // Restore non-unique index on trips
        Schema::table('trips', function (Blueprint $table) {
            $table->dropUnique('unique_bus_type_date');
        });
        Schema::table('trips', function (Blueprint $table) {
            $table->index(['bus_id', 'trip_date', 'type'], 'trips_bus_date_type_idx');
        });

        // Remove new indexes
        Schema::table('buses', function (Blueprint $table) {
            $table->dropIndex('idx_buses_school_status');
        });
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex('idx_students_forth_bus_active');
            $table->dropIndex('idx_students_back_bus_active');
        });

        // Remove soft deletes
        Schema::table('students', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
