<?php
include 'db.php';
session_start();

// Solo los admins pueden gestionar usuarios
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["error" => "Acceso no autorizado."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $sql = "SELECT id, username, role FROM users";
        $result = $conn->query($sql);
        $users = [];
        while($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        echo json_encode($users);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $username = $data['username'];
        $password = password_hash($data['password'], PASSWORD_DEFAULT); // Encriptación correcta
        $role = $data['role'];

        $stmt = $conn->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $username, $password, $role);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Usuario creado exitosamente."]);
        } else {
            echo json_encode(["success" => false, "error" => $stmt->error]);
        }
        $stmt->close();
        break;

    case 'DELETE':
        $id = $_GET['id'];
        if ($id == $_SESSION['user_id']) { // No permitir que el admin se borre a sí mismo
            echo json_encode(["error" => "No puedes eliminar tu propia cuenta de administrador."]);
            exit();
        }
        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Usuario eliminado."]);
        } else {
            echo json_encode(["error" => $stmt->error]);
        }
        $stmt->close();
        break;
}
$conn->close();
?>