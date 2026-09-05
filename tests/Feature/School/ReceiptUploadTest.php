<?php

namespace Tests\Feature\School;

use App\Models\Installment;
use App\Models\School;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesUsers;

class ReceiptUploadTest extends TestCase
{
    use CreatesSchoolData, CreatesUsers;

    public function test_school_admin_can_upload_pdf_receipt(): void
    {
        Storage::fake('public');

        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $installment = Installment::factory()->create([
            'school_id' => $school->id,
            'receipt_path' => null,
            'verification_status' => 'pending',
        ]);

        $pdfFile = UploadedFile::fake()->create('bank_transfer.pdf', 1024, 'application/pdf');

        $response = $this->actingAs($schoolAdmin)
            ->from('/school/subscriptions')
            ->post("/school/installments/{$installment->id}/receipt", [
                'receipt' => $pdfFile,
            ]);

        $response->assertRedirect('/school/subscriptions');
        $response->assertSessionHas('success');

        $installment->refresh();
        $this->assertNotNull($installment->receipt_path);
        $this->assertEquals('pending', $installment->verification_status);
        Storage::disk('public')->assertExists($installment->receipt_path);
    }

    public function test_school_admin_can_upload_image_receipt(): void
    {
        Storage::fake('public');

        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $installment = Installment::factory()->create([
            'school_id' => $school->id,
            'receipt_path' => null,
        ]);

        $imageFile = UploadedFile::fake()->image('transfer_screenshot.png');

        $response = $this->actingAs($schoolAdmin)
            ->from('/school/subscriptions')
            ->post("/school/installments/{$installment->id}/receipt", [
                'receipt' => $imageFile,
            ]);

        $response->assertRedirect('/school/subscriptions');
        $response->assertSessionHas('success');

        $installment->refresh();
        $this->assertNotNull($installment->receipt_path);
        Storage::disk('public')->assertExists($installment->receipt_path);
    }

    public function test_disallowed_file_type_is_rejected(): void
    {
        Storage::fake('public');

        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $installment = Installment::factory()->create([
            'school_id' => $school->id,
        ]);

        $txtFile = UploadedFile::fake()->create('document.txt', 50, 'text/plain');

        $response = $this->actingAs($schoolAdmin)
            ->from('/school/subscriptions')
            ->post("/school/installments/{$installment->id}/receipt", [
                'receipt' => $txtFile,
            ]);

        $response->assertSessionHasErrors('receipt');
    }
}
