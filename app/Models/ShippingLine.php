<?php

namespace App\Models;

use App\Models\Ship;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShippingLine extends Model
{
    protected $fillable = [
        'name',
        'type',
    ];

    public function ships(): HasMany
    {
        return $this->hasMany(Ship::class);
    }
}
