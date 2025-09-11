<?php
declare(strict_types=1);

namespace App\Utils;

use Firebase\JWT\JWT as FJWT;
use Firebase\JWT\Key;

class Jwt
{
    private static function secret(): string {
        return getenv('JWT_SECRET') ?: 'change_me_dev_secret';
    }

    private static function ttl(): int {
        return (int)(getenv('JWT_TTL_SECONDS') ?: 900); // 15 min
    }

    /** Alias requerido por AuthController::issue(): */
    public static function encode(array $payload): string {
        return FJWT::encode($payload, self::secret(), 'HS256');
    }

    /** Emite un access token con datos personalizados */
    public static function issue(array $data, int $ttl = null): string {
        $now = time();
        $ttl = $ttl ?? self::ttl();
        $payload = array_merge([
            'iss'  => getenv('APP_URL') ?: 'http://localhost',
            'iat'  => $now,
            'nbf'  => $now,
            'exp'  => $now + $ttl,
        ], $data);
        return self::encode($payload);
    }

    /** Decodifica y devuelve array asociativo */
    public static function decode(string $jwt): array {
        $obj = FJWT::decode($jwt, new Key(self::secret(), 'HS256'));
        return json_decode(json_encode($obj), true);
    }
}