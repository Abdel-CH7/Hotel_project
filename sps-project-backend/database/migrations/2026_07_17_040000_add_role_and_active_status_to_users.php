<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('staff')->after('photo');
            $table->boolean('is_active')->default(true)->after('role');
        });

        $hasAdmin = DB::table('users')
            ->whereNull('deleted_at')
            ->where('role', 'admin')
            ->exists();

        if (! $hasAdmin) {
            $oldestUserId = DB::table('users')
                ->whereNull('deleted_at')
                ->orderBy('id')
                ->value('id');

            if ($oldestUserId !== null) {
                DB::table('users')->where('id', $oldestUserId)->update(['role' => 'admin']);
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'is_active']);
        });
    }
};
