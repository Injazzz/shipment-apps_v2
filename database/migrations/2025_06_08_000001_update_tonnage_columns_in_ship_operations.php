<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateTonnageColumnsInShipOperations extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ship_operations', function (Blueprint $table) {
            $table->decimal('loading_tonnage', 10, 3)->change();
            $table->decimal('unloading_tonnage', 10, 3)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ship_operations', function (Blueprint $table) {
            $table->bigInteger('loading_tonnage')->unsigned()->change();
            $table->bigInteger('unloading_tonnage')->unsigned()->change();
        });
    }
};
