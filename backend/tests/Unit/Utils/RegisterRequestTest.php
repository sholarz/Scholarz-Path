<?php

namespace Tests\Unit\Utils;

use App\Modules\Auth\Requests\RegisterRequest;
use Tests\TestCase;

class RegisterRequestTest extends TestCase
{
    public function test_authorize_returns_true(): void
    {
        $request = new RegisterRequest();

        $this->assertTrue($request->authorize());
    }

    public function test_rules_contains_expected_fields(): void
    {
        $request = new RegisterRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('email', $rules);
        $this->assertArrayHasKey('password', $rules);
        $this->assertArrayHasKey('password_confirmation', $rules);
        $this->assertArrayHasKey('name', $rules);
        $this->assertArrayHasKey('first_name', $rules);
        $this->assertArrayHasKey('last_name', $rules);
    }

    public function test_rules_contains_expected_validators(): void
    {
        $request = new RegisterRequest();
        $rules = $request->rules();

        $this->assertContains('required', $rules['email']);
        $this->assertContains('email', $rules['email']);
        $this->assertContains('unique:users,email', $rules['email']);

        $this->assertContains('required', $rules['password']);
        $this->assertContains('string', $rules['password']);
        $this->assertContains('min:8', $rules['password']);
        $this->assertContains('confirmed', $rules['password']);
    }

    public function test_messages_contains_localized_texts(): void
    {
        $request = new RegisterRequest();
        $messages = $request->messages();

        $this->assertArrayHasKey('email.unique', $messages);
        $this->assertArrayHasKey('email.email', $messages);
        $this->assertArrayHasKey('password.min', $messages);
        $this->assertArrayHasKey('password.confirmed', $messages);

        $this->assertSame('Email sudah terdaftar.', $messages['email.unique']);
        $this->assertSame('Format email tidak valid.', $messages['email.email']);
    }
}
