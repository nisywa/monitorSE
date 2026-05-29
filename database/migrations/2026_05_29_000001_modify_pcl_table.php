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
            // Rename blok_sensus to desa
            $table->renameColumn('blok_sensus', 'desa');
            
            // Add new columns
            $table->string('sls')->nullable()->after('desa');
            $table->string('sobat_id')->nullable()->after('sls');
            $table->string('no_telp')->nullable()->after('sobat_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pcl', function (Blueprint $table) {
            // Remove new columns
            $table->dropColumn('no_telp');
            $table->dropColumn('sobat_id');
            $table->dropColumn('sls');
            
            // Rename desa back to blok_sensus
            $table->renameColumn('desa', 'blok_sensus');
        });
    }
};
