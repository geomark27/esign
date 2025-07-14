<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Signature extends Model
{
    use HasFactory;
    protected $fillable = [
        'period',
        'display_name',
        'cost',
        'price',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function certifications(): HasMany
    {
        return $this->hasMany(Certification::class, 'period', 'period');
    }
}
