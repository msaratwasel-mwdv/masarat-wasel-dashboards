<?php

namespace Database\Seeders;

use App\Models\Bus;
use App\Models\Message;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Models\DriverProfile;
use App\Models\SupervisorProfile;
use App\Models\Conversation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ChatDemoSeeder extends Seeder
{
    public function run(): void
    {
        // ╔══════════════════════════════════════════════════════╗
        // ║  السيناريو المتقدم:                                  ║
        // ║  أب واحد (أبو أحمد) لديه 4 أبناء:                   ║
        // ║  مدرسة١: أحمد + فاطمة → نفس الباص (باص A)           ║
        // ║  مدرسة٢: محمد → باص B                                ║
        // ║  مدرسة٢: سارة → باص C                                ║
        // ╚══════════════════════════════════════════════════════╝

        // ═══════════════════════════════════════════════════════
        //  1. إنشاء مدرستين
        // ═══════════════════════════════════════════════════════
        $school1 = School::firstOrCreate(
            ['name' => 'مدرسة الأمل النموذجية'],
            ['status' => 'Active']
        );

        $school2 = School::firstOrCreate(
            ['name' => 'مدرسة النور الأهلية'],
            ['status' => 'Active']
        );

        // ═══════════════════════════════════════════════════════
        //  2. إنشاء ولي الأمر (الأب)
        // ═══════════════════════════════════════════════════════
        $parentUser = User::firstOrCreate(
            ['email' => 't_parent@demo.com'],
            [
                'name'      => 'أبو أحمد (ولي أمر)',
                'phone'     => '0500000001',
                'password'  => Hash::make('password'),
                'role'      => 'parent',
                'is_active' => true,
                'school_id' => $school1->id,
            ]
        );
        $parentUser->tokens()->where('name', 'simulator')->delete();
        $parentToken = $parentUser->createToken('simulator')->plainTextToken;

        // ═══════════════════════════════════════════════════════
        //  3. إنشاء سائقين ومشرفات (3 باصات = 3 سائقين + 3 مشرفات)
        // ═══════════════════════════════════════════════════════

        // ── باص A (مدرسة١): سائق خالد + مشرفة نورة ──
        $driverA = $this->createUser('t_driverA@demo.com', 'الكابتن خالد', '0510000001', 'driver', $school1);
        $driverAToken = $this->refreshToken($driverA);
        DriverProfile::firstOrCreate(
            ['user_id' => $driverA->id],
            ['license_number' => 'L-A00001', 'license_expiry_date' => now()->addYear()]
        );

        $superA = $this->createUser('t_superA@demo.com', 'أ. نورة (مشرفة)', '0510000002', 'supervisor', $school1);
        $superAToken = $this->refreshToken($superA);
        SupervisorProfile::firstOrCreate(
            ['user_id' => $superA->id],
            ['emergency_contact_phone' => '0510000099']
        );

        // ── باص B (مدرسة٢): سائق سعد + مشرفة هند ──
        $driverB = $this->createUser('t_driverB@demo.com', 'الكابتن سعد', '0520000001', 'driver', $school2);
        $driverBToken = $this->refreshToken($driverB);
        DriverProfile::firstOrCreate(
            ['user_id' => $driverB->id],
            ['license_number' => 'L-B00001', 'license_expiry_date' => now()->addYear()]
        );

        $superB = $this->createUser('t_superB@demo.com', 'أ. هند (مشرفة)', '0520000002', 'supervisor', $school2);
        $superBToken = $this->refreshToken($superB);
        SupervisorProfile::firstOrCreate(
            ['user_id' => $superB->id],
            ['emergency_contact_phone' => '0520000099']
        );

        // ── باص C (مدرسة٢): سائق فيصل + مشرفة ريم ──
        $driverC = $this->createUser('t_driverC@demo.com', 'الكابتن فيصل', '0530000001', 'driver', $school2);
        $driverCToken = $this->refreshToken($driverC);
        DriverProfile::firstOrCreate(
            ['user_id' => $driverC->id],
            ['license_number' => 'L-C00001', 'license_expiry_date' => now()->addYear()]
        );

        $superC = $this->createUser('t_superC@demo.com', 'أ. ريم (مشرفة)', '0530000002', 'supervisor', $school2);
        $superCToken = $this->refreshToken($superC);
        SupervisorProfile::firstOrCreate(
            ['user_id' => $superC->id],
            ['emergency_contact_phone' => '0530000099']
        );

        // ═══════════════════════════════════════════════════════
        //  4. إنشاء 4 طلاب (أبناء أبو أحمد)
        // ═══════════════════════════════════════════════════════
        $studentAhmed = Student::firstOrCreate(
            ['student_code' => 'STU-DEMO-001'],
            ['full_name' => 'أحمد', 'guardian_id' => $parentUser->id, 'school_id' => $school1->id, 'is_active' => true]
        );
        $studentFatima = Student::firstOrCreate(
            ['student_code' => 'STU-DEMO-002'],
            ['full_name' => 'فاطمة', 'guardian_id' => $parentUser->id, 'school_id' => $school1->id, 'is_active' => true]
        );
        $studentMohammed = Student::firstOrCreate(
            ['student_code' => 'STU-DEMO-003'],
            ['full_name' => 'محمد', 'guardian_id' => $parentUser->id, 'school_id' => $school2->id, 'is_active' => true]
        );
        $studentSara = Student::firstOrCreate(
            ['student_code' => 'STU-DEMO-004'],
            ['full_name' => 'سارة', 'guardian_id' => $parentUser->id, 'school_id' => $school2->id, 'is_active' => true]
        );

        // ═══════════════════════════════════════════════════════
        //  5. إنشاء 3 باصات وربط الطلاب
        // ═══════════════════════════════════════════════════════

        // باص A → مدرسة١ → أحمد + فاطمة (نفس الباص)
        $busA = Bus::firstOrCreate(
            ['bus_code' => 'BUS-A'],
            [
                'plate_number' => 'أ ب ت 1111',
                'capacity' => 30,
                'model' => 'Toyota Coaster',
                'year' => 2024,
                'school_id' => $school1->id,
                'driver_id' => $driverA->id,
                'supervisor_id' => $superA->id,
                'status' => 'active',
            ]
        );
        $this->attachStudent($busA, $studentAhmed);
        $this->attachStudent($busA, $studentFatima);

        // باص B → مدرسة٢ → محمد
        $busB = Bus::firstOrCreate(
            ['bus_code' => 'BUS-B'],
            [
                'plate_number' => 'أ ب ت 2222',
                'capacity' => 30,
                'model' => 'Hyundai County',
                'year' => 2023,
                'school_id' => $school2->id,
                'driver_id' => $driverB->id,
                'supervisor_id' => $superB->id,
                'status' => 'active',
            ]
        );
        $this->attachStudent($busB, $studentMohammed);

        // باص C → مدرسة٢ → سارة
        $busC = Bus::firstOrCreate(
            ['bus_code' => 'BUS-C'],
            [
                'plate_number' => 'أ ب ت 3333',
                'capacity' => 25,
                'model' => 'Mitsubishi Rosa',
                'year' => 2025,
                'school_id' => $school2->id,
                'driver_id' => $driverC->id,
                'supervisor_id' => $superC->id,
                'status' => 'active',
            ]
        );
        $this->attachStudent($busC, $studentSara);

        // ═══════════════════════════════════════════════════════
        //  6. إنشاء محادثات ورسائل تجريبية
        // ═══════════════════════════════════════════════════════

        // ولي الأمر ↔ سائق باص A (خالد) - بخصوص أحمد وفاطمة
        $this->seedConversation($parentUser, $driverA, $school1, [
            [$parentUser->id, 'السلام عليكم كابتن خالد، ابني أحمد وبنتي فاطمة سيتأخرون ٥ دقائق اليوم.', 3],
            [$driverA->id, 'وعليكم السلام أبو أحمد، لا مشكلة سأنتظرهم.', 2],
            [$parentUser->id, 'جزاك الله خير.', 1],
        ]);

        // ولي الأمر ↔ مشرفة باص A (نورة)
        $this->seedConversation($parentUser, $superA, $school1, [
            [$parentUser->id, 'أ. نورة السلام عليكم، هل وصل أحمد وفاطمة للمدرسة؟', 2],
            [$superA->id, 'وعليكم السلام، نعم وصلوا بسلامة الحمدلله.', 1],
        ]);

        // ولي الأمر ↔ سائق باص B (سعد) - بخصوص محمد
        $this->seedConversation($parentUser, $driverB, $school2, [
            [$parentUser->id, 'كابتن سعد، ابني محمد لن يحضر غداً.', 2],
            [$driverB->id, 'تمام أبو أحمد، سلامته.', 1],
        ]);

        // ولي الأمر ↔ مشرفة باص C (ريم) - بخصوص سارة
        $this->seedConversation($parentUser, $superC, $school2, [
            [$superC->id, 'السلام عليكم، بنتك سارة نسيت شنطتها في الباص وسأوصلها للمدرسة.', 2],
            [$parentUser->id, 'جزاك الله خير أ. ريم، شكراً لك.', 1],
        ]);

        // ═══════════════════════════════════════════════════════
        //  7. طباعة التوكنات وتخزينها في الكاش
        // ═══════════════════════════════════════════════════════
        echo "\n╔══════════════════════════════════════════════════╗\n";
        echo "║        🔑 Demo Tokens (Bearer)                    ║\n";
        echo "╠══════════════════════════════════════════════════╣\n";
        echo "║  ولي الأمر (أبو أحمد):                            ║\n";
        echo "║  {$parentToken}\n";
        echo "╠══════════════════════════════════════════════════╣\n";
        echo "║  سائق باص A (خالد):                               ║\n";
        echo "║  {$driverAToken}\n";
        echo "║  مشرفة باص A (نورة):                              ║\n";
        echo "║  {$superAToken}\n";
        echo "╠══════════════════════════════════════════════════╣\n";
        echo "║  سائق باص B (سعد):                                ║\n";
        echo "║  {$driverBToken}\n";
        echo "║  مشرفة باص B (هند):                               ║\n";
        echo "║  {$superBToken}\n";
        echo "╠══════════════════════════════════════════════════╣\n";
        echo "║  سائق باص C (فيصل):                               ║\n";
        echo "║  {$driverCToken}\n";
        echo "║  مشرفة باص C (ريم):                               ║\n";
        echo "║  {$superCToken}\n";
        echo "╚══════════════════════════════════════════════════╝\n\n";

        // تخزين في الكاش (لصفحة المحاكي)
        cache()->put('simulator_tokens', [
            'parent'        => $parentToken,
            'driver'        => $driverAToken,     // الافتراضي = سائق باص A
            'supervisor'    => $superAToken,       // الافتراضي = مشرفة باص A
            'parent_id'     => $parentUser->id,
            'driver_id'     => $driverA->id,
            'super_id'      => $superA->id,

            // التوكنات الإضافية
            'driverA'       => $driverAToken,
            'driverB'       => $driverBToken,
            'driverC'       => $driverCToken,
            'superA'        => $superAToken,
            'superB'        => $superBToken,
            'superC'        => $superCToken,
        ], now()->addHours(24));

        echo "✅ تم إنشاء السيناريو المتقدم بنجاح!\n";
        echo "   → أب واحد + 4 طلاب + مدرستين + 3 باصات\n";
        echo "   → 4 محادثات تجريبية مع رسائل\n\n";
    }

    // ═══════════════════════════════════════════════════════════
    //  Helper Methods
    // ═══════════════════════════════════════════════════════════

    private function createUser(string $email, string $name, string $phone, string $role, School $school): User
    {
        return User::firstOrCreate(
            ['email' => $email],
            [
                'name'      => $name,
                'phone'     => $phone,
                'password'  => Hash::make('password'),
                'role'      => $role,
                'is_active' => true,
                'school_id' => $school->id,
            ]
        );
    }

    private function refreshToken(User $user): string
    {
        $user->tokens()->where('name', 'simulator')->delete();
        return $user->createToken('simulator')->plainTextToken;
    }

    private function attachStudent(Bus $bus, Student $student): void
    {
        if (!$bus->students()->where('student_id', $student->id)->exists()) {
            $bus->students()->attach($student->id, ['is_active' => true]);
        }
    }

    private function seedConversation(User $sender, User $receiver, School $school, array $messages): void
    {
        $conv = Conversation::findBetween($sender->id, $receiver->id);
        if (!$conv) {
            $conv = Conversation::create([
                'school_id' => $school->id,
                'type'      => 'private',
            ]);
            $conv->participants()->attach([
                $sender->id   => ['role' => $sender->role],
                $receiver->id => ['role' => $receiver->role],
            ]);

            foreach ($messages as [$userId, $body, $hoursAgo]) {
                Message::create([
                    'conversation_id' => $conv->id,
                    'sender_id'       => $userId,
                    'body'            => $body,
                    'created_at'      => now()->subHours($hoursAgo),
                ]);
            }
        }
    }
}
