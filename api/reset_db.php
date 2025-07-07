<?php
// api/reset_db.php
include 'db.php';
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["error" => "Acceso no autorizado."]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$password_input = $data['password'];
$admin_id = $_SESSION['user_id'];

// Obtener la contraseña del admin de la BD
$stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
$stmt->bind_param("i", $admin_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

// Verificar contraseña
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
    echo json_encode(["error" => "Contraseña de administrador incorrecta."]);
    exit();
}

// Lógica para reiniciar (TRUNCATE)
$tables_to_truncate = ['kpi_entries', 'kpi_entries_campo', 'closers', 'agentes_campo'];
$conn->begin_transaction();
try {
    // Desactivar temporalmente las llaves foráneas para permitir el truncado
    $conn->query("SET FOREIGN_KEY_CHECKS=0;");

    foreach ($tables_to_truncate as $table) {
        $conn->query("TRUNCATE TABLE `$table`");
    }
    
    // Reactivar las llaves foráneas
    $conn->query("SET FOREIGN_KEY_CHECKS=1;");
    $conn->commit();
    echo json_encode(["success" => true, "message" => "La base de datos ha sido reiniciada. Los registros de jugadas, closers y agentes han sido eliminados."]);

} catch (mysqli_sql_exception $exception) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["error" => "Falló el reinicio de la base de datos: " . $exception->getMessage()]);
}

$conn->close();
?>