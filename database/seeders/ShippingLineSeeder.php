<?php

namespace Database\Seeders;

use App\Models\ShippingLine;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class ShippingLineSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $shippingLines = [
            ['name' => 'INTER ISLAND', 'type' => 'INTER ISLAND'],
            ['name' => 'OCEAN GOING', 'type' => 'OCEAN GOING'],
        ];

        foreach ($shippingLines as $line) {
            ShippingLine::create($line);
        }
    }
}
