<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pcl extends Model
{
    protected $fillable = ['user_id', 'pml_id', 'nama_pcl', 'tanggal_lahir', 'asal_kecamatan', 'blok_sensus'];

    public function user() { return $this->belongsTo(User::class); }
    public function pml() { return $this->belongsTo(Pml::class); }
    public function laporan() { return $this->hasMany(Laporan::class); }
}
