<?php
$path = "app/Http/Controllers/Api/ParentController.php";
$content = file_get_contents($path);
$search = '$student->update($request->all());';
$replace = <<<'EOD'
$oldData = $student->toArray();
        $student->update($request->all());

        \App\Models\SystemEventLog::create([
            'event_type' => 'address_change',
            'entity_type' => 'Student',
            'entity_id' => $student->id,
            'user_id' => $user->id,
            'role' => 'parent',
            'before_data' => $oldData,
            'after_data' => $student->toArray(),
        ]);

        if ($student->forth_bus_id) {
            try {
                broadcast(new \App\Events\StudentLocationUpdated($student->forth_bus_id, $student->id));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Broadcast error (student location updated forth): ' . $e->getMessage());
            }
        }
        if ($student->back_bus_id && $student->back_bus_id !== $student->forth_bus_id) {
            try {
                broadcast(new \App\Events\StudentLocationUpdated($student->back_bus_id, $student->id));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Broadcast error (student location updated back): ' . $e->getMessage());
            }
        }
EOD;

$content = str_replace($search, $replace, $content);
file_put_contents($path, $content);
echo "Replaced successfully";
