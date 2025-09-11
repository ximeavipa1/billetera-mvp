<?php
namespace App\Controllers;

class ConfigController
{
    public static function get(): void
    {
        // Puedes agregar más variables si lo necesitas
        json_response([
            'app_env' => $_ENV['APP_ENV'] ?? 'local',
            'app_url' => $_ENV['APP_URL'] ?? '',
            'cors_allowed_origins' => $_ENV['CORS_ALLOWED_ORIGINS'] ?? '',
            'jwt_ttl_seconds' => (int)($_ENV['JWT_TTL_SECONDS'] ?? 900),
            'refresh_ttl_days' => (int)($_ENV['REFRESH_TTL_DAYS'] ?? 7),
            'admin_email' => $_ENV['ADMIN_SEED_EMAIL'] ?? '',
            'features' => [
                'qr_pay' => true,
                'virtual_card' => true,
                'withdrawal' => true,
                'notifications' => true,
            ],
        ]);
    }
}