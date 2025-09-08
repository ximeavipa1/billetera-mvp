<?php
namespace Lib;

require_once __DIR__ . '/../../config/env.php';

class DB {
  public static function pdo(): \PDO {
    static $pdo = null;
    if ($pdo) return $pdo;

    $dsn = "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8mb4";
    $opts = [
      \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
      \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
    ];
    $pdo = new \PDO($dsn, DB_USER, DB_PASS, $opts);
    return $pdo;
  }
}
