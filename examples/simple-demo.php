<?php
    require("vendor/autoload.php");
    
    use Firebase\JWT\JWT;

    //UID of the service
    $uid = "b9d24419-1ab7-474a-bf97-ec1637ee5f8e";

    //Json Web Token
    $jwt = $_GET["jwt"];

    //Check if jwt is valid one
    $json = file_get_contents("http://localhost/CAS-Enabler/web/app_dev.php/~vrasquie/cas/api/service/$uid/token/$jwt");
    $result = json_decode($json, true);

    if ($result["status"] && !$result["code"]) {
        //Public rsa key (given by CAS Enabler at the service creation)
        $key = file_get_contents("mykey.pub");
        $publicKey = openssl_pkey_get_public($key);

        try {
            //Stdclass representation of the Json Web Token
            $jwt = JWT::decode($jwt, $publicKey, array('RS256'));
        } catch (Exception $e) {
            //Should never append if you verify token but in case of ...
            return;
        }

        //The information of user is behind a base64 encoding and a rsa crypt
        $usrCrypt = base64_decode($jwt->usr);
        
        //$usrJson = decrypted value of user in json
        $success = openssl_public_decrypt($usrCrypt, $usrJson, $publicKey);

        if ($success) {
            echo $usrJson;
        }
    }
