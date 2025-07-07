<?php
include 'db.php';
header('Content-Type: application/json');
session_start();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT objective_key, objective_value FROM kpi_objectives";
    $result = $conn->query($sql);
    $objectives = [];
    while($row = $result->fetch_assoc()) {
        $objectives[$row['objective_key']] = $row['objective_value'];
    }
    echo json_encode(['success' => true, 'data' => $objectives]);
}

if ($method === 'POST') {
    if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["error" => "Acceso no autorizado."]);
        exit();
    }

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        http_response_code(400);
        echo json_encode(["error" => "No se recibieron datos."]);
        exit();
    }
    
    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("INSERT INTO kpi_objectives (objective_key, objective_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE objective_value = VALUES(objective_value)");
        
        foreach ($data as $key => $value) {
            $stmt->bind_param("ss", $key, $value);
            $stmt->execute();
        }
        $stmt->close();
        $conn->commit();
        echo json_encode(["success" => true, "message" => "Objetivos guardados correctamente."]);

    } catch (mysqli_sql_exception $exception) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["error" => "Falló la actualización de objetivos: " . $exception->getMessage()]);
    }
}

$conn->close();
?>