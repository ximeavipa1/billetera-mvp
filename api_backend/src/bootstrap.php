<?php
declare(strict_types=1);

// --- Autoload & .env ---
require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Carga .env (sin romper si falta)
$root = dirname(__DIR__);
if (is_file($root.'/.env')) {
  $dotenv = Dotenv::createImmutable($root);
  $dotenv->safeLoad();
}

// --- Helpers de ENV (soporta comentarios inline con # y valores por defecto) ---
function env(string $key, $default = null): ?string {
  $val = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
  if ($val === false || $val === null) return $default;
  $val = trim((string)$val);

  // Quitar comentario inline:  VALOR  # comentario
  // (si necesitas # dentro del valor, envuélvelo entre comillas en .env)
  if (strpos($val, '#') !== false) {
    // corta en el primer " #"
    $parts = preg_split('/\s+#/', $val, 2);
    $val = trim($parts[0]);
  }
  return $val;
}

function envBool(string $key, bool $default = false): bool {
  $v = strtolower((string)(env($key, $default ? 'true' : 'false')));
  return in_array($v, ['1','true','on','yes'], true);
}

// --- Compatibilidad CLI: REQUEST_METHOD no existe en CLI ---
if (PHP_SAPI === 'cli' && !isset($_SERVER['REQUEST_METHOD'])) {
  $_SERVER['REQUEST_METHOD'] = 'CLI';
}

// --- Error reporting ---
$debug = envBool('APP_DEBUG', false);
ini_set('display_errors', $debug ? '1' : '0');
error_reporting($debug ? E_ALL : (E_ALL & ~E_NOTICE & ~E_DEPRECATED));

// --- DB connection (PDO MySQL) ---
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

// --- CORS ---
function cors(): void {
  // Sólo aplica en entorno web (no CLI)
  if (PHP_SAPI === 'cli') return;

  // Orígenes permitidos (coma-separados). También aceptamos APP_URL por conveniencia.
  $allowedList = array_filter(array_map('trim', explode(',', (string)env('CORS_ALLOWED_ORIGINS', ''))));
  $appUrl = rtrim((string)env('APP_URL', ''), '/');
  if ($appUrl) $allowedList[] = $appUrl;

  // Normalizar (quitar / final)
  $allowedList = array_map(fn($s) => rtrim($s, '/'), $allowedList);

  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $originNorm = rtrim($origin, '/');

  // Si el origin exacto está permitido, reflejarlo; si '*' está en la lista, permitir todos
  $allowAll = in_array('*', $allowedList, true);
  if ($allowAll || ($origin && in_array($originNorm, $allowedList, true))) {
    header('Access-Control-Allow-Origin: ' . ($allowAll ? '*' : $origin));
    if (!$allowAll) header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
  }

  header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF');
  header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');

  $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
  if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

// Llamar CORS sólo en peticiones web
cors();

// --- JSON helpers ---
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
