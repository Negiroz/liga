<?php
// api/db.php
header("Access-Control-Allow-Origin: *");
// ... (el resto de los headers)

$servername = "localhost";
$username = "root"; // Usuario por defecto de XAMPP
$password = ""; // Contraseña vacía por defecto de XAMPP
$dbname = "liga_sigma"; // Nombre de la base de datos creada
// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}
?>
