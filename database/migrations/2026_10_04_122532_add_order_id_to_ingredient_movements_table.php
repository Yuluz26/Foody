<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ingredient_movements', function (Blueprint $table) {
            $table->foreignId('order_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->index(['order_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::table('ingredient_movements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('order_id');
        });
    }
};
