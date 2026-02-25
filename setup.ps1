# ╔══════════════════════════════════════════════════════════╗
# ║     🚀 سكريبت الإعداد الشامل - مسارات واصل            ║
# ║     يقوم بكل شيء دفعة واحدة                           ║
# ╚══════════════════════════════════════════════════════════╝

Write-Host "`n🔵 [1/5] إعادة تهيئة قاعدة البيانات مع كل البيانات..." -ForegroundColor Cyan
php artisan migrate:fresh --seed --force
if ($LASTEXITCODE -ne 0) { Write-Host "❌ فشل الـ Migration!" -ForegroundColor Red; exit 1 }
Write-Host "✅ قاعدة البيانات جاهزة" -ForegroundColor Green

Write-Host "`n🔵 [2/5] فحص IP الجهاز..." -ForegroundColor Cyan
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.InterfaceAlias -notlike '*WSL*' } | 
    Select-Object -First 1).IPAddress
Write-Host "📡 IP الجهاز: $localIP" -ForegroundColor Yellow

Write-Host "`n🔵 [3/5] التحقق من بيانات الاختبار..." -ForegroundColor Cyan
php artisan tinker --execute="
    \$g = App\Models\Guardian::with('user')->first();
    if(\$g) {
        echo '✅ Guardian: ' . \$g->user->email . PHP_EOL;
        echo '   FCM Token: ' . substr(\$g->user->fcm_token ?? 'NONE', 0, 30) . PHP_EOL;
        echo '   National ID: ' . \$g->national_id . PHP_EOL;
    } else {
        echo '❌ لا يوجد Guardian!' . PHP_EOL;
    }
"

Write-Host "`n🔵 [4/5] مقارنة IP Flutter مع IP الجهاز..." -ForegroundColor Cyan
$flutterConfig = Get-Content "C:\Users\ASUS\StudioProjects\msaratwasel_parent\lib\src\core\config\app_config.dart" -Raw
if ($flutterConfig -match "http://([0-9.]+):8000") {
    $flutterIP = $Matches[1]
    Write-Host "📱 Flutter IP: $flutterIP" -ForegroundColor Yellow
    if ($flutterIP -eq $localIP) {
        Write-Host "✅ Flutter مربوط بنفس IP الجهاز!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  IP مختلف! Flutter: $flutterIP | الجهاز: $localIP" -ForegroundColor Red
        Write-Host "   سيتم تحديث ملف app_config.dart..." -ForegroundColor Yellow
        (Get-Content "C:\Users\ASUS\StudioProjects\msaratwasel_parent\lib\src\core\config\app_config.dart") `
            -replace "http://[0-9.]+:8000", "http://${localIP}:8000" | `
            Set-Content "C:\Users\ASUS\StudioProjects\msaratwasel_parent\lib\src\core\config\app_config.dart"
        Write-Host "✅ تم تحديث IP في Flutter إلى: $localIP" -ForegroundColor Green
    }
}

Write-Host "`n🔵 [5/5] إيقاف خادم artisan الحالي وإعادة تشغيله على الشبكة..." -ForegroundColor Cyan
Write-Host "⚠️  سيتم فتح نافذة جديدة لخادم Laravel على 0.0.0.0:8000" -ForegroundColor Yellow
Write-Host "   (اترك هذه النافذة مفتوحة)" -ForegroundColor Yellow

# تشغيل artisan serve على 0.0.0.0 في نافذة جديدة
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$pwd'; php artisan serve --host=0.0.0.0 --port=8000"

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         ✅ الإعداد اكتمل بنجاح!              ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Dashboard:  http://127.0.0.1:8000/login       ║" -ForegroundColor Cyan
Write-Host "║  User:       school@wasel.com / password       ║" -ForegroundColor Cyan
Write-Host "║                                                 ║" -ForegroundColor Green
Write-Host "║  Flutter Login:                                ║" -ForegroundColor Yellow
Write-Host "║  ID:    1000200030                             ║" -ForegroundColor Yellow
Write-Host "║  Phone: 0555555555                             ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host "`n📋 الخطوات التالية:" -ForegroundColor White
Write-Host "  1. افتح Flutter وسجّل دخول بالبيانات أعلاه" -ForegroundColor White
Write-Host "  2. افتح Dashboard وأرسل إشعار من قسم الإشعارات" -ForegroundColor White
Write-Host "  3. تحقق أن الإشعار وصل للهاتف 🎉" -ForegroundColor White
