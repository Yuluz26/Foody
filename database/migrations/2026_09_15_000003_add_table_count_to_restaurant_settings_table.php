<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            // How many dine-in tables the shop has; checkout offers a dropdown of 1..N,
            // filtered down to whichever of those aren't currently held by an active order.
            $table->unsignedSmallInteger('table_count')->default(12)->after('takeaway_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            $table->dropColumn('table_count');
        });
    }
};
