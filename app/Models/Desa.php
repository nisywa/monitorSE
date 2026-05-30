<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Desa extends Model
{
    protected $table = 'desa';
    protected $guarded = [];

    /**
     * Get the kecamatan that owns the desa.
     */
    public function kecamatan(): BelongsTo
    {
        return $this->belongsTo(Kecamatan::class);
    }

    /**
     * Get the sls for the desa.
     */
    public function sls(): HasMany
    {
        return $this->hasMany(Sls::class);
    }
}
