<?php

namespace App\Services;

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\GD\Driver;
class ImageService
{
    public static function convertToWebp($imagePath, $quality = 80)
    {
        $manager = new ImageManager(new Driver());
        $image = $manager->read($imagePath);
        $encoded = $image->toWebp($quality);
        return $encoded;
    }
}
