<?php

namespace App\Models;

use App\Models\ShipOperation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CargoType extends Model
{
    protected $fillable = [
        'name',
        'category',
    ];

    public function shipOperations(): HasMany
    {
        return $this->hasMany(ShipOperation::class);
    }
}