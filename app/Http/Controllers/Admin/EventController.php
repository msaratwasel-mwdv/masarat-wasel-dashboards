<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->query('search', '');
        
        $query = Event::query();
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('title_ar', 'like', "%{$search}%")
                  ->orWhere('title_en', 'like', "%{$search}%");
            });
        }

        $events = $query->latest()->paginate(10);
        
        $counts = [
            'all' => Event::count(),
            'published' => Event::where('is_published', true)->count(),
            'draft' => Event::where('is_published', false)->count(),
            'news' => Event::where('type', 'news')->count(),
        ];

        return Inertia::render('Admin/Events/Index', [
            'events' => $events,
            'counts' => $counts,
            'filters' => ['search' => $search]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Events/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_ar' => 'required|string|max:255',
            'title_en' => 'required|string|max:255',
            'content_ar' => 'nullable|string',
            'content_en' => 'nullable|string',
            'type' => 'required|string|in:news,workshop,bus_photos,activity',
            'tag_ar' => 'nullable|string|max:255',
            'tag_en' => 'nullable|string|max:255',
            'event_date' => 'nullable|date',
            'is_published' => 'boolean',
            'image' => 'nullable|image|max:2048'
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('events', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        Event::create($validated);

        return redirect()->route('admin.events.index')->with('success', 'تم إضافة الفعالية بنجاح');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Event $event)
    {
        return Inertia::render('Admin/Events/Edit', [
            'event' => $event
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'title_ar' => 'required|string|max:255',
            'title_en' => 'required|string|max:255',
            'content_ar' => 'nullable|string',
            'content_en' => 'nullable|string',
            'type' => 'required|string|in:news,workshop,bus_photos,activity',
            'tag_ar' => 'nullable|string|max:255',
            'tag_en' => 'nullable|string|max:255',
            'event_date' => 'nullable|date',
            'is_published' => 'boolean',
            'image' => 'nullable|image|max:2048'
        ]);

        if ($request->hasFile('image')) {
            if ($event->image) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $event->image));
            }
            $path = $request->file('image')->store('events', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        $event->update($validated);

        return redirect()->route('admin.events.index')->with('success', 'تم تحديث الفعالية بنجاح');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Event $event)
    {
        if ($event->image) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $event->image));
        }
        
        $event->delete();

        return redirect()->route('admin.events.index')->with('success', 'تم حذف الفعالية بنجاح');
    }
}
