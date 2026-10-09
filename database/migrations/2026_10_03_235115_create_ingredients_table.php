<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            // Free text such as kg, liter, biji, pek: whatever the kitchen counts in.
            $table->string('unit', 20);
            $table->decimal('quantity', 12, 3)->default(0);
            // Sen per one unit.
            $table->unsignedInteger('unit_cost')->default(0);
            $table->decimal('low_stock_threshold', 12, 3)->default(0);
            $table->string('supplier', 80)->nullable();
            $table->timestamps();

            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
