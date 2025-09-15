<?php
require __DIR__ . '/cors.php';
@include_once __DIR__ . '/../vendor/autoload.php';

use App\Controllers\ConfigController;
use App\Controllers\ProfileController;

function json_response(int $code, array $payload): void {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
}

// Helpers JWT (HS256) sin dependencias
function b64url(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function create_jwt(array $claims, string $secret): string {
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $segments = [ b64url(json_encode($header)), b64url(json_encode($claims)) ];
    $sig = hash_hmac('sha256', implode('.', $segments), $secret, true);
    $segments[] = b64url($sig);
    return implode('.', $segments);
}

// Manejadores de errores (para no perder CORS)
set_exception_handler(function (Throwable $e) {
    json_response(500, ['ok' => false, 'error' => 'UnhandledException', 'message' => $e->getMessage()]);
});
set_error_handler(function ($severity, $message, $file, $line) {
    json_response(500, ['ok' => false, 'error' => 'RuntimeError', 'message' => $message, 'at' => basename($file) . ':' . $line]);
    return true;
});
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        json_response(500, ['ok' => false, 'error' => 'FatalError', 'message' => $err['message']]);
    }
});

$path = rtrim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// /config (GET público, sin DB)
if ($path === '/config' && $method === 'GET') {
    try {
        $ctrl = new ConfigController();
        $config = $ctrl->get();
        json_response(200, ['ok' => true, 'config' => $config]);
    } catch (Throwable $e) {
        if (method_exists(ConfigController::class, 'defaults')) {
            json_response(200, ['ok' => true, 'source' => 'defaults', 'config' => ConfigController::defaults()]);
        } else {
            json_response(200, ['ok' => true, 'source' => 'defaults', 'config' => [
                'service_name' => 'Billetera Digital',
                'fiat_currency' => 'BOB',
                'exchange_rate_bob_usd' => 6.86,
                'fees' => ['paypal_pct' => 8, 'binance_pct' => 2],
                'withdrawal' => ['min_bob' => 5],
                'card' => ['price_usd' => 1, 'validity_days' => 30, 'stock' => 0],
                'sources' => ['paypal','binance','facebook','tiktok'],
            ]]);
        }
    }
    exit;
}

// /auth/dev-admin (POST) — SOLO DEV
if ($path === '/auth/dev-admin' && $method === 'POST') {
    $secret = getenv('JWT_SECRET') ?: 'dev-secret';
    $now = time();
    $claims = [
        'iss' => 'billetera-mvp',
        'sub' => 'dev-admin',
        'uid' => 'dev-admin',
        'role' => 'admin',
        'iat' => $now,
        'exp' => $now + 3600,
        'env' => 'dev',
    ];
    $token = create_jwt($claims, $secret);
    json_response(200, ['ok' => true, 'token' => $token, 'role' => 'admin', 'exp' => $claims['exp']]);
    exit;
}

// /profile (GET/POST) con Bearer
if ($path === '/profile') {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('#^Bearer\s+(.+)$#i', $auth, $m)) {
        json_response(401, ['ok' => false, 'error' => 'Unauthorized']);
        exit;
    }
    $token = $m[1];
    $p = new ProfileController();
    if ($method === 'GET') {
        json_response(200, ['ok' => true, 'profile' => $p->get($token)]);
        exit;
    }
    if ($method === 'POST') {
        json_response(200, ['ok' => true, 'profile' => $p->update($token, $_POST, $_FILES)]);
        exit;
    }
    json_response(405, ['ok' => false, 'error' => 'MethodNotAllowed']);
    exit;
}

// Pasarela a endpoints legacy admin
if ($path === '/admin/config') {
    require __DIR__ . '/admin/config.php';
    exit;
}
if ($path === '/admin/requests') {
    require __DIR__ . '/admin/requests.php';
    exit;
}

// 404 por defecto
json_response(404, ['ok' => false, 'error' => 'NotFound', 'path' => $path]);
exit;
