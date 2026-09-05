<?php

namespace Tests\Feature\Admin;

use App\Models\Plan;
use App\Models\School;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class SchoolManagementTest extends TestCase
{
    use CreatesUsers;

    public function test_admin_can_view_schools_index(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create(['name' => 'مدارس الأندلس الأهلية']);

        $response = $this->actingAs($admin)->get('/admin/schools');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_new_school_without_admin(): void
    {
        $admin = $this->createAdmin();
        Plan::factory()->create();

        $response = $this->actingAs($admin)->post('/admin/schools', [
            'name' => 'مدارس النخبة النموذجية',
            'address' => 'الرياض - حي النخيل',
            'latitude' => 24.7136,
            'longitude' => 46.6753,
            'status' => 'Active',
            'create_admin' => false,
        ]);

        $response->assertRedirect(route('admin.schools.index'));
        $this->assertDatabaseHas('schools', [
            'name' => 'مدارس النخبة النموذجية',
            'status' => 'Active',
        ]);
    }

    public function test_admin_can_create_new_school_with_school_admin_user(): void
    {
        $admin = $this->createAdmin();
        Plan::factory()->create();

        $response = $this->actingAs($admin)->post('/admin/schools', [
            'name' => 'مدارس المستقبل الذكية',
            'status' => 'Active',
            'create_admin' => true,
            'admin_name' => 'سالم عبد العزيز القاسم',
            'admin_email' => 'salem.admin@masarat.test',
            'admin_phone' => '966509988776',
            'admin_national_id' => '1088776655',
            'admin_password' => 'Password123',
            'admin_password_confirmation' => 'Password123',
        ]);

        $response->assertRedirect(route('admin.schools.index'));

        $this->assertDatabaseHas('schools', ['name' => 'مدارس المستقبل الذكية']);
        $this->assertDatabaseHas('users', ['email' => 'salem.admin@masarat.test', 'national_id' => '1088776655']);
        $this->assertDatabaseHas('school_admins', []);
    }

    public function test_admin_can_toggle_school_status(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create(['status' => 'Active']);

        $response = $this->actingAs($admin)->post("/admin/schools/{$school->id}/toggle");

        $response->assertRedirect();
        $school->refresh();
        $this->assertEquals('Inactive', $school->status);
    }

    public function test_schools_index_includes_accurate_enrollments_and_buses_count(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create(['name' => 'مدرسة التجارب']);
        $grade = \App\Models\Grade::factory()->create(['school_id' => $school->id]);
        $classroom = \App\Models\Classroom::factory()->create(['grade_id' => $grade->id]);
        $student1 = \App\Models\Student::factory()->create();
        $student2 = \App\Models\Student::factory()->create();

        \App\Models\StudentSchoolEnrollment::create([
            'student_id' => $student1->id,
            'classroom_id' => $classroom->id,
            'academic_year' => '2025-2026',
            'is_active' => true,
        ]);
        \App\Models\StudentSchoolEnrollment::create([
            'student_id' => $student2->id,
            'classroom_id' => $classroom->id,
            'academic_year' => '2025-2026',
            'is_active' => true,
        ]);
        \App\Models\Bus::factory()->count(2)->create(['school_id' => $school->id]);

        $response = $this->actingAs($admin)->get('/admin/schools');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Schools/Index')
            ->has('schools')
            ->where('schools.0.id', $school->id)
            ->where('schools.0.enrollments_count', 2)
            ->where('schools.0.buses_count', 2)
            ->etc()
        );
    }
}
