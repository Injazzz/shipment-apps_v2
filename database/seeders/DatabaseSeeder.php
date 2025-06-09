<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\CountrySeeder;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\CargoTypeSeeder;
use Database\Seeders\ShippingLineSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            CountrySeeder::class,
            CargoTypeSeeder::class,
            ShippingLineSeeder::class,
        ]);
    }
}
