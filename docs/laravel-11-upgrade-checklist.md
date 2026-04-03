# Laravel 10 to Laravel 11 Upgrade Checklist

This checklist is tailored for the current `backend` dependencies in this repository.

## Current blockers (verified)

- `laravel/framework` is pinned to `^10.10`.
- `laravel/sanctum` is pinned to `^3.3` and only supports `illuminate/*` v9-v10.
- `nunomaduro/collision` v7 conflicts with Laravel 11.
- Symfony packages are currently v6.x, while Laravel 11 requires v7.x.

## Goal

Upgrade backend to Laravel 11 so Sanctum can be upgraded to v4.x (and remove PHP 8.4 deprecation noise from Sanctum v3).

## Pre-upgrade safety

1. Commit/stash current work.
2. Ensure tests pass before upgrade:

```bash
cd backend
php artisan test
```

3. Ensure `.env` values are backed up (especially SMTP/OAuth secrets).

## Step 1: Update composer constraints

In `backend/composer.json`, update:

- `laravel/framework`: `^10.10` -> `^11.0`
- `laravel/sanctum`: `^3.3` -> `^4.0`
- `nunomaduro/collision`: `^7.0` -> `^8.0`

Recommended resulting snippet:

```json
"require": {
  "php": "^8.2",
  "guzzlehttp/guzzle": "^7.2",
  "laravel/framework": "^11.0",
  "laravel/sanctum": "^4.0",
  "laravel/socialite": "^5.12",
  "laravel/tinker": "^2.8"
},
"require-dev": {
  "fakerphp/faker": "^1.23",
  "laravel/pint": "^1.13",
  "laravel/sail": "^1.26",
  "mockery/mockery": "^1.6",
  "nunomaduro/collision": "^8.0",
  "phpunit/phpunit": "^10.5",
  "spatie/laravel-ignition": "^2.8"
}
```

Notes:

- Laravel 11 officially targets newer PHP (8.2+). Keep runtime aligned.
- Exact dev versions may vary; use Composer resolution as source of truth.

## Step 2: Perform dependency upgrade

```bash
cd backend
composer update -W
```

If resolution fails, inspect blockers:

```bash
composer why-not laravel/framework ^11.0
composer why-not laravel/sanctum ^4.0
```

## Step 3: Clear caches and regenerate autoload

```bash
php artisan optimize:clear
composer dump-autoload
```

## Step 4: Verify app boots and migrations still run

```bash
php artisan --version
php artisan migrate:status
php artisan route:list | head -n 30
```

## Step 5: Run automated tests

```bash
php artisan test
php artisan test --filter AuthApiTest
```

## Step 6: Smoke test auth flows manually

1. Register
2. Login
3. Forgot password (email sent)
4. Reset password using link
5. Login with new password
6. Google OAuth callback

## Step 7: Remove temporary/deprecated workarounds if any

- If any local deprecation-suppression hacks were added, remove them once Sanctum 4 + Laravel 11 are stable.

## Rollback plan

If upgrade fails and blocks demo:

1. Revert `composer.json` and `composer.lock`.
2. Run:

```bash
composer install
php artisan optimize:clear
php artisan test --filter AuthApiTest
```

3. Continue on Laravel 10 branch and retry upgrade in dedicated branch.

## Suggested branching

```bash
git checkout -b chore/upgrade-laravel11
```

Keep upgrade isolated from feature work.
