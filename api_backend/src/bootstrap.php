<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Carga .env si existe (modo tolerante)
$root = dirname(__DIR__);
if (is_file($root.'/.env')) {
  $dotenv = Dotenv::createImmutable($root);
  $dotenv->safeLoad();
}

/**
 * Lee variables de entorno: primero $_ENV (Dotenv), luego getenv().
 */
function env(string $key, ?string $default = null): ?string {
  $val = $_ENV[$key] ?? getenv($key);
  return ($val === false || $val === null) ? $default : $val;
}

/** Convierte flags tipo "true/1/on/yes" a booleano. */
function envBool(string $key, bool $default = false): bool {
  $v = strtolower((string)(env($key, $default ? 'true' : 'false')));
  return in_array($v, ['1','true','on','yes'], true);
}

// Compatibilidad CLI: REQUEST_METHOD puede no existir
if (PHP_SAPI === 'cli' && !isset($_SERVER['REQUEST_METHOD'])) {
  $_SERVER['REQUEST_METHOD'] = 'CLI';
}

// Error reporting según APP_DEBUG
$debug = envBool('APP_DEBUG', false);
ini_set('display_errors', $debug ? '1' : '0');
error_reporting($debug ? E_ALL : (E_ALL & ~E_NOTICE & ~E_DEPRECATED));

/**
 * Conexión PDO MySQL singleton.
 */
function db(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    $host = env('DB_HOST', '127.0.0.1');
    $port = env('DB_PORT', '3306');
    $name = env('DB_NAME', 'billetera_mvp');
    $user = env('DB_USER', 'billetera');
    $pass = env('DB_PASS', '');

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name);
    $pdo = new PDO($dsn, $user, $pass, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  }
  return $pdo;
}

// CORS (bloque solicitado, tal cual)
function cors(): void {
    $allowed = array_values(array_filter(array_map('trim', explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? ''))));
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';

    $allowAll = (count($allowed) === 1 && $allowed[0] === '*');

    if ($allowAll && !$origin) {
        // Sin origin: permite * (sin credenciales)
        header('Access-Control-Allow-Origin: *');
    } elseif ($origin && ($allowAll || in_array($origin, $allowed, true))) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
    }

    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
cors();

/**
 * JSON helpers.
 */
function json_input(): array {
  $input = file_get_contents('php://input');
  return $input ? (json_decode($input, true) ?: []) : [];
}

function json_response($data, int $status = 200): void {
  header('Content-Type: application/json; charset=utf-8');
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}
