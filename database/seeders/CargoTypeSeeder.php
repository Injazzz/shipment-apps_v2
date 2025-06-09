<?php

namespace Database\Seeders;

use App\Models\CargoType;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class CargoTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $cargoTypes = [
            // GC Category
            ['name' => 'BATUBARA', 'category' => 'GC'],
            ['name' => 'STEEL BILLETS', 'category' => 'GC'],
            ['name' => 'STEEL PIPE', 'category' => 'GC'],
            ['name' => 'RAW SUGAR', 'category' => 'GC'],
            ['name' => 'EQUIPMENT', 'category' => 'GC'],
            ['name' => 'RICE', 'category' => 'GC'],
            ['name' => 'KONSTRUKSI', 'category' => 'GC'],
            ['name' => 'SCRAP', 'category' => 'GC'],
            ['name' => 'STEEL BARS', 'category' => 'GC'],
            ['name' => 'STEEL PIPES', 'category' => 'GC'],
            ['name' => 'GYPSUM', 'category' => 'GC'],
            ['name' => 'PIPE', 'category' => 'GC'],
            ['name' => 'COILS', 'category' => 'GC'],
            ['name' => 'STEEL', 'category' => 'GC'],
            ['name' => 'CABLE EQUIPMENT', 'category' => 'GC'],
            ['name' => 'PIPA', 'category' => 'GC'],
            ['name' => 'STANBY', 'category' => 'GC'],
            
            // Container Category
            ['name' => 'CONTAINER', 'category' => 'CONTAINER'],
        ];

        foreach ($cargoTypes as $cargoType) {
            CargoType::create($cargoType);
        }
    }
}
