<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany; // Importante añadir esto

class Province extends Model
{
    use HasFactory;

    protected $fillable = ['name']; // Asegúrate de que el modelo permita asignación masiva

    public function cities(): HasMany
    {
        return $this->hasMany(City::class);
    }
}