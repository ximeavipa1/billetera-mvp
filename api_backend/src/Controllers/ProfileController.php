<?php
namespace App\Controllers;

class ProfileController {
    private function publicBase(): string {
        $base = realpath(__DIR__ . '/../../public');
        if (!$base) $base = __DIR__ . '/../../public';
        if (!is_dir($base . '/storage')) @mkdir($base . '/storage', 0775, true);
        if (!is_dir($base . '/storage/qr')) @mkdir($base . '/storage/qr', 0775, true);
        return $base;
    }
    private function privateBase(): string {
        $base = realpath(__DIR__ . '/../../');
        if (!$base) $base = __DIR__ . '/../../';
        if (!is_dir($base . '/storage')) @mkdir($base . '/storage', 0775, true);
        if (!is_dir($base . '/storage/profiles')) @mkdir($base . '/storage/profiles', 0775, true);
        return $base;
    }

    private function decodeUid(string $token): string {
        $secret = getenv('JWT_SECRET') ?: 'dev-secret';
        try {
            if (class_exists('\Firebase\JWT\JWT') && class_exists('\Firebase\JWT\Key')) {
                $decoded = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key($secret, 'HS256'));
                $uid = $decoded->uid ?? $decoded->sub ?? null;
                if ($uid) return (string)$uid;
            }
        } catch (\Throwable $e) {}
        return 'dev';
    }

    private function profilePath(string $uid): string {
        return $this->privateBase() . '/storage/profiles/' . preg_replace('#[^a-zA-Z0-9_-]#', '_', $uid) . '.json';
    }
    private function qrPath(string $uid): string {
        return $this->publicBase() . '/storage/qr/' . preg_replace('#[^a-zA-Z0-9_-]#', '_', $uid) . '.png';
    }

    public function get(string $token): array {
        $uid = $this->decodeUid($token);
        $path = $this->profilePath($uid);
        $qr   = $this->qrPath($uid);
        $data = [
            'uid' => $uid,
            'paypal_email'   => null,
            'binance_wallet' => null,
            'bank_qr_image'  => is_file($qr) ? '/storage/qr/' . basename($qr) : null,
        ];
        if (is_file($path)) {
            $raw = json_decode((string)file_get_contents($path), true);
            if (is_array($raw)) $data = array_merge($data, $raw);
        }
        return $data;
    }

    public function update(string $token, array $post, array $files): array {
        $uid  = $this->decodeUid($token);
        $path = $this->profilePath($uid);
        $qr   = $this->qrPath($uid);

        $paypal  = isset($post['paypal_email']) ? trim((string)$post['paypal_email']) : null;
        $binance = isset($post['binance_wallet']) ? trim((string)$post['binance_wallet']) : null;

        if ($paypal && !filter_var($paypal, FILTER_VALIDATE_EMAIL)) throw new \InvalidArgumentException('paypal_email inválido');
        if ($binance && strlen($binance) < 6) throw new \InvalidArgumentException('binance_wallet inválido');

        if (isset($files['bank_qr_image']) && ($files['bank_qr_image']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            $tmp  = $files['bank_qr_image']['tmp_name'];
            $mime = @mime_content_type($tmp) ?: '';
            if (!in_array($mime, ['image/png','image/jpeg','image/jpg'], true)) throw new \InvalidArgumentException('bank_qr_image debe ser PNG/JPEG');
            $ok = false;
            if (function_exists('imagecreatefromstring') && function_exists('imagepng')) {
                $img = @imagecreatefromstring(@file_get_contents($tmp));
                if ($img) { imagepng($img, $qr); imagedestroy($img); $ok = true; }
            }
            if (!$ok) { @move_uploaded_file($tmp, $qr); }
        }

        $existing = is_file($path) ? json_decode((string)file_get_contents($path), true) : [];
        if (!is_array($existing)) $existing = [];
        $save = array_merge($existing, array_filter([
            'paypal_email'   => $paypal,
            'binance_wallet' => $binance,
            'bank_qr_image'  => is_file($qr) ? '/storage/qr/' . basename($qr) : ($existing['bank_qr_image'] ?? null),
        ], fn($v) => $v !== null));

        file_put_contents($path, json_encode($save, JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT));
        return $this->get($token);
    }
}
