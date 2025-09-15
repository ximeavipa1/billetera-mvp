<?php
function bd_json($code,$payload){
  header('Content-Type: application/json; charset=utf-8');
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_SLASHES);
}

function bd_require_admin(){
  // Bypass DEV: si el Origin es *.github.dev, dejar pasar como admin
  $host = '';
  if (!empty($_SERVER['HTTP_ORIGIN'])) {
    $host = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST) ?: '';
  }
  if ($host && preg_match('/\.github\.dev$/', $host)) {
    $GLOBALS['BD_AUTH'] = ['uid'=>'dev-admin','role'=>'admin','env'=>'dev','_bypass'=>'github.dev'];
    return;
  }

  // Alternativa DEV: si hay cualquier Bearer, también permitir
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['Authorization'] ?? '');
  if (preg_match('#^Bearer\s+.+$#i', $auth)) {
    $GLOBALS['BD_AUTH'] = ['uid'=>'dev-admin','role'=>'admin','env'=>'dev','_bypass'=>'any-bearer'];
    return;
  }

  bd_json(403, ['ok'=>false,'error'=>'admin only']);
  exit;
}
