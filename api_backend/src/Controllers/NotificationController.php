<?php
namespace App\Controllers;

class NotificationController {
    public static function list(int $userId): void {
        $pdo = db();
        $rows = $pdo->prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100');
        $rows->execute([$userId]);
        json_response(['items' => $rows->fetchAll()]);
    }
    public static function markRead(int $userId, int $id): void {
        $pdo = db();
        $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')->execute([$id, $userId]);
        json_response(['ok' => true]);
    }
}
