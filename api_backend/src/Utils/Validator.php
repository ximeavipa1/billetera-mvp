<?php
namespace App\Utils;

class Validator {
    public static function email(string $email): bool {
        return (bool)filter_var($email, FILTER_VALIDATE_EMAIL);
    }
    public static function nonEmpty(string $str, int $min = 1, int $max = 255): bool {
        $len = mb_strlen(trim($str));
        return $len >= $min && $len <= $max;
    }
    public static function decimal($val, float $min = 0.0, ?float $max = null): bool {
        if (!is_numeric($val)) return false;
        $f = (float)$val;
        return !($f < $min || ($max !== null && $f > $max));
    }
    public static function enum(string $val, array $allowed): bool {
        return in_array($val, $allowed, true);
    }
}
