<?php
namespace App\Controllers;

class ConfigController {
    public static function defaults(): array {
        return [
            'service_name' => 'Billetera Digital',
            'fiat_currency' => 'BOB',
            'exchange_rate_bob_usd' => 6.86,
            'fees' => [
                'paypal_pct'  => 8,
                'binance_pct' => 2,
            ],
            'withdrawal' => [
                'min_bob' => 5,
            ],
            'card' => [
                'price_usd'     => 1,
                'validity_days' => 30,
                'stock'         => 0,
            ],
            'sources' => ['paypal','binance','facebook','tiktok'],
        ];
    }

    public function get(): array {
        try {
            // Cuando no hay DB, devolvemos defaults
            if (!class_exists('\\PDO') || empty(getenv('DB_HOST'))) {
                return self::defaults();
            }
            // TODO: consulta real a DB cuando esté disponible
            return self::defaults();
        } catch (\Throwable $e) {
            return self::defaults();
        }
    }
}
