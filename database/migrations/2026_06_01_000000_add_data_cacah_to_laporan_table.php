<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('laporan', function (Blueprint $table) {
            $table->integer('data_cacah')->default(0)->after('data_keluarga');
        });

        // Populate existing rows with a sensible dummy value (use existing data_usaha when available)
        DB::table('laporan')->update(['data_cacah' => DB::raw('COALESCE(data_usaha, 0)')]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('laporan', function (Blueprint $table) {
            $table->dropColumn('data_cacah');
        });
    }
};
