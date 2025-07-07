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
        Schema::create('bank_payment_details', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['deposit', 'transfer'])->comment('Tipo de transacción bancaria.');
            $table->string('destination_bank_account')->comment('Cuenta de la empresa que recibió el dinero.');
            $table->string('reference_number')->unique()->comment('Número de referencia o de comprobante.');
            $table->date('transaction_date')->comment('Fecha de la transacción.');
            $table->string('origin_bank')->nullable()->comment('Banco de origen (útil para transferencias).');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_payment_details');
    }
};
