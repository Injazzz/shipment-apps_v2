<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ship_operations', function (Blueprint $table) {
            $table->decimal('loading_tonnage', 15, 3)->change();
            $table->decimal('unloading_tonnage', 15, 3)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ship_operations', function (Blueprint $table) {
            $table->decimal('loading_tonnage', 10, 2)->change();
            $table->decimal('unloading_tonnage', 10, 2)->change();
        });
    }
};
