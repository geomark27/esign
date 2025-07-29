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
        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            
            // Relación con la tabla de provincias
            // constrained() asume que la tabla es 'provinces' y la columna 'id'
            // onDelete('cascade') borrará las ciudades si se elimina su provincia
            $table->foreignId('province_id')
            ->constrained('provinces')
            ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cities');
    }
};
