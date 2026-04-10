<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InspectionItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InspectionItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $items = InspectionItem::orderBy('order_index')->get();

        return Inertia::render('Admin/Reports/InspectionItems', [
            'items' => $items
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
            'order_index' => 'integer'
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);

        InspectionItem::create($validated);

        return redirect()->back()->with('success', 'تمت إضافة البند بنجاح');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, InspectionItem $inspectionItem)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
            'order_index' => 'integer'
        ]);

        $validated['is_active'] = $request->boolean('is_active');

        $inspectionItem->update($validated);

        return redirect()->back()->with('success', 'تم التعديل بنجاح');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(InspectionItem $inspectionItem)
    {
        $inspectionItem->delete();
        return redirect()->back()->with('success', 'تم الحذف بنجاح');
    }
}


