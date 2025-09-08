<?php
declare(strict_types=1);

define('ROOT', dirname(__DIR__));
define('STORAGE', ROOT . '/storage');
define('CONFIG',  ROOT . '/config');

spl_autoload_register(function($class){
  $prefix = 'Lib\\';
  if (str_starts_with($class, $prefix)) {
    $path = __DIR__.'/lib/'.substr($class, strlen($prefix)).'.php';
    if (file_exists($path)) require_once $path;
  }
});
