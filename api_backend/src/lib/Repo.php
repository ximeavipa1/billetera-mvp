<?php
namespace Lib;

require_once __DIR__ . '/JsonStore.php';
require_once __DIR__ . '/DB.php';

class Repo {
  private $json;
  private $pdo;

  public function __construct() {
    if (defined('USE_DB') && USE_DB) {
      $this->pdo = DB::pdo();
    } else {
      $this->json = new JsonStore(__DIR__ . '/../../storage');
    }
  }

  public function getConfig() {
    if ($this->pdo) {
      // ...leer de app_config
    } else {
      return $this->json->read('config', []); // archivo: storage/config.json
    }
  }

  public function saveConfig($payload) {
    if ($this->pdo) {
      // ...guardar en app_config
    } else {
      $this->json->write('config', $payload);
    }
  }

  public function listRequests($userId) {
    if ($this->pdo) {
      // SELECT ...
    } else {
      $all = $this->json->read('requests', []);
      return array_values(array_filter($all, fn($r)=>$r['user_id']==$userId));
    }
  }

  public function createRequest($userId, $payload) {
    if ($this->pdo) {
      // INSERT ...
    } else {
      $all = $this->json->read('requests', []);
      $id = count($all) ? max(array_column($all,'id'))+1 : 1;
      $row = [
        'id'=>$id,
        'user_id'=>$userId,
        'source'=>$payload['from'] ?? '',
        'target'=>$payload['to'] ?? '',
        'amount'=>floatval($payload['amount'] ?? 0),
        'fee_pct'=>floatval($payload['fee_pct'] ?? 0),
        'status'=>'pending',
        'proof'=>$payload['proof'] ?? '',
        'created_at'=>date('c'),
      ];
      $all[]=$row;
      $this->json->write('requests', $all);
      return $id;
    }
  }

  public function setRequestStatus($id, $status) {
    if ($this->pdo) {
      // UPDATE ...
    } else {
      $all = $this->json->read('requests', []);
      foreach($all as &$r){
        if ($r['id']==$id){ $r['status']=$status; break; }
      }
      $this->json->write('requests', $all);
    }
  }
}
