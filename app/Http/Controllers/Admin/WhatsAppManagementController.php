<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\WhatsAppLog;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppManagementController extends Controller
{
    public function __construct(protected WhatsAppService $whatsAppService) {}

    /**
     * Display WhatsApp control center, stats, switches, and logs.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $template = $request->query('template');

        // 1. WhatsApp Service Switches
        $masterSwitch = $this->whatsAppService->isServiceEnabled();
        $rawTemplates = $this->whatsAppService->getAvailableTemplates();

        $templates = collect($rawTemplates)->map(function ($tpl) {
            $tpl['is_enabled'] = (bool) SystemSetting::get("whatsapp_template_{$tpl['name']}_enabled", $tpl['default_enabled']);
            $tpl['total_sent'] = WhatsAppLog::where('template_name', $tpl['name'])->whereIn('status', ['sent', 'delivered', 'read'])->count();
            $tpl['total_failed'] = WhatsAppLog::where('template_name', $tpl['name'])->where('status', 'failed')->count();

            return $tpl;
        })->toArray();

        // 2. Overview Stats
        $totalMessages = WhatsAppLog::count();
        $deliveredCount = WhatsAppLog::whereIn('status', ['delivered', 'read'])->count();
        $sentCount = WhatsAppLog::where('status', 'sent')->count();
        $failedCount = WhatsAppLog::where('status', 'failed')->count();
        $todayCount = WhatsAppLog::whereDate('created_at', today())->count();

        $successRate = $totalMessages > 0
            ? round((($deliveredCount + $sentCount) / $totalMessages) * 100, 1)
            : 100;

        $stats = [
            'total' => $totalMessages,
            'delivered' => $deliveredCount,
            'sent' => $sentCount,
            'failed' => $failedCount,
            'today' => $todayCount,
            'success_rate' => $successRate,
            'master_switch' => $masterSwitch,
        ];

        // 3. Filtered Logs Query
        $logsQuery = WhatsAppLog::with('user:id,first_name_ar,last_name_ar,phone')
            ->latest('id');

        if ($search) {
            $logsQuery->where(function ($q) use ($search) {
                $q->where('recipient_phone', 'like', "%{$search}%")
                    ->orWhere('recipient_name', 'like', "%{$search}%")
                    ->orWhere('wamid', 'like', "%{$search}%");
            });
        }

        if ($status && $status !== 'all') {
            $logsQuery->where('status', $status);
        }

        if ($template && $template !== 'all') {
            $logsQuery->where('template_name', $template);
        }

        $logs = $logsQuery->paginate(15)->withQueryString();

        return Inertia::render('Admin/WhatsApp/Index', [
            'stats' => $stats,
            'templates' => $templates,
            'logs' => $logs,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
                'template' => $template ?? 'all',
            ],
            'metaConfigured' => ! empty(config('services.meta_whatsapp.token')) && ! empty(config('services.meta_whatsapp.phone_number_id')),
            'accountInfo' => [
                'verified_name' => 'wasel_company',
                'display_phone_number' => '+968 7736 5677',
                'phone_number_id' => config('services.meta_whatsapp.phone_number_id') ?? '1267555953116394',
                'waba_id' => env('META_WABA_ID', '3466768820164365'),
                'status' => 'VERIFIED',
                'quality_rating' => 'HIGH',
            ],
        ]);
    }

    /**
     * Toggle the master WhatsApp kill switch.
     */
    public function toggleMasterSwitch(Request $request)
    {
        $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $newState = (bool) $request->enabled;
        SystemSetting::set('whatsapp_master_switch', $newState, 'whatsapp', 'boolean', 'المفتاح الرئيسي لإرسال رسائل الواتساب');

        $statusText = $newState ? 'تم تفعيل خدمة رسائل الواتساب بنجاح' : 'تم إيقاف خدمة رسائل الواتساب بالكامل';

        return back()->with('success', $statusText);
    }

    /**
     * Toggle a specific template switch.
     */
    public function toggleTemplateSwitch(Request $request)
    {
        $request->validate([
            'template_name' => 'required|string',
            'enabled' => 'required|boolean',
        ]);

        $templateName = $request->template_name;
        $newState = (bool) $request->enabled;

        SystemSetting::set("whatsapp_template_{$templateName}_enabled", $newState, 'whatsapp', 'boolean', "مفتاح تفعيل قالب {$templateName}");

        $statusText = $newState ? "تم تفعيل القالب ({$templateName})" : "تم إيقاف القالب ({$templateName})";

        return back()->with('success', $statusText);
    }

    /**
     * Send a direct test template message from admin panel.
     */
    public function sendTestMessage(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|min:8|max:20',
            'template_name' => 'required|string',
            'parameters' => 'nullable|array',
            'header_image_url' => 'nullable|url',
        ]);

        $phone = $request->phone;
        $templateName = $request->template_name;

        // تجهيز المتغيرات الافتراضية المناسبة لكل نوع قالب
        if ($templateName === 'bus_trip_summary' || $templateName === 'bus_trip_report') {
            $params = $request->parameters ?? [
                'المدرسة العصرية الحديثة',
                date('Y/m/d'),
                'B-202',
                '07:00 ص',
                '08:15 ص',
                '00:15 دقيقة',
                '01:15 ساعة',
                '25 كم',
                '24',
                '2',
                'B-202',
            ];
            $headerUrl = $request->header_image_url ?? url('assets/images/bus_trip_report.png');
        } elseif ($templateName === 'masarat_welcome') {
            $params = $request->parameters ?? [$phone];
            $headerUrl = null;
        } else {
            // student_bus_status
            $params = $request->parameters ?? [
                'فضل المطري',
                'أحمد فضل',
                'صعد الحافلة ✅',
                'نجيب الصلوان',
                'فاطمة علي',
                '775376507',
                'المدرسة العصرية الحديثة',
            ];
            $headerUrl = $request->header_image_url ?? url('assets/images/student_bus_status.png');
        }

        $sent = $this->whatsAppService->sendTemplate(
            to: $phone,
            templateName: $templateName,
            parameters: $params,
            lang: 'ar',
            headerImageUrl: $headerUrl,
            eventType: 'manual_admin_test',
            userId: auth()->id()
        );

        if ($sent) {
            return back()->with('success', "تم إرسال رسالة الاختبار بنجاح إلى الرقم {$phone}");
        }

        return back()->with('error', "فشل إرسال رسالة الاختبار إلى الرقم {$phone}. يرجى مراجعة السجلات والتأكد من إعدادات Meta.");
    }

    /**
     * Retry sending a failed message log.
     */
    public function retryMessage(Request $request, WhatsAppLog $log)
    {
        $params = is_array($log->parameters) ? $log->parameters : (json_decode($log->parameters, true) ?? []);

        $sent = $this->whatsAppService->sendTemplate(
            to: $log->recipient_phone,
            templateName: $log->template_name,
            parameters: $params,
            lang: 'ar',
            headerImageUrl: $log->header_image_url,
            eventType: $log->event_type ?? 'retry_failed_message',
            userId: $log->user_id
        );

        if ($sent) {
            return back()->with('success', "تمت إعادة إرسال الرسالة بنجاح إلى {$log->recipient_phone}");
        }

        return back()->with('error', "فشلت محاولة إعادة الإرسال إلى {$log->recipient_phone}. تفقد السجلات لمزيد من التفاصيل.");
    }
}
