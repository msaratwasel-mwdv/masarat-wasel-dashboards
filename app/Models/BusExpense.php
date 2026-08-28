<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusExpense extends Model
{
    use HasFactory;
    protected $fillable = [
        'bus_id',
        'type',
        'amount',
        'date',
        'extra_info',
        'receipt_photo',
    ];

    protected $appends = ['photo_url'];

    public function bus()
    {
        return $this->belongsTo(Bus::class);
    }

    public function getPhotoUrlAttribute()
    {
        if (!$this->receipt_photo) return null;
        
        // If it looks like a full URL
        if (filter_var($this->receipt_photo, FILTER_VALIDATE_URL)) {
            return $this->receipt_photo;
        }

        // If it starts with storage/ or /storage/
        if (str_starts_with($this->receipt_photo, 'storage/') || str_starts_with($this->receipt_photo, '/storage/')) {
            $path = ltrim($this->receipt_photo, '/');
            return asset($path);
        }
        
        return asset('storage/' . $this->receipt_photo);
    }
}
