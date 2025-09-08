<?php
// NUNCA imprimir nada en env.php (ni espacios antes de <?php)

// CORS: origen del frontend en dev
define('CORS_ORIGIN', 'http://localhost:5173');

// DB (ajústalo cuando subas a HostGator)
define('DB_HOST', 'localhost');
define('DB_NAME', 'cualquier_db');        // tu base actual
define('DB_USER', 'root');                // en local, el que uses
define('DB_PASS', 'amoryamista');                    // en local, el que uses

// Si quieres logs de errores en dev
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);



// === Producción (HostGator) — SOLO cuando subas ===
// define('DB_HOST', 'localhost');
// define('DB_NAME', 'retiros1_wallet_prod');
// define('DB_USER', 'retiros1_wallet_user');
// define('DB_PASS', 'contraA1221');
