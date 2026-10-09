<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 20);
            // Signed: positive adds, negative removes.
            $table->decimal('delta', 12, 3);
            $table->decimal('balance_after', 12, 3);
            // Price per unit paid on a restock, in sen. Null for every other type.
            $table->unsignedInteger('unit_cost')->nullable();
            $table->string('note', 160)->nullable();
            $table->timestamps();

            $table->index(['ingredient_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_movements');
    }
};
