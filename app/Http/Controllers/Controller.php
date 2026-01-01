<?php

namespace App\Http\Controllers;

// ✅ 1. استيراد الميزة الأساسية من إطار العمل
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

/**
 * @OA\Info(
 *      version="1.0.0",
 *      title="Laravel OpenApi Demo Documentation",
 *      description="L5 Swagger OpenApi description",
 *
 *      @OA\Contact(
 *          email="admin@admin.com"
 *      ),
 *
 *      @OA\License(
 *          name="Apache 2.0",
 *          url="http://www.apache.org/licenses/LICENSE-2.0.html"
 *      )
 * )
 *
 * @OA\Server(
 *      url=L5_SWAGGER_CONST_HOST,
 *      description="Demo API Server"
 * )
 */
abstract class Controller
{
    // ✅ 2. هذا هو السطر الذي سيحل المشكلة نهائياً
    // هو يضيف قدرة "التحقق من الصلاحيات" لكل المتحكمات في مشروعك
    use AuthorizesRequests;
}
