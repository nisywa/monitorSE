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
        Schema::create('laporan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survei_id')->constrained('survei')->onDelete('cascade');
            $table->foreignId('pcl_id')->constrained('pcl')->onDelete('cascade');
            $table->foreignId('pml_id')->constrained('pml')->onDelete('cascade');
            $table->date('tanggal');
            $table->integer('data_usaha')->default(0);
            $table->integer('data_keluarga')->default(0);
            $table->boolean('data_submit')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laporan');
    }
};
