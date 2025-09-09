<?php
namespace App\Controllers;

class FileController {
    public static function uploadQr(int $userId): void {
        if (!isset($_FILES['file'])) {
            json_response(['error' => 'Archivo requerido'], 400);
        }
        $f = $_FILES['file'];
        if ($f['error'] !== UPLOAD_ERR_OK) {
            json_response(['error' => 'Error de subida'], 400);
        }
        $allowed = ['image/png' => 'png', 'image/jpeg' => 'jpg', 'image/webp' => 'webp'];
        $mime = mime_content_type($f['tmp_name']);
        if (!isset($allowed[$mime])) {
            json_response(['error' => 'Tipo no permitido'], 422);
        }
        if ($f['size'] > 5 * 1024 * 1024) {
            json_response(['error' => 'Máximo 5MB'], 413);
        }
        $ext = $allowed[$mime];
        $dir = __DIR__ . '/../../storage/qr';
        if (!is_dir($dir)) mkdir($dir, 0775, true);
        $name = uniqid('qr_', true) . '.' . $ext;
        $path = $dir . '/' . $name;
        move_uploaded_file($f['tmp_name'], $path);

        $publicPath = '/storage/qr/' . $name;
        json_response(['path' => $publicPath]);
    }
}
