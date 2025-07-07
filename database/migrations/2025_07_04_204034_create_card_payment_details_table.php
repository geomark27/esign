<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('card_payment_details', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_code')->nullable()->comment('ID de la transacción del procesador de pagos.');
            $table->string('authorization_code')->nullable()->comment('Código de autorización del banco.');
            $table->string('card_brand')->comment('Ej: Visa, Mastercard, Amex.');
            $table->string('last_four_digits', 4)->comment('Últimos 4 dígitos de la tarjeta.');
            $table->integer('installments')->default(1)->comment('Número de cuotas.');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_payment_details');
    }
};
