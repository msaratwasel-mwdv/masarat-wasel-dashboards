<?php

namespace App\Listeners;

use App\Jobs\SendWhatsAppMessage;
use App\Models\WhatsAppAccount;
use App\Models\WhatsAppEventBinding;
use App\Services\WhatsApp\VariableMapper;
use Illuminate\Events\Dispatcher;
use Illuminate\Support\Facades\Log;

class WhatsAppEventSubscriber
{
    public function __construct(
        protected VariableMapper $mapper
    ) {}

    /**
     * Handle the event.
     */
    public function handleEvent($event): void
    {
        $eventName = get_class($event);
        
        $bindings = WhatsAppEventBinding::where('event_name', $eventName)
            ->where('is_active', true)
            ->with(['template.variables', 'template.account'])
            ->get();

        if ($bindings->isEmpty()) {
            return;
        }

        // Context for variable mapping
        $context = $this->resolveContext($event);
        
        $account = WhatsAppAccount::where('status', 'active')->first();
        if (!$account) {
            Log::warning('[WhatsApp] No active WhatsApp account found for event: ' . $eventName);
            return;
        }

        foreach ($bindings as $binding) {
            $recipients = $this->resolveRecipients($binding->recipient_resolver, $event);

            foreach ($recipients as $recipient) {
                $user = $recipient['user'] ?? null;
                
                // Check consent
                if ($user && !$user->whatsapp_consent) {
                    continue;
                }

                // Resolve template by language
                $language = $user->preferred_language ?? 'ar';
                $template = $binding->template;

                // If user language is different from bound template language, try to find a match
                if ($template->language !== $language) {
                    $matchingTemplate = \App\Models\WhatsAppTemplate::where('name', $template->name)
                        ->where('language', $language)
                        ->where('status', 'APPROVED')
                        ->first();
                    
                    if ($matchingTemplate) {
                        $template = $matchingTemplate;
                    }
                }

                $variables = $this->mapper->resolve(
                    $template->variables->toArray(),
                    $context
                );

                SendWhatsAppMessage::dispatch(
                    $account,
                    $recipient['phone'],
                    $template,
                    $variables,
                    $user->id ?? null
                )->onQueue('whatsapp');
            }
        }
    }

    /**
     * Build context for VariableMapper.
     */
    protected function resolveContext($event): array
    {
        $context = ['event' => $event];

        // Automatically extract models if they are public properties of the event
        $reflection = new \ReflectionClass($event);
        foreach ($reflection->getProperties(\ReflectionProperty::IS_PUBLIC) as $property) {
            $name = $property->getName();
            $value = $event->{$name};
            $context[$name] = $value;
        }

        // Special handling for common models if not named clearly
        if (isset($event->student) && $event->student instanceof \App\Models\Student) {
            $context['student'] = $event->student;
        }
        
        if (isset($event->bus) && $event->bus instanceof \App\Models\Bus) {
            $context['bus'] = $event->bus;
        }

        return $context;
    }

    /**
     * Resolve recipients based on binding configuration.
     */
    protected function resolveRecipients(string $resolver, $event): array
    {
        if (method_exists($this, $resolver)) {
            return $this->{$resolver}($event);
        }

        return [];
    }

    // --- Recipient Resolvers ---

    protected function resolveStudentGuardians($event): array
    {
        $student = $event->student ?? null;
        if (!$student) return [];

        $recipients = [];
        foreach ($student->guardians as $guardian) {
            if ($guardian->phone) {
                $recipients[] = [
                    'phone' => $guardian->phone,
                    'user' => $guardian,
                ];
            }
        }

        return $recipients;
    }

    protected function resolveBusDriver($event): array
    {
        $bus = $event->bus ?? null;
        if (!$bus || !$bus->driver?->user) return [];

        return [[
            'phone' => $bus->driver->user->phone,
            'user' => $bus->driver->user,
        ]];
    }

    /**
     * Register the listeners for the subscriber.
     */
    public function subscribe(Dispatcher $events): void
    {
        // Get all unique event names from bindings to subscribe dynamically
        // Note: For production, you might want to cache this list
        try {
            $eventNames = WhatsAppEventBinding::where('is_active', true)
                ->pluck('event_name')
                ->unique()
                ->toArray();

            foreach ($eventNames as $eventName) {
                $events->listen($eventName, [self::class, 'handleEvent']);
            }
        } catch (\Exception $e) {
            // Table might not exist yet during migration
            Log::error('[WhatsApp] Subscription error: ' . $e->getMessage());
        }
    }
}
