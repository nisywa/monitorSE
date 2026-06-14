<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laporan', function (Blueprint $table) {
            if (!Schema::hasColumn('laporan', 'menemukan_usaha_digital')) {
                $table->boolean('menemukan_usaha_digital')->default(false)->after('data_submit');
            }

            if (!Schema::hasColumn('laporan', 'jumlah_usaha_digital')) {
                $table->unsignedInteger('jumlah_usaha_digital')->default(0)->after('menemukan_usaha_digital');
            }

            if (!Schema::hasColumn('laporan', 'keterangan')) {
                $table->text('keterangan')->nullable()->after('jumlah_usaha_digital');
            }
        });
    }

    public function down(): void
    {
        Schema::table('laporan', function (Blueprint $table) {
            if (Schema::hasColumn('laporan', 'keterangan')) {
                $table->dropColumn('keterangan');
            }

            if (Schema::hasColumn('laporan', 'jumlah_usaha_digital')) {
                $table->dropColumn('jumlah_usaha_digital');
            }

            if (Schema::hasColumn('laporan', 'menemukan_usaha_digital')) {
                $table->dropColumn('menemukan_usaha_digital');
            }
        });
    }
};
