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
        Schema::table('pml', function (Blueprint $table) {
            $table->string('sobat_id')->nullable()->after('nama_pml');
            $table->string('no_telp')->nullable()->after('sobat_id');
        });

        $pmls = DB::table('pml')->get();
        foreach ($pmls as $pml) {
            DB::table('pml')
                ->where('id', $pml->id)
                ->update([
                    'sobat_id' => 'SOBAT' . str_pad($pml->id, 4, '0', STR_PAD_LEFT),
                    'no_telp'  => '0812345' . str_pad($pml->id, 4, '0', STR_PAD_LEFT),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pml', function (Blueprint $table) {
            $table->dropColumn(['sobat_id', 'no_telp']);
        });
    }
};
