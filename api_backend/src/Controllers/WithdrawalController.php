<?php
namespace App\Controllers;

use App\Utils\Validator;

class WithdrawalController {
    public static function list(int $userId, array $query, bool $isAdmin): void {
        $pdo = db();
        $page = max(1, (int)($query['page'] ?? 1));
        $limit = min(100, max(1, (int)($query['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = '1=1';
        $params = [];
        if (!$isAdmin) {
            $where .= ' AND w.user_id = ?';
            $params[] = $userId;
        } else if (isset($query['user_id'])) {
            $where .= ' AND w.user_id = ?';
            $params[] = (int)$query['user_id'];
        }
        if (!empty($query['status'])) {
            $where .= ' AND w.status = ?';
            $params[] = $query['status'];
        }

        $total = $pdo->prepare("SELECT COUNT(*) AS c FROM withdrawals w WHERE $where");
        $total->execute($params);
        $count = (int)$total->fetch()['c'];

        $stmt = $pdo->prepare("SELECT w.*, u.email FROM withdrawals w JOIN users u ON u.id = w.user_id WHERE $where ORDER BY w.created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        json_response(['items' => $rows, 'page' => $page, 'limit' => $limit, 'total' => $count]);
    }

    public static function create(int $userId, array $body): void {
        $provider = $body['source_provider'] ?? '';
        $dest = $body['dest'] ?? '';
        $amount = $body['amount_usd'] ?? 0;
        $qrPayload = $body['qr_payload'] ?? null;
        $qrImagePath = $body['qr_image_path'] ?? null;

        if (!Validator::enum($provider, ['paypal','binance','facebook','tiktok'])) {
            json_response(['error' => 'Proveedor inválido'], 422);
        }
        if (!Validator::enum($dest, ['BOB_QR','BINANCE','CARD'])) {
            json_response(['error' => 'Destino inválido'], 422);
        }
        if (!Validator::decimal($amount, 5.0, 10000.0)) {
            json_response(['error' => 'Monto inválido (min 5)'], 422);
        }

        // Fees & rates
        $pdo = db();
        $cfg = $pdo->query("SELECT `key`, `value` FROM config WHERE `key` IN ('rates','fees')")->fetchAll();
        $rates = ['usd_bob' => 6.96, 'usd_usdt' => 1.00];
        $fees = ['withdraw_pct' => 2.5, 'withdraw_min' => 1.0];
        foreach ($cfg as $c) {
            if ($c['key'] === 'rates') $rates = array_merge($rates, json_decode($c['value'], true) ?? []);
            if ($c['key'] === 'fees') $fees = array_merge($fees, json_decode($c['value'], true) ?? []);
        }

        $fee_amount = max(round($amount * ($fees['withdraw_pct'] / 100), 2), (float)$fees['withdraw_min']);
        $net_amount = round($amount - $fee_amount, 2);

        $stmt = $pdo->prepare('INSERT INTO withdrawals (user_id, source_provider, dest, amount_usd, fee_pct, fee_amount, net_amount, status, qr_image_path, qr_payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, "PENDIENTE", ?, ?, NOW())');
        $stmt->execute([$userId, $provider, $dest, $amount, (float)$fees['withdraw_pct'], $fee_amount, $net_amount, $qrImagePath, $qrPayload]);
        $id = (int)$pdo->lastInsertId();

        $pdo->prepare('INSERT INTO notifications (user_id, channel, title, body, created_at) VALUES (?, "inapp", ?, ?, NOW())')
            ->execute([$userId, 'Retiro creado', 'Tu retiro #' . $id . ' está pendiente de aprobación.']);

        json_response(['id' => $id, 'status' => 'PENDIENTE', 'fee_amount' => $fee_amount, 'net_amount' => $net_amount], 201);
    }

    public static function updateStatus(int $adminId, int $id, array $body): void {
        $status = $body['status'] ?? '';
        $reason = $body['rejection_reason'] ?? null;
        if (!in_array($status, ['PAGADO','RECHAZADO'], true)) {
            json_response(['error' => 'Estado inválido'], 422);
        }
        $pdo = db();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('SELECT user_id FROM withdrawals WHERE id = ? FOR UPDATE');
            $stmt->execute([$id]);
            $w = $stmt->fetch();
            if (!$w) { $pdo->rollBack(); json_response(['error' => 'No encontrado'], 404); }

            $pdo->prepare('UPDATE withdrawals SET status = ?, approved_by = ?, approved_at = NOW(), rejection_reason = ? WHERE id = ?')
                ->execute([$status, $adminId, $reason, $id]);

            $title = $status === 'PAGADO' ? 'Retiro aprobado' : 'Retiro rechazado';
            $bodyText = $status === 'PAGADO' ? 'Tu retiro ha sido aprobado y pagado.' : ('Tu retiro fue rechazado: ' . ($reason ?? 'Sin motivo'));
            $pdo->prepare('INSERT INTO notifications (user_id, channel, title, body, created_at) VALUES (?, "inapp", ?, ?, NOW())')
                ->execute([(int)$w['user_id'], $title, $bodyText]);

            $pdo->commit();
            json_response(['ok' => true]);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            json_response(['error' => 'Error interno'], 500);
        }
    }
}
