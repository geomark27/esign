<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class CardPaymentDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_code',
        'authorization_code',
        'card_brand',
        'last_four_digits',
        'installments', // Número de cuotas o meses
        'receipt',
    ];

    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'detailable');
    }

    const AVAILABLE_BRANDS = [
        'visa'              => 'Visa',
        'mastercard'        => 'Mastercard',
        'american_express'  => 'American Express',
        'diners_club'       => 'Diners Club',
        'discover'          => 'Discover',
    ];

}