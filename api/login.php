<?php
include 'db.php';
session_start();

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'];
$password_input = $data['password'];

$stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    
    if (password_verify($password_input, $user['password'])) {
        $login_success = true;
    } else {
        $login_success = false;
    }

    if ($login_success) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        echo json_encode(["success" => true, "user" => ["username" => $user['username'], "role" => $user['role']]]);
    } else {
        echo json_encode(["success" => false, "message" => "Contraseña incorrecta."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Usuario no encontrado."]);
}
$stmt->close();
$conn->close();
?>