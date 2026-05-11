<?php

namespace App\Services\WhatsApp;

use Illuminate\Support\Arr;

class VariableMapper
{
    /**
     * Resolve a list of variable values for a template.
     */
    public function resolve(array $variableDefinitions, array $context): array
    {
        $resolvedValues = [];

        foreach ($variableDefinitions as $definition) {
            $value = $this->resolvePath($definition['source_attribute'], $context);
            
            $resolvedValues[] = [
                'type' => 'text',
                'text' => $value ?? $definition['fallback_value'] ?? '',
            ];
        }

        return $resolvedValues;
    }

    /**
     * Resolve a single dot-notation path from the context.
     * Context is an array of objects/arrays indexed by their "role" or model name.
     */
    public function resolvePath(string $path, array $context): mixed
    {
        // Path format: "model_key.relation.attribute"
        // e.g., "student.forthBus.driver.user.name"
        
        return data_get($context, $path);
    }
}
