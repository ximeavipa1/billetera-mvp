<?php
// Permite rutas "limpias": /list -> list.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$map = [
  '/list'   => __DIR__ . '/list.php',
  '/create' => __DIR__ . '/create.php',
];

// Si el archivo físico existe, PHP lo sirve.
$file = __DIR__ . $uri;
if (is_file($file)) { return false; }

if (isset($map[$uri])) {
  require $map[$uri];
  return true;
}

// Por defecto, cae en index.php (o 404)
require __DIR__ . '/index.php';
