<?php

namespace App\Http\Controllers;

use App\Models\AccountDeletionRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AccountDeletionController extends Controller
{
    /**
     * Display the public Account & Data Deletion page.
     */
    public function show(): Response
    {
        return Inertia::render('DeleteAccount', [
            'status' => session('status'),
            'ticket' => session('ticket'),
        ]);
    }

    /**
     * Store a new account and data deletion request.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'app_name' => ['required', 'string', 'max:255'],
            'account_role' => ['required', 'string', 'in:driver,supervisor,guardian,other'],
            'school_name' => ['nullable', 'string', 'max:255'],
            'reason' => ['nullable', 'string', 'max:2000'],
            'confirm_understanding' => ['accepted'],
        ], [
            'name.required' => 'يرجى إدخال الاسم الكامل.',
            'phone.required' => 'يرجى إدخال رقم الهاتف المسجل.',
            'app_name.required' => 'يرجى اختيار التطبيق التابع لحسابك.',
            'account_role.required' => 'يرجى اختيار الدور الوظيفي للحساب.',
            'confirm_understanding.accepted' => 'يجب الإقرار والتأكيد على فهم عواقب حذف الحساب.',
        ]);

        $deletionRequest = AccountDeletionRequest::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'app_name' => $validated['app_name'],
            'account_role' => $validated['account_role'],
            'school_name' => $validated['school_name'] ?? null,
            'reason' => $validated['reason'] ?? null,
            'status' => 'pending',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        Log::info('Account deletion request submitted', [
            'ticket' => $deletionRequest->ticket_number,
            'phone' => $deletionRequest->phone,
            'app' => $deletionRequest->app_name,
        ]);

        return redirect()->route('account.delete')->with([
            'status' => 'success',
            'ticket' => $deletionRequest->ticket_number,
        ]);
    }
}
