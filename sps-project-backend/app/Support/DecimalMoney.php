<?php

namespace App\Support;

use InvalidArgumentException;

final class DecimalMoney
{
    public static function toCents(int|float|string $amount): int
    {
        $normalized = is_float($amount)
            ? number_format($amount, 2, '.', '')
            : trim((string) $amount);

        if (!preg_match('/^-?\d+(?:\.\d{1,2})?$/', $normalized)) {
            throw new InvalidArgumentException("Invalid monetary amount: {$normalized}");
        }

        $negative = str_starts_with($normalized, '-');
        $unsigned = ltrim($normalized, '-');
        [$whole, $fraction] = array_pad(explode('.', $unsigned, 2), 2, '');
        $cents = ((int) $whole * 100) + (int) str_pad($fraction, 2, '0');

        return $negative ? -$cents : $cents;
    }

    public static function percentageToHundredths(int|float|string $percentage): int
    {
        return self::toCents($percentage);
    }

    public static function percentageOf(int $amountCents, int $percentageHundredths): int
    {
        return intdiv(($amountCents * $percentageHundredths) + 5000, 10000);
    }

    public static function format(int $cents): string
    {
        $sign = $cents < 0 ? '-' : '';
        $absolute = abs($cents);

        return sprintf('%s%d.%02d', $sign, intdiv($absolute, 100), $absolute % 100);
    }
}
