<?php
// src/migrate.php
require_once __DIR__ . '/lib/DB.php';

use Lib\DB;

$db = DB::pdo();

// USERS
$db->exec("
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

// CONFIG (guarda JSON con rates/fees/channels/payout)
$db->exec("
CREATE TABLE IF NOT EXISTS app_config (
  id TINYINT PRIMARY KEY,
  payload JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

// REQUESTS (retiros / intercambios)
$db->exec("
CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  source VARCHAR(32) NOT NULL,
  target VARCHAR(32) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  fee_pct DECIMAL(5,2) NOT NULL,
  status ENUM('pending','released','rejected') DEFAULT 'pending',
  proof TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

echo "OK: tablas creadas/actualizadas";
