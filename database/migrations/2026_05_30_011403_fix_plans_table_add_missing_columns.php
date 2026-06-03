<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            // Pricing fields (the real column is 'price', we add 'price_per_student' as alias)
            if (!Schema::hasColumn('plans', 'price_per_student')) {
                if (Schema::hasColumn('plans', 'price')) {
                    $table->decimal('price_per_student', 10, 2)->default(0)->after('price');
                } else {
                    $table->decimal('price_per_student', 10, 2)->default(0);
                }
            }
            if (!Schema::hasColumn('plans', 'currency')) {
                if (Schema::hasColumn('plans', 'price_per_student')) {
                    $table->string('currency', 10)->default('OMR')->after('price_per_student');
                } else {
                    $table->string('currency', 10)->default('OMR');
                }
            }
            if (!Schema::hasColumn('plans', 'max_buses')) {
                $table->integer('max_buses')->nullable()->after('currency');
            }
            if (!Schema::hasColumn('plans', 'has_driver_app')) {
                $table->boolean('has_driver_app')->default(true)->after('max_buses');
            }
            if (!Schema::hasColumn('plans', 'has_parent_app')) {
                $table->boolean('has_parent_app')->default(true)->after('has_driver_app');
            }
            if (!Schema::hasColumn('plans', 'has_supervisor_app')) {
                $table->boolean('has_supervisor_app')->default(false)->after('has_parent_app');
            }
            if (!Schema::hasColumn('plans', 'notifications_limit')) {
                $table->string('notifications_limit')->nullable()->after('has_supervisor_app');
            }
            if (!Schema::hasColumn('plans', 'has_reports')) {
                $table->boolean('has_reports')->default(true)->after('notifications_limit');
            }
            if (!Schema::hasColumn('plans', 'has_api_access')) {
                $table->boolean('has_api_access')->default(false)->after('has_reports');
            }
            if (!Schema::hasColumn('plans', 'has_dedicated_support')) {
                $table->boolean('has_dedicated_support')->default(false)->after('has_api_access');
            }
            if (!Schema::hasColumn('plans', 'badge')) {
                $table->string('badge')->nullable()->after('has_dedicated_support');
            }
        });

        // Sync price_per_student from existing price column if it exists
        if (Schema::hasColumn('plans', 'price')) {
            DB::statement('UPDATE plans SET price_per_student = price WHERE price_per_student = 0 AND price > 0');
        }
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn([
                'price_per_student', 'currency', 'max_buses',
                'has_driver_app', 'has_parent_app', 'has_supervisor_app',
                'notifications_limit', 'has_reports', 'has_api_access',
                'has_dedicated_support', 'badge',
            ]);
        });
    }
};
