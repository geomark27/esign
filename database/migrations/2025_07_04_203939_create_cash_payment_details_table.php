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
        Schema::create('cash_payment_details', function (Blueprint $table) {
            $table->id();
            $table->decimal('received_amount', 10, 2)->comment('Monto recibido del cliente.');
            $table->decimal('change_given', 10, 2)->default(0)->comment('Cambio entregado al cliente.');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_payment_details');
    }
};
