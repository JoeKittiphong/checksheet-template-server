@echo off
set OPENSSL_EXE="C:\Program Files\Git\usr\bin\openssl.exe"
set CERT_DIR=%~dp0certs
set CONF_FILE=%~dp0ssl.conf

if not exist "%CERT_DIR%" mkdir "%CERT_DIR%"

echo Creating OpenSSL Config with SAN...
(
echo [req]
echo default_bits = 2048
echo prompt = no
echo default_md = sha256
echo x509_extensions = v3_req
echo distinguished_name = dn
echo.
echo [dn]
echo C = TH
echo ST = Bangkok
echo L = Bangkok
echo O = Sodick
echo OU = Engineering
echo CN = www.e-checksheet.sodick
echo.
echo [v3_req]
echo subjectAltName = @alt_names
echo.
echo [alt_names]
echo DNS.1 = www.e-checksheet.sodick
echo DNS.2 = e-checksheet.sodick
echo DNS.3 = localhost
echo IP.1 = 127.0.0.1
echo IP.2 = 10.219.238.30
echo IP.3 = 172.18.67.66
) > "%CONF_FILE%"

echo Generating Self-Signed SSL Certificate (with SAN)...
%OPENSSL_EXE% req -x509 -nodes -days 365 -newkey rsa:2048 ^
  -keyout "%CERT_DIR%\server.key" ^
  -out "%CERT_DIR%\server.crt" ^
  -config "%CONF_FILE%"

del "%CONF_FILE%"

echo.
echo Certificate and Key generated in %CERT_DIR%
pause
