<?php
$dir = new RecursiveDirectoryIterator('c:/laragon/www/masarat-wasel-dashboards-new/app');
$iterator = new RecursiveIteratorIterator($dir);
foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() == 'php') {
        $content = file_get_contents($file->getPathname());
        if (strpos($content, "'type'") !== false && strpos($content, "parent") !== false) {
            echo "Match in: " . $file->getPathname() . "\n";
            // Check for specific pattern
            if (preg_match("/where\s*\(\s*['\"]type['\"]\s*,\s*parent\s*\)/", $content)) {
                echo "CRITICAL MATCH: " . $file->getPathname() . "\n";
            }
        }
    }
}
