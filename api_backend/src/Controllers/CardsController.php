<?php
namespace App\Controllers;

class CardsController {
    public static function list(int $userId): void {
        $pdo = db();
        $stmt = $pdo->prepare('SELECT id, provider, masked_number, exp_month, exp_year, status, created_at FROM cards WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$userId]);
        json_response(['items' => $stmt->fetchAll()]);
    }

    // Demo segura: solo enmascarado
    public static function create(int $userId): void {
        $pdo = db();
        $last4 = strval(random_int(1000, 9999));
        $masked = '4111 11** **** ' . $last4;
        $expMonth = random_int(1, 12);
        $expYear = (int)date('Y') + 4;
        $pdo->prepare('INSERT INTO cards (user_id, provider, masked_number, exp_month, exp_year, status, created_at) VALUES (?, "internal", ?, ?, ?, "ACTIVE", NOW())')
            ->execute([$userId, $masked, $expMonth, $expYear]);
        json_response(['ok' => true]);
    }
}
