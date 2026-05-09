<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pml extends Model
{
    protected $table = 'pml';
    protected $fillable = ['user_id', 'nama_pml', 'tanggal_lahir'];

    // One-to-One: 1 PML : 1 User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // One-to-Many: 1 PML : Many PCL
    public function pcls()
    {
        return $this->hasMany(Pcl::class, 'pml_id');
    }

    // Many-to-Many: 1 PML : Many Survei
    public function surveis()
    {
        return $this->belongsToMany(Survei::class, 'pml_survei', 'pml_id', 'survei_id')->withTimestamps();
    }

    // One-to-Many: 1 PML : Many Laporan
    public function laporan()
    {
        return $this->hasMany(Laporan::class, 'pml_id');
    }
}
