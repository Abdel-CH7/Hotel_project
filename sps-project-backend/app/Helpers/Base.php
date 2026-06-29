<?php

namespace App\Helpers;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;


class Base
{

    public static function constants()
    {
        //"sudo -u web1 "
        if (DIRECTORY_SEPARATOR === '/') {
            $slash = '/';
            $also = ';';
        } else {
            $slash = '\\';
            $also = ' && ';
        };
    }

    public static function numberGenerator($nb)
    {
        return substr(str_shuffle("13123456789"), 0, $nb);
    }

    public static function alphaGenerator($nb)
    {
        return substr(str_shuffle("abcdefghijklmnopqrstuvwxyz"), 0, $nb);
    }

    public static function alphaNumGenerator($nb)
    {
        return substr(str_shuffle("abcdefghijklmnopqrstuvwxyz0123456789"), 0, $nb);
    }

    public static function humainTime($time)
    {
        return $time->diffForHumans();
    }

    public static function timeNow()
    {
        $mytime = \Carbon\Carbon::now();
        return $mytime->toDateTimeString();
    }

    public static function putImages($folder, $image, $ext)
    {
        $imgName = [];

        function traitPutImages($folder, $image, $ext)
        {
            @list($type, $file_data) = explode(';', $image);
            @list(, $file_data) = explode(',', $image);
            // $imageName = AppHelper::timeNow().'_'.Str::random(15).$ext;
            $imageName = Str::random(50) . '.' . $ext;
            Storage::put('public/' . $folder . '/' . $imageName, base64_decode($file_data));
            return $folder . '/' . $imageName;
        }

        //if($image && base64_decode($image, true) !== false){
        if (is_array($image) && sizeof($image) > 0) {
            foreach ($image as $key => $value) {
                $imgName[$key] =  traitPutImages($folder, $value, $ext);
            }
        } elseif ($image) {
            $imgName[0] = traitPutImages($folder, $image, $ext);
        }
        return  $imgName;
    }

    function formatsizeUnits($bytes)
    {
        switch ($bytes) {
            case $bytes < 1024:
                $size = $bytes . ' B';
                break;
            case $bytes < 1048576:
                $size = round($bytes / 1024, 2) . ' KB';
                break;
            case $bytes < 1073741824:
                $size = round($bytes / 1048576, 2) . ' MB';
                break;
            case $bytes < 1099511627776:
                $size = round($bytes / 1073741824, 2) . ' GB';
                break;
        }
        return $size;
    }

    public static function getFileSize($url)
    {
        $result = -1;  // Assume failure.
        // Issue a HEAD request and follow any redirects.
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_NOBODY, true);
        curl_setopt($curl, CURLOPT_HEADER, true);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_REFERER, '');
        //curl_setopt($curl, CURLOPT_INTERFACE, '');
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, FALSE);
        curl_setopt($curl, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
        curl_exec($curl);
        if (curl_errno($curl) == 0) {
            $result = (int)curl_getinfo($curl, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
        }
        curl_close($curl);
        if ($result > 1) {
            return $result;
        } else {
            return null;
        }
    }

    public static function cleanStr($str)
    {
        return html_entity_decode(strip_tags($str), ENT_QUOTES, 'UTF-8');
    }

    public static function subStrWords($str, $nb)
    {
        $pieces = explode(" ", $str);
        return implode(" ", array_splice($pieces, 0, $nb));
    }

    public static function getStringBetween($string, $start, $end)
    {
        $string = ' ' . $string;
        $ini = strpos($string, $start);
        if ($ini == 0) return '';
        $ini += strlen($start);
        $len = strpos($string, $end, $ini) - $ini;
        return substr($string, $ini, $len);
    }

    public static function validationCheckJson($validator)
    {
        $messages =  $validator->errors();
        $message  =  $messages->first();
        $response = [
            'status' => 'Error',
            'message' => $message,
            'data' => null,
        ];
        throw new HttpResponseException(response()->json($response, 400));
    }

    public static function validationCheck($validator)
    {
        if ($validator->fails()) {

            $messages =  $validator->errors();
            $message  =  $messages->first();
            $response = [
                'status' => 'Error',
                'message' => $message,
                'data' => null,
            ];
            throw new HttpResponseException(response()->json($response, 400));
        }
    }

    public static function getClientIp()
    {
        // Function to get the client IP address
        $ipaddress = '';
        if (isset($_SERVER['HTTP_CLIENT_IP']))
            $ipaddress = $_SERVER['HTTP_CLIENT_IP'];
        else if (isset($_SERVER['HTTP_X_FORWARDED_FOR']))
            $ipaddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
        else if (isset($_SERVER['HTTP_X_FORWARDED']))
            $ipaddress = $_SERVER['HTTP_X_FORWARDED'];
        else if (isset($_SERVER['HTTP_FORWARDED_FOR']))
            $ipaddress = $_SERVER['HTTP_FORWARDED_FOR'];
        else if (isset($_SERVER['HTTP_FORWARDED']))
            $ipaddress = $_SERVER['HTTP_FORWARDED'];
        else if (isset($_SERVER['REMOTE_ADDR']))
            $ipaddress = $_SERVER['REMOTE_ADDR'];
        else
            $ipaddress = 'UNKNOWN';
        return $ipaddress;
    }

    public static function serverIpAddress($withPort = true)
    {
        $withPort ? $port = ":8000" : '';
        $localIP = 'http://' . getHostByName(getHostName()) . $port;
        return $localIP;
    }
}
