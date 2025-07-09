<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Payment extends Model
{
    use HasFactory;

    /**
     * El nombre de la tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'payments';

    /**
     * Los atributos que se pueden asignar masivamente.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'certification_id',
        'amount',
        'payment_date',
        'status',
        'notes',
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount'        => 'decimal:2',
        'payment_date'  => 'datetime',
    ];

    const STATUS_PENDING    = 'pending';
    const STATUS_VERIFIED   = 'verified';
    const STATUS_REJECTED   = 'rejected';
    const STATUS_VOIDED     = 'voided';

    const STATUS_OPTIONS = [
        self::STATUS_PENDING    => 'Pendiente',
        self::STATUS_VERIFIED   => 'Verificado',
        self::STATUS_REJECTED   => 'Rechazado',
        self::STATUS_VOIDED     => 'Anulado',
    ];

    /**
     * Define la relación polimórfica.
     *
     * Esta es la función clave que permite al modelo Payment
     * relacionarse con diferentes modelos de "detalles" (CardPaymentDetail, CheckPaymentDetail, etc.)
     * usando las columnas 'detailable_id' y 'detailable_type'.
     */
    public function detailable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Obtiene la venta asociada con el pago.
     */
    public function certification(): BelongsTo
    {
        return $this->belongsTo(Certification::class);
    }
}
