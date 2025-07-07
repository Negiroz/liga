<?php
// hash_password.php
// Para usar: http://localhost/liga/hash_password.php?password=TU_CONTRASEÑA

$password_input = $_GET['password'] ?? '';

if (empty($password_input)) {
    echo "Por favor, proporciona una contraseña en el parámetro 'password' en la URL.";
} else {
    $hash = password_hash($password_input, PASSWORD_DEFAULT);
    echo "Contraseña: " . htmlspecialchars($password_input) . "<br>";
    echo "Hash Generado: " . htmlspecialchars($hash);
}
?>