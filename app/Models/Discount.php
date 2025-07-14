<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    protected $fillable = [
        'plan_id',
        'code',
        'amount',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    public function plan()
    {
        return $this->belongsTo(Signature::class);
    }
}
