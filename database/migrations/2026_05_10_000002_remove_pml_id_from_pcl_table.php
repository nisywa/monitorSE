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
        Schema::table('pcl', function (Blueprint $table) {
            // Hapus foreign key constraint terlebih dahulu
            $table->dropForeign(['pml_id']);
            // Hapus kolom pml_id
            $table->dropColumn('pml_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pcl', function (Blueprint $table) {
            // Tambahkan kembali kolom pml_id jika perlu rollback
            $table->foreignId('pml_id')->constrained('pml')->onDelete('cascade');
        });
    }
};
