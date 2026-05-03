<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Survei extends Model
{
    protected $fillable = ['nama_survei', 'tanggal_mulai', 'tanggal_selesai', 'pml_id'];

    public function pml() { return $this->belongsTo(Pml::class); }
    public function laporan() { return $this->hasMany(Laporan::class); }
}
