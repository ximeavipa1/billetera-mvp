<?php

// Frontend permitido (ajusta en Codespaces/producción)
define('CORS_ORIGIN', getenv('CORS_ORIGIN') ?: 'http://localhost:5173');

// DB desde env vars con fallback local
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'billetera');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// Secreto de la app para firmar JWT (cámbialo en prod!)
define('APP_SECRET', getenv('APP_SECRET') ?: 'change-me-super-secret');

// Logging de errores (solo DEV)
if (getenv('APP_ENV') !== 'prod') {
  ini_set('display_errors', 1);
  ini_set('display_startup_errors', 1);
  error_reporting(E_ALL);
}
