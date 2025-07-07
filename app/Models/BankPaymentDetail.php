<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Validation\Rule; // Importante para la validación

class BankPaymentDetail extends Model
{
    use HasFactory;

    // --- Constantes para los tipos de pago ---
    const TYPE_DEPOSIT = 'deposit';
    const TYPE_TRANSFER = 'transfer';

    /**
     * Opciones para mostrar en la interfaz (formularios, vistas, etc.).
     * La clave es el valor que se guarda en la base de datos.
     * El valor es la etiqueta que ve el usuario.
     */
    const TYPE_OPTIONS = [
        self::TYPE_DEPOSIT  => 'Depósito Bancario',
        self::TYPE_TRANSFER => 'Transferencia Bancaria',
    ];

    protected $fillable = [
        'type',
        'destination_bank_account',
        'reference_number',
        'transaction_date',
        'origin_bank',
    ];
    
    protected $casts = [
        'transaction_date' => 'date',
    ];

    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'detailable');
    }
}