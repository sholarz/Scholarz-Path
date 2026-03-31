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
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['guest', 'free', 'premium', 'admin'])->default('free');
            $table->enum('status', ['active', 'inactive', 'banned'])->default('active');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['email']);
            $table->index(['role']);
            $table->index(['status']);
        });

        Schema::create('user_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('phone', 20)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('nationality', 100)->nullable();
            $table->string('current_country', 100)->nullable();
            $table->decimal('gpa', 3, 2)->nullable()->check('gpa >= 0.00 AND gpa <= 4.00');
            $table->string('major', 200)->nullable();
            $table->enum('degree_level', ['high_school', 'bachelor', 'master', 'doctorate'])->nullable();
            $table->integer('graduation_year')->nullable();
            $table->integer('profile_completion_percentage')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id']);
            $table->index(['gpa']);
            $table->index(['major']);
            $table->index(['degree_level']);
        });

        Schema::create('user_languages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('language', 100);
            $table->enum('proficiency_level', ['beginner', 'intermediate', 'advanced', 'native']);
            $table->string('certification', 200)->nullable();
            $table->string('score', 50)->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id']);
            $table->index(['language']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_languages');
        Schema::dropIfExists('user_profiles');
        Schema::dropIfExists('users');
    }
};