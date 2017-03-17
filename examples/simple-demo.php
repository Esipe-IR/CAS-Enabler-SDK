<?php
    require("vendor/autoload.php");
    
    use Firebase\JWT\JWT;

    //UID of the service
    $uid = "54f96312-d287-47e8-8113-15dbcd19f533";

    //Json Web Token
    $jwt = $_GET["jwt"];

    //Check if jwt is valid one
    $json = file_get_contents("http://perso-etudiant.u-pem.fr/~vrasquie/cas/api/service/$uid/token/$jwt");
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
            echo(json_encode(array($e->getMessage())));
            return;
        }

        //The information of user is behind a base64 encoding and a rsa crypt
        $usrCrypt = base64_decode($jwt->usr);
        
        //$usrJson = decrypted value of user in json
        $success = openssl_public_decrypt($usrCrypt, $usrJson, $publicKey);

        if ($success) {
            echo($usrJson);
            return;
        }
    }

    echo($result);
