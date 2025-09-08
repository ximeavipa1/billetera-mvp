<?php
namespace Lib;

class JsonStore {
  private $base;

  public function __construct($basePath){
    $this->base = rtrim($basePath, '/');
  }

  private function file($name){
    return "{$this->base}/{$name}.json";
  }

  public function read($name, $default = []){
    $f = $this->file($name);
    if (!file_exists($f)) return $default;
    $raw = file_get_contents($f);
    $data = json_decode($raw, true);
    return $data ?: $default;
  }

  public function write($name, $data){
    $f = $this->file($name);
    file_put_contents($f, json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
  }
}
