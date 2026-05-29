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
            if (!Schema::hasColumn('pml', 'sobat_id')) {
                $table->string('sobat_id')->nullable()->after('nama_pml');
            }
            if (!Schema::hasColumn('pml', 'no_telp')) {
                $table->string('no_telp')->nullable()->after('sobat_id');
            }
        });

        $pmls = DB::table('pml')->whereNull('sobat_id')->orWhereNull('no_telp')->get();
        foreach ($pmls as $pml) {
            $updateData = [];
            if (is_null($pml->sobat_id)) {
                $updateData['sobat_id'] = 'SOBAT' . str_pad($pml->id, 4, '0', STR_PAD_LEFT);
            }
            if (is_null($pml->no_telp)) {
                $updateData['no_telp'] = '0812345' . str_pad($pml->id, 4, '0', STR_PAD_LEFT);
            }
            if (!empty($updateData)) {
                DB::table('pml')->where('id', $pml->id)->update($updateData);
            }
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
