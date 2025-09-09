<?php
namespace App\Utils;

use App\Utils\Jwt;
use Firebase\JWT\Key;

class Jwt {
    public static function issue(array $claims, int $ttl): string {
        $payload = $claims + ['iat' => time(), 'exp' => time() + $ttl];
        return JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
    }

    public static function decode(string $token): array {
        return (array)JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
    }
}
