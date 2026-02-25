<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tokens = \Illuminate\Support\Facades\Cache::get('simulator_tokens');
$user = \App\Models\User::find($tokens['parent_id']);

$guardian = \App\Models\Guardian::where('user_id', $user->id)->first();
echo "Guardian ID: " . ($guardian ? $guardian->id : 'null') . "\n";

$studentIds = $guardian->students()->pluck('students.id');
echo "Student IDs: ";
print_r($studentIds->toArray());

$busesInner = \App\Models\Bus::whereHas('students', function ($q) use ($studentIds) {
    $q->whereIn('students.id', $studentIds)
        ->where('bus_students.is_active', true);
})->get();

echo "Buses directly: ";
print_r($busesInner->pluck('id')->toArray());

$chatController = app()->make(\App\Http\Controllers\Api\ChatController::class);
$request = \Illuminate\Http\Request::create('/api/chat/contacts', 'GET');
$request->setUserResolver(function () use ($user) {
    return $user;
});

try {
    $res = $chatController->getContacts($request);
    echo "Contacts JSON: " . $res->getContent() . "\n";
} catch (\Exception $e) {
    file_put_contents('test_error.log', $e->getMessage());
}
