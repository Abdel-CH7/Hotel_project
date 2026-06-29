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
        Schema::table('chambres', function (Blueprint $table) {
            $table->boolean('climat')->default(false)->change();
            $table->boolean('wifi')->default(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chambres', function (Blueprint $table) {
            $table->enum('climat', ['oui', 'non'])->default('non')->change();
            $table->unsignedInteger('wifi')->default(0)->change();
        });
    }
}; 