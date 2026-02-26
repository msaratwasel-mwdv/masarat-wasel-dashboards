<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$student = App\Models\Student::whereNotNull('guardian_id')->where(function ($q) {
    $q->whereHas('morningGroup.bus', function ($qInner) {
        $qInner->whereNotNull('driver_id');
    })->orWhereHas('afternoonGroup.bus', function ($qInner) {
        $qInner->whereNotNull('driver_id');
    });
})->first();

if (!$student) {
    $student = App\Models\Student::whereNotNull('guardian_id')
        ->whereHas('buses', function ($q) {
            $q->whereNotNull('driver_id')->wherePivot('is_active', true);
        })->first();
}

if (!$student) exit("NO_STUDENT_FOUND\n");

$parent = $student->guardian;
$bus = null;
if ($student->morningGroup && $student->morningGroup->bus) $bus = $student->morningGroup->bus;
else if ($student->afternoonGroup && $student->afternoonGroup->bus) $bus = $student->afternoonGroup->bus;
else $bus = $student->buses->first();
$driver = current(array_filter([$bus->driver]));

$token = $parent->createToken('test-parent-session')->plainTextToken;
$httpKernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$request = Illuminate\Http\Request::create('/api/chat/conversations', 'POST', [
    'receiver_id' => $driver->id
]);
$request->headers->set('Authorization', 'Bearer ' . $token);
$request->headers->set('Accept', 'application/json');

$response = $httpKernel->handle($request);
$data = json_decode($response->getContent(), true);
$conversationId = $data['data']['conversation']['id'] ?? $data['data']['id'] ?? null;
$httpKernel->terminate($request, $response);

if ($conversationId) {
    $request2 = Illuminate\Http\Request::create('/api/chat/conversations/' . $conversationId . '/messages', 'POST', [
        'body' => 'رسالة اختبار ' . time()
    ]);
    $request2->headers->set('Authorization', 'Bearer ' . $token);
    $request2->headers->set('Accept', 'application/json');
    $response2 = $httpKernel->handle($request2);
    $httpKernel->terminate($request2, $response2);

    $request3 = Illuminate\Http\Request::create('/api/chat/conversations/' . $conversationId . '/messages', 'GET');
    $request3->headers->set('Authorization', 'Bearer ' . $token);
    $request3->headers->set('Accept', 'application/json');
    $response3 = $httpKernel->handle($request3);
    $decoded3 = json_decode($response3->getContent(), true);

    echo "SUCCESS_FETCHED_MESSAGES:\n";
    if (isset($decoded3['data']) && is_array($decoded3['data'])) {
        foreach ($decoded3['data'] as $msg) {
            echo "-> " . ($msg['body'] ?? 'No body') . "\n";
        }
    } else {
        echo "No messages.\n";
    }
    $httpKernel->terminate($request3, $response3);
} else {
    echo "FAILED_TO_START_CONVERSATION\n";
}
