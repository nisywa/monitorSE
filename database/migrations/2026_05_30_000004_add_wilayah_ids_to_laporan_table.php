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
        Schema::table('laporan', function (Blueprint $table) {
            $table->foreignId('kecamatan_id')->nullable()->after('pml_id')->constrained('kecamatan')->nullOnDelete();
            $table->foreignId('desa_id')->nullable()->after('kecamatan_id')->constrained('desa')->nullOnDelete();
            $table->foreignId('sls_id')->nullable()->after('desa_id')->constrained('sls')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laporan', function (Blueprint $table) {
            $table->dropForeign(['sls_id']);
            $table->dropForeign(['desa_id']);
            $table->dropForeign(['kecamatan_id']);
            $table->dropColumn(['sls_id', 'desa_id', 'kecamatan_id']);
        });
    }
};
