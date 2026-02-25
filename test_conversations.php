<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tokens = \Illuminate\Support\Facades\Cache::get('simulator_tokens');
$user = \App\Models\User::find($tokens['parent_id']);

$chatController = app()->make(\App\Http\Controllers\Api\ChatController::class);

$request = \Illuminate\Http\Request::create('/api/chat/conversations', 'GET');
$request->setUserResolver(function () use ($user) {
    return $user;
});

try {
    $res = $chatController->getConversations($request);
    echo "Conversations JSON: " . $res->getContent() . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
