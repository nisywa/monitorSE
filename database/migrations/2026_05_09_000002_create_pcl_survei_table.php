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
        Schema::create('pcl_survei', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pcl_id')->constrained('pcl')->onDelete('cascade');
            $table->foreignId('survei_id')->constrained('survei')->onDelete('cascade');
            $table->timestamps();
            
            // Unique constraint untuk mencegah duplikasi
            $table->unique(['pcl_id', 'survei_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pcl_survei');
    }
};
