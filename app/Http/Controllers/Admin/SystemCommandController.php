<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class SystemCommandController extends Controller
{
    /**
     * الأوامر المسموح بها فقط — أي أمر آخر سيُرفض تلقائياً
     *
     * ❌ تم حذف 'composer_update'  — خطر: يمكن سحب malicious packages
     * ❌ تم حذف 'migrate_fresh_seed' — خطر: يمسح قاعدة البيانات بالكامل!
     */
    private array $allowedCommands = [
        'git_pull',
        'npm_build',
        'migrate',
        'clear_cache',
    ];

    /**
     * تنفيذ الأوامر بطريقة آمنة
     */
    public function execute(Request $request)
    {
        // التحقق من الصلاحيات (يجب أن يكون Admin)
        if ($request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $command = $request->input('command');

        // ✅ التحقق من أن الأمر موجود في قائمة المسموح بها
        if (!in_array($command, $this->allowedCommands)) {
            Log::warning('[SystemCommand] Rejected unauthorized command attempt', [
                'command'  => $command,
                'user_id'  => $request->user()->id,
                'ip'       => $request->ip(),
            ]);
            return response()->json(['success' => false, 'message' => 'أمر غير مصرح به'], 403);
        }

        // ✅ Audit Log: تسجيل كل أمر يُنفّذ
        Log::info('[SystemCommand] Executing command', [
            'command'  => $command,
            'user_id'  => $request->user()->id,
            'user_name' => $request->user()->name,
            'ip'       => $request->ip(),
            'at'       => now()->toDateTimeString(),
        ]);

        $output = '';

        try {
            switch ($command) {
                case 'git_pull':
                    $process = new Process(['git', 'pull', 'origin', 'main']);
                    $process->setWorkingDirectory(base_path());
                    $process->run();
                    $output = "Git Pull Output:\n" . $process->getOutput() . "\n" . $process->getErrorOutput();
                    break;

                // ❌ 'composer_update' محذوف — استخدم CI/CD Pipeline بدلاً منه

                case 'npm_build':
                    $process = new Process(['npm', 'run', 'build']);
                    $process->setWorkingDirectory(base_path());
                    $process->setTimeout(300);
                    $process->run();
                    $output = "NPM Build Output:\n" . $process->getOutput() . "\n" . $process->getErrorOutput();
                    break;

                case 'migrate':
                    // ✅ migrate فقط (بدون fresh) — آمن
                    Artisan::call('migrate', ['--force' => true]);
                    $output = Artisan::output();
                    break;

                // ❌ 'migrate_fresh_seed' محذوف — يمسح قاعدة البيانات بالكامل!

                case 'clear_cache':
                    Artisan::call('optimize:clear');
                    $output = Artisan::output();
                    break;

                default:
                    return response()->json(['success' => false, 'message' => 'أمر غير معروف']);
            }

            Log::info('[SystemCommand] Command completed successfully', [
                'command' => $command,
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تنفيذ الأمر بنجاح',
                'output'  => $output
            ]);
        } catch (\Exception $e) {
            Log::error('[SystemCommand] Command failed', [
                'command' => $command,
                'error'   => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء التنفيذ: ' . $e->getMessage()
            ], 500);
        }
    }
}
