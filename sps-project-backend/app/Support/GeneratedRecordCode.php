<?php

namespace App\Support;

use Illuminate\Support\Str;
use RuntimeException;

final class GeneratedRecordCode
{
    public static function temporary(string $prefix): string
    {
        return sprintf('__PENDING_%s_%s', $prefix, Str::uuid());
    }

    public static function fromId(string $prefix, int $id): string
    {
        if ($id < 1 || $id > 999999) {
            throw new RuntimeException("La séquence {$prefix} ne peut plus produire un code à six chiffres.");
        }

        return sprintf('%s-%06d', $prefix, $id);
    }
}
