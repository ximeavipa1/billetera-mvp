<?php
// api_backend/public/_seed_admin.php
// 1️⃣ SEED de PRIMER ADMIN — ÚSALO UNA SOLA VEZ Y LUEGO BÓRRALO
// Seguridad básica: requiere un token secreto por GET o POST (?token=XXXX)
// Define este token en config/env.php como ADMIN_SEED_TOKEN

require_once __DIR__ . '/../src/lib/bootstrap.php'; // carga env, DB/Auth/Repo, etc.

use Lib\Auth;

$requiredToken = defined('ADMIN_SEED_TOKEN') ? ADMIN_SEED_TOKEN : null;
$token = $_GET['token'] ?? $_POST['token'] ?? '';

if (!$requiredToken || !$token || !hash_equals($requiredToken, $token)) {
  http_response_code(403);
  echo "Forbidden. Missing/invalid token.";
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $email = trim($_POST['email'] ?? '');
  $pass  = trim($_POST['password'] ?? '');
  $name  = trim($_POST['displayName'] ?? 'Administrator');

  if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass) < 8) {
    echo "Email inválido o contraseña muy corta (min 8).";
    exit;
  }

  try {
    // crea usuario normal si no existe y eleva a admin
    $user = Auth::findByEmail($email);
    if (!$user) {
      $userId = Auth::register($email, $pass, $name); // implementa hash con password_hash()
    } else {
      $userId = $user['id'];
      // opcional: reset clave si quieres
      // Auth::setPassword($userId, $pass);
    }
    Auth::setRole($userId, 'admin'); // implementa UPDATE users SET role='admin' WHERE id=?

    echo "OK: Usuario $email ahora es ADMIN. ✅ Elimina este archivo (_seed_admin.php) YA.";
  } catch (\Throwable $e) {
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
    <button style="margin-top:12px; padding:10px 16px;">Crear / Promover</button>
  </form>
</body>
</html>
