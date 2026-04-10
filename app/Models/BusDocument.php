<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusDocument extends Model
{
    protected $fillable = ['bus_id', 'type', 'file_path', 'expiry_date'];
}


