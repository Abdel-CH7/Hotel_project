<?php

namespace App\Support;

final class EquipmentLocationName
{
    public static function extractRoomNumber(mixed $name): ?string
    {
        $name = trim((string) $name);

        if (! preg_match('/^chambre\s+(.+?)$/iu', $name, $matches)) {
            return null;
        }

        $roomNumber = trim($matches[1]);

        return $roomNumber !== '' ? $roomNumber : null;
    }

    public static function isRoomLike(mixed $name): bool
    {
        return preg_match('/\bchambre\b/iu', trim((string) $name)) === 1;
    }

    public static function hasNumericRoomReference(mixed $name): bool
    {
        return self::isRoomLike($name) && preg_match('/\d/u', (string) $name) === 1;
    }

    public static function isNumericRoomEmplacement(mixed $name): bool
    {
        $roomNumber = self::extractRoomNumber($name);

        return $roomNumber !== null && preg_match('/\d/u', $roomNumber) === 1;
    }
}
