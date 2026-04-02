<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
    <h2>Reset Your Password</h2>

    <p>Hello {{ $user->profile->first_name ?? 'Scholarz user' }},</p>

    <p>We received a request to reset your ScholarzPath password. Click the button below to continue:</p>

    <p>
        <a href="{{ $resetUrl }}" style="display: inline-block; background: #1f4a7c; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 6px;">
            Reset Password
        </a>
    </p>

    <p>If the button does not work, copy this link:</p>
    <p><a href="{{ $resetUrl }}">{{ $resetUrl }}</a></p>

    <p>Security note: This reset token expires in 60 minutes.</p>

    <p>If you did not request this, you can ignore this email.</p>
</body>
</html>
