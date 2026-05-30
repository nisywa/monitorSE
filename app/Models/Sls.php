<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sls extends Model
{
    protected $table = 'sls';
    protected $guarded = [];

    /**
     * Get the desa that owns the sls.
     */
    public function desa(): BelongsTo
    {
        return $this->belongsTo(Desa::class);
    }
}
