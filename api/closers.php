<?php
// api/closers.php
include 'db.php';
session_start();

$upload_dir = __DIR__ . '/../uploads/closers/'; // Ruta absoluta para la carpeta de subidas

function handle_photo_upload($file_input_name, $current_photo_url = null) {
    global $upload_dir;
    if (isset($_FILES[$file_input_name]) && $_FILES[$file_input_name]['error'] === UPLOAD_ERR_OK) {
        $file_tmp_name = $_FILES[$file_input_name]['tmp_name'];
        $file_name = basename($_FILES[$file_input_name]['name']);
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        $allowed_ext = ['jpg', 'jpeg', 'png', 'gif'];

        if (!in_array($file_ext, $allowed_ext)) {
            return ["error" => "Tipo de archivo no permitido."];
        }

        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        $new_file_name = uniqid('closer_', true) . '.' . $file_ext;
        $destination = $upload_dir . $new_file_name;

        if (move_uploaded_file($file_tmp_name, $destination)) {
            if ($current_photo_url && strpos($current_photo_url, 'placehold.co') === false) {
                $old_photo_path = __DIR__ . '/../' . $current_photo_url;
                if (file_exists($old_photo_path)) {
                    unlink($old_photo_path);
                }
            }
            return ["success" => str_replace('\\', '/', str_replace(__DIR__ . '/../', '', $destination))];
        } else {
            return ["error" => "Error al mover el archivo subido."];
        }
    }
    return ["success" => $current_photo_url];
}


$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        header('Content-Type: application/json');
        $sql = "SELECT * FROM closers ORDER BY name ASC";
        $result = $conn->query($sql);
        $closers = [];
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $closers[] = $row;
            }
        }
        echo json_encode($closers);
        break;

    case 'POST':
        header('Content-Type: application/json');
        $name = $_POST['name'] ?? null;
        $action = $_POST['action'] ?? null;
        $id = $_POST['id'] ?? null;

        if ($action === 'update') {
            $current_photo_url = null;
            if ($id) {
                $stmt_select = $conn->prepare("SELECT photoUrl FROM closers WHERE id = ?");
                $stmt_select->bind_param("i", $id);
                $stmt_select->execute();
                $result_select = $stmt_select->get_result();
                if ($row = $result_select->fetch_assoc()) {
                    $current_photo_url = $row['photoUrl'];
                }
                $stmt_select->close();
            }

            $photo_upload_result = handle_photo_upload('photo', $current_photo_url);
            if (isset($photo_upload_result['error'])) {
                http_response_code(400);
                echo json_encode(["error" => $photo_upload_result['error']]);
                exit();
            }
            $photoUrl = $photo_upload_result['success'];

            $stmt = $conn->prepare("UPDATE closers SET name = ?, photoUrl = ? WHERE id = ?");
            $stmt->bind_param("ssi", $name, $photoUrl, $id);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Closer actualizado"]);
            } else {
                echo json_encode(["error" => $stmt->error]);
            }

        } else {
            $photo_upload_result = handle_photo_upload('photo');
            if (isset($photo_upload_result['error'])) {
                http_response_code(400);
                echo json_encode(["error" => $photo_upload_result['error']]);
                exit();
            }
            $photoUrl = $photo_upload_result['success'];

            $stmt = $conn->prepare("INSERT INTO closers (name, photoUrl) VALUES (?, ?)");
            $stmt->bind_param("ss", $name, $photoUrl);

            if ($stmt->execute()) {
                echo json_encode(["message" => "Closer añadido exitosamente", "id" => $conn->insert_id]);
            } else {
                echo json_encode(["error" => "Error: " . $stmt->error]);
            }
        }
        $stmt->close();
        break;

    case 'DELETE':
        header('Content-Type: application/json');
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            $stmt_select = $conn->prepare("SELECT photoUrl FROM closers WHERE id = ?");
            $stmt_select->bind_param("i", $id);
            $stmt_select->execute();
            $result_select = $stmt_select->get_result();
            $photo_to_delete = null;
            if ($row = $result_select->fetch_assoc()) {
                $photo_to_delete = $row['photoUrl'];
            }
            $stmt_select->close();

            $stmt = $conn->prepare("DELETE FROM closers WHERE id = ?");
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) {
                if ($photo_to_delete && strpos($photo_to_delete, 'placehold.co') === false) {
                    if (file_exists(__DIR__ . '/../' . $photo_to_delete)) {
                        unlink(__DIR__ . '/../' . $photo_to_delete);
                    }
                }
                echo json_encode(["message" => "Closer eliminado exitosamente"]);
            } else {
                echo json_encode(["error" => "Error: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["error" => "No ID provided"]);
        }
        break;
}

$conn->close();
?>