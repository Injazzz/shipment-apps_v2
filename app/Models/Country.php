<?php

namespace App\Models;

use App\Models\Ship;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    protected $fillable = [
        'name',
        'code',
        'alpha3',
        'flag_emoji',
    ];

    public function ships(): HasMany
    {
        return $this->hasMany(Ship::class);
    }
}
