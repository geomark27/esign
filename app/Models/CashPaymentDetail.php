<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class CashPaymentDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'received_amount',
        'change_given',
    ];

    /**
     * Obtiene el pago principal asociado a este detalle.
     */
    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'detailable');
    }
}