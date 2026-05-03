<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Laporan extends Model
{
    protected $table = 'laporan';
    protected $fillable = ['survei_id', 'pcl_id', 'pml_id', 'tanggal', 'data_usaha', 'data_keluarga', 'data_submit'];

    public function survei() { return $this->belongsTo(Survei::class); }
    public function pcl() { return $this->belongsTo(Pcl::class); }
    public function pml() { return $this->belongsTo(Pml::class); }
}
