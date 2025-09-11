<?php

// Frontend permitido (ajusta en Codespaces/producción)
define('CORS_ORIGIN', getenv('CORS_ORIGIN') ?: 'http://localhost:5173');

// DB desde env vars con fallback local
define('DB_HOST', '127.0.0.1');   // fuerza TCP
define('DB_NAME', 'billetera_mvp');
define('DB_USER', 'billetera');
define('DB_PASS', 'billetera123');

// Secreto de la app para firmar JWT (cámbialo en prod!)
define('APP_SECRET', 'una_cadena_larga_segura');

// ✅ Token de seed de admin (para /seed-admin, cámbialo en prod!)
define('ADMIN_SEED_TOKEN', '6ec9b41ced17b277b68c990392ecf352947e01cbfd4b938d8daedb2d61586755');

// Logging de errores (solo DEV)
if (getenv('APP_ENV') !== 'prod') {
  ini_set('display_errors', 1);
  ini_set('display_startup_errors', 1);
  error_reporting(E_ALL);
}
