<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'salwanettayumna@gmail.com')->first();
$resolver = function() use ($user) { return $user; };

echo "--- ME ---\n";
$req1 = Illuminate\Http\Request::create('/api/profile/me', 'GET');
$req1->setUserResolver($resolver);
$res1 = app(\App\Modules\User\Controllers\ProfileController::class)->me($req1);
echo json_encode($res1->getData());

echo "\n--- PREFS ---\n";
$req2 = Illuminate\Http\Request::create('/api/preferences', 'GET');
$req2->setUserResolver($resolver);
$res2 = app(\App\Modules\Profile\Controllers\PreferenceController::class)->index($req2);
echo json_encode($res2->getData());

echo "\n--- DOCS ---\n";
$req3 = Illuminate\Http\Request::create('/api/documents/readiness', 'GET');
$req3->setUserResolver($resolver);
$res3 = app(\App\Modules\Profile\Controllers\DocumentController::class)->readiness($req3);
echo json_encode($res3->getData());

echo "\n--- LANGS ---\n";
$req4 = Illuminate\Http\Request::create('/api/language-tests', 'GET');
$req4->setUserResolver($resolver);
$res4 = app(\App\Modules\Profile\Controllers\LanguageTestController::class)->index($req4);
echo json_encode($res4->getData());

echo "\n";
