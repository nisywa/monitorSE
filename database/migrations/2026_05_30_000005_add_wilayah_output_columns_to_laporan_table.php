<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Kosongkan tabel laporan dulu sebelum menambah kolom baru.
        DB::table('laporan')->delete();

        Schema::table('laporan', function (Blueprint $table) {
            $table->string('nama_kecamatan')->nullable()->after('sls_id');
            $table->string('nama_desa')->nullable()->after('nama_kecamatan');
            $table->string('nomor_sls')->nullable()->after('nama_desa');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laporan', function (Blueprint $table) {
            $table->dropColumn(['nomor_sls', 'nama_desa', 'nama_kecamatan']);
        });
    }
};
