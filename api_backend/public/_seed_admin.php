<?php
// api_backend/public/_seed_admin.php
// 1️⃣ SEED del PRIMER ADMIN — ÚSALO UNA SOLA VEZ Y LUEGO BÓRRALO

require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../src/lib/DB.php';

use Lib\DB;

$requiredToken = defined('ADMIN_SEED_TOKEN') ? ADMIN_SEED_TOKEN : null;
$token = $_GET['token'] ?? $_POST['token'] ?? '';

if (!$requiredToken || !$token || !hash_equals($requiredToken, $token)) {
  http_response_code(403);
  echo "Forbidden. Missing/invalid token.";
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $email = trim($_POST['email'] ?? '');
  $pass  = (string)($_POST['password'] ?? '');
  $name  = trim($_POST['displayName'] ?? 'Administrator');
  $reset = isset($_POST['reset']) && $_POST['reset'] === '1';

  if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass) < 8) {
    echo "Email inválido o contraseña muy corta (min 8).";
    exit;
  }

  try {
    $pdo = DB::pdo();
    $pdo->beginTransaction();

    // ¿Existe ya?
    $st = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $st->execute([$email]);
    $row = $st->fetch();

    if (!$row) {
      // Crear directamente como admin
      $hash = password_hash($pass, PASSWORD_DEFAULT);
      $ins = $pdo->prepare('INSERT INTO users (email, password_hash, display_name, role) VALUES (?,?,?, "admin")');
      $ins->execute([$email, $hash, $name ?: null]);
      $userId = (int)$pdo->lastInsertId();
    } else {
      $userId = (int)$row['id'];

      if ($reset) {
        $hash = password_hash($pass, PASSWORD_DEFAULT);
        $upd = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $upd->execute([$hash, $userId]);
      }

      // Promover a admin
      $upd2 = $pdo->prepare("UPDATE users SET role = 'admin' WHERE id = ?");
      $upd2->execute([$userId]);
    }

    $pdo->commit();
    echo "OK: Usuario $email ahora es ADMIN. ✅ Elimina este archivo (_seed_admin.php) YA.";
  } catch (\Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo "Error: " . $e->getMessage();
  }
  exit;
}
?>
<!doctype html>
<html lang="es">
<meta charset="utf-8">
<title>Seed Admin (one-shot)</title>
<body style="font-family: system-ui; max-width: 560px; margin: 40px auto;">
  <h2>Crear primer administrador</h2>
  <p style="color:#b32">Úsalo una sola vez y luego borra el archivo <code>_seed_admin.php</code>.</p>
  <form method="post">
    <input type="hidden" name="token" value="<?= htmlspecialchars($requiredToken ?? '') ?>">
    <div>
      <label>Email</label><br>
      <input name="email" type="email" required style="padding:8px; width:100%;">
    </div>
    <div>
      <label>Contraseña (min 8)</label><br>
      <input name="password" type="password" minlength="8" required style="padding:8px; width:100%;">
    </div>
    <div>
      <label>Nombre a mostrar</label><br>
      <input name="displayName" type="text" style="padding:8px; width:100%;" value="Administrator">
    </div>
    <label style="display:block; margin-top:8px;">
      <input type="checkbox" name="reset" value="1"> Si el usuario existe, <b>resetear contraseña</b>.
    </label>
    <button style="margin-top:12px; padding:10px 16px;">Crear / Promover</button>
  </form>
</body>
</html>
