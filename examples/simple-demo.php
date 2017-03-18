<?php

    $uid = ""; //Secret uid of your service (keep it secret) (given by CAS Enabler at the service creation)
    $jwt = $_GET["jwt"]; //Json Web Token
    $url = "https://perso-etudiant.u-pem.fr/~vrasquie/cas/user";
    $key = file_get_contents("mykey"); //Private rsa key (given by CAS Enabler at the service creation)
    $passphrase = ""; //Chosen passphrase at service creation

    $headers = [
        "service: $uid",
        "token: $jwt"
    ];

    //Get USER
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $json = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($json, true);

    if ($result["status"] && !$result["code"]) {
        $privateKey = openssl_get_privatekey($key, $passphrase);

        //User's information are behind a base64 encoding and RSA crypt
        $usrCrypt = base64_decode($result["data"]);
        
        if (openssl_private_decrypt($usrCrypt, $usrJson, $privateKey)) {
            echo($usrJson);
            return;
        }

        echo("Error");
        return;
    }

    echo($json);
