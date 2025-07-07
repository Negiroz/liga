<?php
// api/backup_db.php
// VERSIÓN ROBUSTA FINAL - PURE PHP BACKUP SCRIPT

// Incluir la conexión a la base de datos y las credenciales.
// Es importante que este archivo no imprima nada en pantalla.
@include 'db.php'; 

// Iniciar sesión para verificar al usuario
session_start();

// 1. Verificar que el usuario sea un administrador autenticado
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    // Enviar una respuesta JSON clara en caso de no estar autorizado
    header('Content-Type: application/json');
    echo json_encode(["error" => "Acceso no autorizado."]);
    exit();
}

// 2. Obtener la contraseña del cuerpo de la solicitud
$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['password'])) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(["error" => "No se proporcionó la contraseña."]);
    exit();
}
$password_input = $data['password'];
$admin_id = $_SESSION['user_id'];

// 3. Verificar la contraseña del administrador
$stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
$stmt->bind_param("i", $admin_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

$login_success = false;
if ($user) {
    if ($_SESSION['username'] === 'admin' && $password_input === $user['password']) {
        $login_success = true;
    } else if (password_verify($password_input, $user['password'])) {
        $login_success = true;
    }
}

if (!$login_success) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(["error" => "Contraseña de administrador incorrecta."]);
    $conn->close();
    exit();
}

// 4. Lógica de respaldo robusta
try {
    $backup_content = "-- Respaldo de la base de datos para '$dbname' en " . date("Y-m-d H:i:s") . "\n";
    $backup_content .= "-- Servidor: {$servername}\n\n";
    $backup_content .= "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n";
    $backup_content .= "START TRANSACTION;\n";
    $backup_content .= "SET time_zone = \"+00:00\";\n\n";

    $tables = ['closers', 'agentes_campo', 'kpi_entries', 'kpi_entries_campo', 'users'];

    foreach ($tables as $table) {
        $create_table_query = $conn->query('SHOW CREATE TABLE `' . $table . '`');
        if ($create_table_query) {
            $row2 = $create_table_query->fetch_row();
            $backup_content .= "\n--\n-- Estructura para la tabla `$table`\n--\n\n";
            $backup_content .= 'DROP TABLE IF EXISTS `' . $table . '`;' . "\n";
            $backup_content .= $row2[1] . ";\n\n";
            $create_table_query->free_result();
        }

        $data_result = $conn->query('SELECT * FROM `' . $table . '`');
        if ($data_result && $data_result->num_rows > 0) {
            $backup_content .= "--\n-- Volcado de datos para la tabla `$table`\n--\n\n";
            while ($row = $data_result->fetch_assoc()) {
                $fields = array_keys($row);
                $values = array_map(function($value) use ($conn) {
                    if ($value === null) return "NULL";
                    return "'" . $conn->real_escape_string($value) . "'";
                }, array_values($row));
                $backup_content .= 'INSERT INTO `' . $table . '` (`' . implode('`, `', $fields) . '`) VALUES (' . implode(', ', $values) . ');' . "\n";
            }
        }
        $backup_content .= "\n";
    }

    $backup_content .= "COMMIT;\n";

    $backup_file_name = $dbname . '_backup_' . date("Y-m-d-H-i-s") . '.sql';

    // Si todo fue exitoso, enviamos los encabezados y el contenido
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . basename($backup_file_name) . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . strlen($backup_content));
    
    echo $backup_content;

} catch (Exception $e) {
    // Si algo falla, enviamos un error JSON claro.
    if (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(["error" => "Falló el proceso de respaldo.", "details" => $e->getMessage()]);
} finally {
    $conn->close();
    exit();
}
?>
