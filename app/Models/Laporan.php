<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Kecamatan;
use App\Models\Desa;
use App\Models\Sls;
use App\Models\Survei;
use App\Models\Pcl;
use App\Models\Pml;

class Laporan extends Model
{
    protected $table = 'laporan';
    protected $fillable = ['survei_id', 'pcl_id', 'pml_id', 'kecamatan_id', 'desa_id', 'sls_id', 'nama_kecamatan', 'nama_desa', 'nomor_sls', 'tanggal', 'data_usaha', 'data_keluarga', 'data_submit'];

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

    public function kecamatan()
    {
        return $this->belongsTo(Kecamatan::class, 'kecamatan_id');
    }

    public function desa()
    {
        return $this->belongsTo(Desa::class, 'desa_id');
    }

    public function sls()
    {
        return $this->belongsTo(Sls::class, 'sls_id');
    }
}
