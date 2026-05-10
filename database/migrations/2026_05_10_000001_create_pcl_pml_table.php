<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Membuat pivot table untuk relasi Many-to-Many antara PCL dan PML
     */
    public function up(): void
    {
        Schema::create('pcl_pml', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pcl_id')->constrained('pcl')->onDelete('cascade');
            $table->foreignId('pml_id')->constrained('pml')->onDelete('cascade');
            $table->timestamps();
            
            // Unique constraint untuk mencegah duplikasi
            $table->unique(['pcl_id', 'pml_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pcl_pml');
    }
};
