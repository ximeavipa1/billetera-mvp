<?php
// CORS dinámico para *.app.github.dev y localhost
// Debe incluirse ANTES de cualquier salida

if (!function_exists('bd_allow_origin')) {
    function bd_allow_origin(string $origin): bool {
        if (preg_match('#^https://[-a-z0-9]+-(5173|8081)\.app\.github\.dev$#', $origin)) return true;
        if (preg_match('#^https?://localhost(:\d{2,5})?$#', $origin)) return true;
        return false;
    }
}

if (!function_exists('bd_apply_cors')) {
    function bd_apply_cors(): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin && bd_allow_origin($origin)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        } else {
            header('Access-Control-Allow-Origin: *');
        }
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
        header('Access-Control-Max-Age: 86400');
    }
}

bd_apply_cors();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
