<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** The system was renamed from Foody to Warung. Only a name still set to the old default is touched; a shop that chose its own name keeps it. */
    public function up(): void
    {
        DB::table('restaurant_settings')->where('name', 'Foody')->update(['name' => 'Warung']);
    }

    public function down(): void
    {
        DB::table('restaurant_settings')->where('name', 'Warung')->update(['name' => 'Foody']);
    }
};
