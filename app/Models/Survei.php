<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Survei extends Model
{
    protected $table = 'survei';
    protected $fillable = ['nama_survei', 'deskripsi', 'tanggal_mulai', 'tanggal_selesai'];

    // Many-to-Many: 1 Survei : Many PML
    public function pmls()
    {
        return $this->belongsToMany(Pml::class, 'pml_survei', 'survei_id', 'pml_id')->withTimestamps();
    }

    // Many-to-Many: 1 Survei : Many PCL
    public function pcls()
    {
        return $this->belongsToMany(Pcl::class, 'pcl_survei', 'survei_id', 'pcl_id')->withTimestamps();
    }

    // One-to-Many: 1 Survei : Many Laporan
    public function laporan()
    {
        return $this->hasMany(Laporan::class, 'survei_id');
    }
}
