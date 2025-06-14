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
        Schema::create('ship_operations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('ship_id')->constrained()->onDelete('cascade');
            $table->foreignId('cargo_type_id')->constrained()->onDelete('cascade');
            $table->date('operation_date');
            $table->decimal('unloading_tonnage', 10, 2)->default(0);
            $table->decimal('loading_tonnage', 10, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ship_operations');
    }
};
