<?php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$map = [
  '/list'           => __DIR__ . '/list.php',
  '/create'         => __DIR__ . '/create.php',
  '/auth/register'  => __DIR__ . '/auth/register.php',
  '/auth/login'     => __DIR__ . '/auth/login.php',
  '/me'             => __DIR__ . '/me.php',
  '/config'         => __DIR__ . '/config.php',
];

// Si existe archivo físico, que lo sirva PHP (assets, etc.)
$file = __DIR__ . $uri;
if (is_file($file)) { return false; }

if (isset($map[$uri])) { require $map[$uri]; return true; }
require __DIR__ . '/index.php';
