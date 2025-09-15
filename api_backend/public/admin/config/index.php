<?php
// CORS primero (maneja OPTIONS 204 y sale)
require __DIR__ . '/../../cors.php';

$legacy = __DIR__ . '/../config.php';
if (is_file($legacy)) {
    require $legacy;
    exit;
}

header('Content-Type: application/json; charset=utf-8');
http_response_code(501);
echo json_encode(['ok'=>false,'error'=>'NotImplemented','message'=>'Falta public/admin/config.php'], JSON_UNESCAPED_SLASHES);
