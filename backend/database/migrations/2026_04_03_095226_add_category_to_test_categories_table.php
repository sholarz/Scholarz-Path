<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('test_categories', function (Blueprint $table) {
            // Tambah kolom category sesuai frontend
            $table->enum('category', [
                'english',
                'math',
                'logical-reasoning',
                'general-knowledge',
                'indonesian',
            ])->default('english')->after('test_type');
        });
    }

    public function down(): void
    {
        Schema::table('test_categories', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};