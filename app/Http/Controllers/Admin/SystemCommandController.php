<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\Process\Process;

class SystemCommandController extends Controller
{
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
        $output = '';

        try {
            switch ($command) {
                case 'git_pull':
                    $process = new Process(['git', 'pull', 'origin', 'main']);
                    $process->setWorkingDirectory(base_path());
                    $process->run();
                    $output = "Git Pull Output:\n" . $process->getOutput() . "\n" . $process->getErrorOutput();
                    break;

                case 'composer_update':
                    $process = new Process(['composer', 'update', '--no-dev', '--optimize-autoloader']);
                    $process->setWorkingDirectory(base_path());
                    $process->setTimeout(300); // 5 minutes max
                    $process->run();
                    $output = "Composer Update Output:\n" . $process->getOutput() . "\n" . $process->getErrorOutput();
                    break;

                case 'npm_build':
                    $process = new Process(['npm', 'install', '--include=dev']);
                    $process->setWorkingDirectory(base_path());
                    $process->setTimeout(300);
                    $process->run();
                    $output = "NPM Install Output:\n" . $process->getOutput() . "\n" . $process->getErrorOutput();

                    $process2 = new Process(['npm', 'run', 'build']);
                    $process2->setWorkingDirectory(base_path());
                    $process2->setTimeout(300);
                    $process2->run();
                    $output .= "\n\nNPM Build Output:\n" . $process2->getOutput() . "\n" . $process2->getErrorOutput();
                    break;

                case 'migrate':
                    Artisan::call('migrate', ['--force' => true]);
                    $output = Artisan::output();
                    break;

                case 'migrate_fresh_seed':
                    if (app()->environment('production')) {
                        return response()->json([
                            'success' => false,
                            'message' => 'عذراً، مسح قاعدة البيانات (Fresh) غير مسموح في بيئة الانتاج (Production) حمايةً لبياناتك!'
                        ]);
                    }
                    Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true]);
                    $output = Artisan::output();
                    break;

                case 'clear_cache':
                    Artisan::call('optimize:clear');
                    $output = Artisan::output();
                    break;

                default:
                    return response()->json(['success' => false, 'message' => 'أمر غير معروف']);
            }

            return response()->json([
                'success' => true,
                'message' => 'تم تنفيذ الأمر بنجاح',
                'output'  => $output
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء التنفيذ: ' . $e->getMessage()
            ], 500);
        }
    }
}
