<?php
$path = "app/Http/Controllers/Api/ParentController.php";
$content = file_get_contents($path);
$search = '$student->update($request->all());';
$replace = <<<'EOD'
$student->update($request->all());

        // Notify driver
        $busId = $student->forth_bus_id ?? $student->back_bus_id;
        if ($busId) {
            $bus = \App\Models\Bus::find($busId);
            if ($bus && $bus->driver) {
                $notificationService = app(\App\Services\NotificationService::class);
                $notificationService->sendToUser(
                    $bus->driver->user,
                    '?? ????? ???? ??????',
                    "??? ??? ????? ?????? ???? ?????? {$student->full_name}",
                    ['type' => 'address_change', 'student_id' => $student->id]
                );
            }
        }
EOD;

$content = str_replace($search, $replace, $content);
file_put_contents($path, $content);
echo "Replaced successfully";
