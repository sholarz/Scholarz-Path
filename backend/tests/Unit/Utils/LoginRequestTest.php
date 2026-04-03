<?php

namespace Tests\Unit\Utils;

use App\Modules\Auth\Requests\LoginRequest;
use Tests\TestCase;

class LoginRequestTest extends TestCase
{
    public function test_authorize_returns_true(): void
    {
        $request = new LoginRequest();

        $this->assertTrue($request->authorize());
    }

    public function test_rules_contains_expected_fields_and_validators(): void
    {
        $request = new LoginRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('email', $rules);
        $this->assertArrayHasKey('password', $rules);

        $this->assertContains('required', $rules['email']);
        $this->assertContains('email', $rules['email']);
        $this->assertContains('required', $rules['password']);
        $this->assertContains('string', $rules['password']);
    }

    public function test_messages_contains_localized_texts(): void
    {
        $request = new LoginRequest();
        $messages = $request->messages();

        $this->assertSame('Email wajib diisi.', $messages['email.required']);
        $this->assertSame('Format email tidak valid.', $messages['email.email']);
        $this->assertSame('Password wajib diisi.', $messages['password.required']);
    }
}
