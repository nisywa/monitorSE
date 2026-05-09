<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pcl extends Model
{
    protected $table = 'pcl';
    protected $fillable = ['user_id', 'pml_id', 'nama_pcl', 'tanggal_lahir', 'asal_kecamatan', 'blok_sensus'];

    // One-to-One: 1 PCL : 1 User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Many-to-One: Many PCL : 1 PML
    public function pml()
    {
        return $this->belongsTo(Pml::class, 'pml_id');
    }

    // Many-to-Many: 1 PCL : Many Survei
    public function surveis()
    {
        return $this->belongsToMany(Survei::class, 'pcl_survei', 'pcl_id', 'survei_id')->withTimestamps();
    }

    // One-to-Many: 1 PCL : Many Laporan
    public function laporan()
    {
        return $this->hasMany(Laporan::class, 'pcl_id');
    }
}
