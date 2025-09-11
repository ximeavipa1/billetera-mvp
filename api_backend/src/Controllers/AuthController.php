<?php
namespace App\Controllers;

use App\Utils\Validator;
use App\Utils\Jwt;
use PDO;

class AuthController {
    public static function register(array $body): void {
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $name = trim($body['display_name'] ?? '');

        if (!Validator::email($email) || !Validator::nonEmpty($password, 6, 255)) {
            json_response(['error' => 'Datos inválidos'], 422);
        }

        $pdo = db();
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            json_response(['error' => 'Email ya registrado'], 409);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, display_name, role, status, created_at) VALUES (?, ?, ?, "user", "active", NOW())');
        $stmt->execute([$email, $hash, $name ?: null]);
        $id = (int)$pdo->lastInsertId();

        self::issueTokensAndRespond($id, $email, 'user');
    }

    public static function login(array $body): void {
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $pdo = db();
        $stmt = $pdo->prepare('SELECT id, password_hash, role, status FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        if (!$row || !password_verify($password, $row['password_hash'])) {
            json_response(['error' => 'Credenciales inválidas'], 401);
        }
        if ($row['status'] !== 'active') {
            json_response(['error' => 'Cuenta bloqueada'], 403);
        }
        $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')->execute([$row['id']]);
        self::issueTokensAndRespond((int)$row['id'], $email, $row['role']);
    }

    private static function issueTokensAndRespond(int $userId, string $email, string $role): void {
        $accessTtl = (int)($_ENV['JWT_TTL_SECONDS'] ?? 900);
        $refreshDays = (int)($_ENV['REFRESH_TTL_DAYS'] ?? 7);
        $refreshToken = bin2hex(random_bytes(32));
        $expiresAt = (new \DateTimeImmutable('+' . $refreshDays . ' days'))->format('Y-m-d H:i:s');

        $pdo = db();
        $pdo->prepare('INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (UUID(), ?, ?, ?, NOW())')
            ->execute([$userId, $refreshToken, $expiresAt]);

        // Corregido: pasar array con datos del usuario
        $access = Jwt::issue(['sub' => $userId, 'email' => $email, 'role' => $role], $accessTtl);

        $secure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        setcookie('refresh_token', $refreshToken, [
            'expires' => time() + ($refreshDays * 86400),
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        json_response(['access_token' => $access, 'user' => ['id' => $userId, 'email' => $email, 'role' => $role]]);
    }

    public static function me(int $userId): void {
        $pdo = db();
        $stmt = $pdo->prepare('SELECT id, email, display_name, role, status, created_at, last_login_at FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        if (!$user) json_response(['error' => 'No encontrado'], 404);
        json_response(['user' => $user]);
    }

    public static function refresh(): void {
        $refresh = $_COOKIE['refresh_token'] ?? '';
        if (!$refresh) json_response(['error' => 'Sin refresh token'], 401);

        $pdo = db();
        $stmt = $pdo->prepare('SELECT s.user_id, s.expires_at, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?');
        $stmt->execute([$refresh]);
        $row = $stmt->fetch();
        if (!$row) json_response(['error' => 'Refresh inválido'], 401);
        if (strtotime($row['expires_at']) < time()) json_response(['error' => 'Refresh expirado'], 401);

        $accessTtl = (int)($_ENV['JWT_TTL_SECONDS'] ?? 900);
        // Corregido: pasar array con datos del usuario
        $access = \App\Utils\Jwt::issue(['sub' => (int)$row['user_id'], 'email' => $row['email'], 'role' => $row['role']], $accessTtl);
        json_response(['access_token' => $access]);
    }

    public static function logout(): void {
        $refresh = $_COOKIE['refresh_token'] ?? '';
        if ($refresh) {
            $pdo = db();
            $pdo->prepare('DELETE FROM sessions WHERE token = ?')->execute([$refresh]);
            setcookie('refresh_token', '', time() - 3600, '/');
        }
        json_response(['ok' => true]);
    }

    public static function seedAdmin(): void {
        $email = $_ENV['ADMIN_SEED_EMAIL'] ?? null;
        $pass = $_ENV['ADMIN_SEED_PASSWORD'] ?? null;
        if (!$email || !$pass) json_response(['error' => 'Configura ADMIN_SEED_*'], 500);
        $pdo = db();
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) json_response(['ok' => true, 'message' => 'Admin ya existe']);
        $hash = password_hash($pass, PASSWORD_DEFAULT);
        $pdo->prepare('INSERT INTO users (email, password_hash, display_name, role, status, created_at) VALUES (?, ?, "Admin", "admin", "active", NOW())')->execute([$email, $hash]);
        json_response(['ok' => true, 'message' => 'Admin creado']);
    }
}