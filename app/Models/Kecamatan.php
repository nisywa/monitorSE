<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kecamatan extends Model
{
    protected $table = 'kecamatan';
    protected $guarded = [];

    /**
     * Get the desa for the kecamatan.
     */
    public function desa(): HasMany
    {
        return $this->hasMany(Desa::class);
    }
}
