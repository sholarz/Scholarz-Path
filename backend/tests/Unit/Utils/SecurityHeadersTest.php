<?php

namespace Tests\Unit\Utils;

use App\Http\Middleware\SecurityHeaders;
use Illuminate\Http\Request;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    public function test_security_headers_are_added_to_response(): void
    {
        $middleware = new SecurityHeaders();
        $request = Request::create('/api/ping', 'GET');

        $response = $middleware->handle($request, function () {
            return response('ok', 200);
        });

        $this->assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
        $this->assertSame('SAMEORIGIN', $response->headers->get('X-Frame-Options'));
        $this->assertSame('1; mode=block', $response->headers->get('X-XSS-Protection'));
        $this->assertSame('strict-origin-when-cross-origin', $response->headers->get('Referrer-Policy'));
        $this->assertNotNull($response->headers->get('Content-Security-Policy'));
    }

    public function test_hsts_header_not_set_in_testing_environment(): void
    {
        $middleware = new SecurityHeaders();
        $request = Request::create('/api/ping', 'GET');

        $response = $middleware->handle($request, function () {
            return response('ok', 200);
        });

        $this->assertNull($response->headers->get('Strict-Transport-Security'));
    }
}
