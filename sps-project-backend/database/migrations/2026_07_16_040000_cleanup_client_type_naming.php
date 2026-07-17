<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table): void {
            $table->renameColumn('type_client', 'type_organisation');
        });

        Schema::table('clients_particulier', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
            $table->dropColumn('type_client');
        });

        Schema::table('clients_particulier', function (Blueprint $table): void {
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('clients_particulier', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
            $table->string('type_client')->nullable()->after('adresse');
        });

        Schema::table('clients_particulier', function (Blueprint $table): void {
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });

        Schema::table('clients', function (Blueprint $table): void {
            $table->renameColumn('type_organisation', 'type_client');
        });
    }
};
