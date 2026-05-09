<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Laporan extends Model
{
    protected $table = 'laporan';
    protected $fillable = ['survei_id', 'pcl_id', 'pml_id', 'tanggal', 'data_usaha', 'data_keluarga', 'data_submit'];

    // Many-to-One: Many Laporan : 1 Survei
    public function survei()
    {
        return $this->belongsTo(Survei::class, 'survei_id');
    }

    // Many-to-One: Many Laporan : 1 PCL
    public function pcl()
    {
        return $this->belongsTo(Pcl::class, 'pcl_id');
    }

    // Many-to-One: Many Laporan : 1 PML
    public function pml()
    {
        return $this->belongsTo(Pml::class, 'pml_id');
    }
}
