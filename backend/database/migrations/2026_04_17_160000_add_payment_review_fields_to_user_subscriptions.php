<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('user_subscriptions')) {
            return;
        }

        Schema::table('user_subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('user_subscriptions', 'payment_method')) {
                $table->string('payment_method', 50)->nullable()->after('status');
            }

            if (! Schema::hasColumn('user_subscriptions', 'payment_reference')) {
                $table->string('payment_reference', 100)->nullable()->after('payment_method');
            }

            if (! Schema::hasColumn('user_subscriptions', 'payment_proof_url')) {
                $table->string('payment_proof_url', 500)->nullable()->after('payment_reference');
            }

            if (! Schema::hasColumn('user_subscriptions', 'payment_note')) {
                $table->text('payment_note')->nullable()->after('payment_proof_url');
            }

            if (! Schema::hasColumn('user_subscriptions', 'reviewed_by')) {
                $table->uuid('reviewed_by')->nullable()->after('payment_note');
            }

            if (! Schema::hasColumn('user_subscriptions', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            }

            if (! Schema::hasColumn('user_subscriptions', 'admin_note')) {
                $table->text('admin_note')->nullable()->after('reviewed_at');
            }
        });

        Schema::table('user_subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('user_subscriptions', 'reviewed_by')) {
                $table->foreign('reviewed_by')
                    ->references('id')
                    ->on('users')
                    ->nullOnDelete();
            }
        });

        // Normalize legacy active status to confirmed for payment-audited flow.
        DB::table('user_subscriptions')
            ->where('status', 'active')
            ->update(['status' => 'confirmed']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('user_subscriptions')) {
            return;
        }

        Schema::table('user_subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('user_subscriptions', 'reviewed_by')) {
                $table->dropForeign(['reviewed_by']);
            }

            foreach (['admin_note', 'reviewed_at', 'reviewed_by', 'payment_note', 'payment_proof_url', 'payment_reference', 'payment_method'] as $column) {
                if (Schema::hasColumn('user_subscriptions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
