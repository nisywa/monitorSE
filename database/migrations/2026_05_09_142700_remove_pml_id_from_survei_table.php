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
        Schema::table('survei', function (Blueprint $table) {
            // Hapus foreign key constraint terlebih dahulu
            $table->dropForeign(['pml_id']);
            // Kemudian hapus kolom pml_id
            $table->dropColumn('pml_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survei', function (Blueprint $table) {
            $table->foreignId('pml_id')->constrained('pml')->onDelete('cascade')->nullable();
        });
    }
};
