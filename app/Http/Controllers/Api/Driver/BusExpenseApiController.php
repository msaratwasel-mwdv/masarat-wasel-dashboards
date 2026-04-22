<?php

namespace App\Http\Controllers\Api\Driver;

use App\Http\Controllers\Controller;
use App\Models\BusExpense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BusExpenseApiController extends Controller
{
    /**
     * Display a listing of the bus expenses.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Find the bus where this user is assigned
        $bus = \App\Models\Bus::where('driver_id', $user->id)
            ->orWhere('assistant_id', $user->id)
            ->first();

        if (!$bus) {
            return response()->json([
                'success' => false,
                'message' => 'User is not assigned to any bus.'
            ], 403);
        }

        $expenses = BusExpense::where('bus_id', $bus->id)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $expenses->items(),
            'meta'    => [
                'current_page' => $expenses->currentPage(),
                'last_page'    => $expenses->lastPage(),
                'total'        => $expenses->total(),
            ]
        ]);
    }

    /**
     * Store a newly created bus expense in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Ensure the user has an assigned bus
        $bus = \App\Models\Bus::where('driver_id', $user->id)
            ->orWhere('assistant_id', $user->id)
            ->first();

        if (!$bus) {
            return response()->json([
                'success' => false,
                'message' => 'User is not assigned to any bus.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'type'          => 'required|in:fuel,maintenance',
            'amount'        => 'required|numeric|min:0',
            'date'          => 'required|date',
            'extra_info'    => 'nullable|string',
            'receipt_photo' => 'nullable|image|max:5120', // Max 5MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // --- Odometer Guard Validation ---
        if ($request->type === 'fuel' && !empty($request->extra_info)) {
            $currentOdometer = (int) filter_var($request->extra_info, FILTER_SANITIZE_NUMBER_INT);
            $lastExpense = BusExpense::where('bus_id', $bus->id)
                ->where('type', 'fuel')
                ->whereNotNull('extra_info')
                ->latest('date')
                ->first();

            if ($lastExpense) {
                $lastOdometer = (int) filter_var($lastExpense->extra_info, FILTER_SANITIZE_NUMBER_INT);
                if ($currentOdometer < $lastOdometer) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation error',
                        'errors' => [
                            'extra_info' => ['قراءة العداد لا يمكن أن تكون أقل من القراءة السابقة (' . $lastOdometer . ')']
                        ]
                    ], 422);
                }
            }
        }
        // ---------------------------------

        $photoPath = null;
        if ($request->hasFile('receipt_photo')) {
            // Store in storage/app/public/expenses and return public path
            $path = $request->file('receipt_photo')->store('expenses', 'public');
            $photoPath = $path;
        }

        $expense = BusExpense::create([
            'bus_id'        => $bus->id,
            'type'          => $request->type,
            'amount'        => $request->amount,
            'date'          => $request->date,
            'extra_info'    => $request->extra_info,
            'receipt_photo' => $photoPath,
        ]);

        // If I need to store the photo path, I should check if the column exists.
        // In the migration I created earlier, I had:
        // $table->string('extra_info');
        // If I want to support photo, I should probably add a column or store it in extra_info JSON.
        // Let's check the migration I actually ran.

        return response()->json([
            'success' => true,
            'message' => 'Expense recorded successfully',
            'data'    => $expense
        ]);
    }
}
