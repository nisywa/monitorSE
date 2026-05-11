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
        if (Schema::hasColumn('survei', 'pml_id')) {
            Schema::table('survei', function (Blueprint $table) {
                // Hapus foreign key constraint terlebih dahulu
                $table->dropForeign(['pml_id']);
                // Kemudian hapus kolom pml_id
                $table->dropColumn('pml_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('survei', 'pml_id')) {
            Schema::table('survei', function (Blueprint $table) {
                $table->foreignId('pml_id')->nullable()->constrained('pml')->onDelete('cascade');
            });
        }
    }
};
