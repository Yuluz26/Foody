<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Single-row table: the application reads and updates the first row only.
        Schema::create('restaurant_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('logo')->nullable();
            $table->text('description')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('address')->nullable();
            // Daily hours; closes_at earlier than opens_at means the shop closes after midnight.
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->string('currency', 3)->default('MYR');
            $table->boolean('ordering_enabled')->default(true);
            $table->boolean('dine_in_enabled')->default(true);
            $table->boolean('takeaway_enabled')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_settings');
    }
};
