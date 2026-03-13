<?php
$zip = new ZipArchive;
$file = 'c:\laragon\www\masarat-wasel-dashboards-new\مواصفات تطبيق مسارات واصل.docx';
if ($zip->open($file) === TRUE) {
    if (($index = $zip->locateName('word/document.xml')) !== false) {
        $content = $zip->getFromIndex($index);
        $zip->close();
        
        $text = strip_tags($content);
        echo mb_substr($text, 0, 5000); // Print first 5000 chars
    }
} else {
    echo "Failed to open zip\n";
}
