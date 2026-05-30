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
        Schema::create('sls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('desa_id')->constrained('desa')->onDelete('cascade');
            $table->string('nomor_sls');
            $table->integer('jumlah_rumah_tangga')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sls');
    }
};
