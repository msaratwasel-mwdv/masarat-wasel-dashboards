<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$users = App\Models\User::where('role','parent')->get(['id','name','national_id','email','phone']);
foreach ($users as $u) {
    echo "ID: {$u->id} | Name: {$u->name} | National ID: {$u->national_id} | Email: {$u->email} | Phone: {$u->phone}\n";
}
