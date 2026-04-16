<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        // Render all exceptions as JSON for API requests
        $this->renderable(function (Throwable $e, Request $request): ?JsonResponse {
            if (! $request->expectsJson() && ! $request->is('api/*')) {
                return null;
            }

            return $this->renderApiException($e);
        });
    }

    /**
     * Convert an exception into a standardized JSON API response.
     */
    private function renderApiException(Throwable $e): JsonResponse
    {
        // Validation errors — 422
        if ($e instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'error'   => [
                    'code'    => 'VALIDATION_FAILED',
                    'message' => 'The given data was invalid.',
                    'details' => $e->errors(),
                ],
                'data'    => null,
            ], 422);
        }

        // Unauthenticated — 401
        if ($e instanceof AuthenticationException) {
            return response()->json([
                'success' => false,
                'error'   => [
                    'code'    => 'UNAUTHENTICATED',
                    'message' => 'Authentication required. Please log in.',
                    'details' => null,
                ],
                'data'    => null,
            ], 401);
        }

        // Model not found — 404
        if ($e instanceof ModelNotFoundException) {
            $model = class_basename($e->getModel());

            return response()->json([
                'success' => false,
                'error'   => [
                    'code'    => 'NOT_FOUND',
                    'message' => "{$model} not found.",
                    'details' => null,
                ],
                'data'    => null,
            ], 404);
        }

        // Route not found — 404
        if ($e instanceof NotFoundHttpException) {
            return response()->json([
                'success' => false,
                'error'   => [
                    'code'    => 'ROUTE_NOT_FOUND',
                    'message' => 'The requested endpoint does not exist.',
                    'details' => null,
                ],
                'data'    => null,
            ], 404);
        }

        // Other HTTP exceptions (403, 405, etc.)
        if ($e instanceof HttpException) {
            return response()->json([
                'success' => false,
                'error'   => [
                    'code'    => 'HTTP_ERROR',
                    'message' => $e->getMessage() ?: 'An HTTP error occurred.',
                    'details' => null,
                ],
                'data'    => null,
            ], $e->getStatusCode());
        }

        // Generic server error — 500
        $message = app()->hasDebugModeEnabled()
            ? $e->getMessage()
            : 'An unexpected server error occurred.';

        return response()->json([
            'success' => false,
            'error'   => [
                'code'    => 'SERVER_ERROR',
                'message' => $message,
                'details' => app()->hasDebugModeEnabled() ? [
                    'exception' => get_class($e),
                    'file'      => $e->getFile(),
                    'line'      => $e->getLine(),
                ] : null,
            ],
            'data'    => null,
        ], 500);
    }
}

