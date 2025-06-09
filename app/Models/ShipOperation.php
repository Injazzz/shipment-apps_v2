<?php

namespace App\Models;

use App\Models\Ship;
use App\Models\User;
use App\Models\CargoType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShipOperation extends Model
{
    protected $fillable = [
        'user_id',
        'ship_id',
        'cargo_type_id',
        'operation_date',
        'unloading_tonnage',
        'loading_tonnage',
        'remarks',
    ];

    protected $casts = [
        'operation_date' => 'date',
        'unloading_tonnage' => 'decimal:3',
        'loading_tonnage' => 'decimal:3',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ship(): BelongsTo
    {
        return $this->belongsTo(Ship::class);
    }

    public function cargoType(): BelongsTo
    {
        return $this->belongsTo(CargoType::class);
    }

    public function getTotalTonnageAttribute(): float
    {
        return $this->unloading_tonnage + $this->loading_tonnage;
    }
}
