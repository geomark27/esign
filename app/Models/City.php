<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo; // Importante añadir esto

class City extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'name',
        'province_id',
    ];

    /**
     * Define la relación inversa: una ciudad pertenece a una provincia.
     */
    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }
}