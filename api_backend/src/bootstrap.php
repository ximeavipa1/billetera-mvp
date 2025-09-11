<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Carga variables desde .env si existe (sin fallar si falta)
$root = dirname(__DIR__);
if (is_file($root.'/.env')) {
  $dotenv = Dotenv::createImmutable($root);
  $dotenv->safeLoad();
}

/**
 * ENV helper: lee primero de $_ENV (Dotenv) y si no, del entorno del proceso (getenv).
 */
function env(string $key, ?string $default = null): ?string {
  $val = $_ENV[$key] ?? getenv($key);
  return ($val === false || $val === null) ? $default : $val;
}

/** Boolean helper para flags en .env (p.ej. APP_DEBUG=true). */
function envBool(string $key, bool $default = false): bool {
  $v = strtolower((string)(env($key, $default ? 'true' : 'false')));
  return in_array($v, ['1','true','on','yes'], true);
}

// Compatibilidad CLI: REQUEST_METHOD puede no existir
if (PHP_SAPI === 'cli' && !isset($_SERVER['REQUEST_METHOD'])) {
  $_SERVER['REQUEST_METHOD'] = 'CLI';
}

// Error reporting
$debug = envBool('APP_DEBUG', false);
ini_set('display_errors', $debug ? '1' : '0');
error_reporting($debug ? E_ALL : (E_ALL & ~E_NOTICE & ~E_DEPRECATED));

/**
 * Conexión DB (PDO MySQL)
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

/**
 * CORS
 * - Soporta CORS_ALLOWED_ORIGINS (CSV) o CORS_ORIGIN (uno solo).
 * - Toma valores de .env o variables exportadas en shell.
 * - Responde correctamente a preflight (OPTIONS).
 */
function cors(): void {
  $reqMethod = $_SERVER['REQUEST_METHOD'] ?? '';
  $origin    = $_SERVER['HTTP_ORIGIN']     ?? '';

  $allowedCsv = env('CORS_ALLOWED_ORIGINS', env('CORS_ORIGIN', '')); // e.g. "https://a.com,https://b.com" o "*"
  $allowed    = array_filter(array_map('trim', explode(',', (string)$allowedCsv)));
  $allowAny   = ($allowedCsv === '*');

  if ($origin && ($allowAny || in_array($origin, $allowed, true))) {
    header('Access-Control-Allow-Origin: ' . ($allowAny ? '*' : $origin));
    header('Vary: Origin');
    // Credenciales solo si no es wildcard
    header('Access-Control-Allow-Credentials: ' . ($allowAny ? 'false' : 'true'));
  }

  header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF');
  header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');

  if ($reqMethod === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}
cors();

/**
 * JSON helpers
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
