<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ship_operations', function (Blueprint $table) {
            $table->decimal('loading_tonnage', 20, 3)->change();
            $table->decimal('unloading_tonnage', 20, 3)->change();
        });
    }

    public function down(): void
    {
        Schema::table('ship_operations', function (Blueprint $table) {
            $table->decimal('loading_tonnage', 10, 2)->change();
            $table->decimal('unloading_tonnage', 10, 2)->change();
        });
    }
};
