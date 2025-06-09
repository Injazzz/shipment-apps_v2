<?php

namespace App\Models;

use App\Models\Country;
use App\Models\ShippingLine;
use App\Models\ShipOperation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ship extends Model
{
    protected $fillable = [
        'name',
        'shipping_line_id',
        'country_id',
        'capacity',
    ];

    public function shippingLine(): BelongsTo
    {
        return $this->belongsTo(ShippingLine::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function operations(): HasMany
    {
        return $this->hasMany(ShipOperation::class);
    }
}
