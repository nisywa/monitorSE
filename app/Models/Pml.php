<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pml extends Model
{
    protected $table = 'pml';
    protected $fillable = ['user_id', 'nama_pml', 'tanggal_lahir'];

    public function user() { return $this->belongsTo(User::class); }
    public function pcl() { return $this->hasMany(Pcl::class); }
    public function survei() { return $this->hasMany(Survei::class); }
    public function laporan() { return $this->hasMany(Laporan::class); }
}
