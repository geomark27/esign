<?php

use App\Models\Payment;
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
        // Se crea la tabla principal 'payments' con una estructura polimórfica.
        // Contiene solo la información común a todos los tipos de pago.
        Schema::create('payments', function (Blueprint $table) {
            // --- Common Fields for all payments ---
            $table->id();
            $table->foreignId('certification_id')->constrained('certifications')->comment('Relación con la certificación.');
            $table->decimal('amount', 10, 2);
            $table->dateTime('payment_date');
            $table->enum('status', [
                Payment::STATUS_PENDING,
                Payment::STATUS_VERIFIED,
            ]);
            $table->text('notes')->nullable();
            $table->morphs('detailable');

            // --- Timestamps ---
            $table->timestamps(); // created_at and updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
