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

        $new_file_name = uniqid('closer_', true) . '.' . $file_ext;
        $destination = $upload_dir . $new_file_name;

        if (move_uploaded_file($file_tmp_name, $destination)) {
            // Eliminar la foto anterior si existe y no es la predeterminada
            if ($current_photo_url && strpos($current_photo_url, 'placehold.co') === false) {
                if (file_exists($current_photo_url)) {
                    unlink($current_photo_url);
                }
            }
            return ["success" => str_replace(__DIR__ . '/../', '', $destination)]; // Guardar ruta relativa para el navegador
        } else {
            return ["error" => "Error al mover el archivo subido."];
        }
    }
    return ["success" => $current_photo_url]; // No se subió nueva foto, mantener la actual
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
        $action = $_POST['action'] ?? null; // Para futuras actualizaciones (editar)
        $id = $_POST['id'] ?? null;

        if ($action === 'update') {
            // Lógica para ACTUALIZAR un closer existente (si se implementa en el futuro)
            // Por ahora, solo se usa para añadir
            http_response_code(400);
            echo json_encode(["error" => "Acción de actualización no implementada para closers."]);
            exit();
        } else {
            // Lógica para CREAR un nuevo closer
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
            $stmt->close();
        }
        break;

    case 'DELETE':
        header('Content-Type: application/json');
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            // Obtener la URL de la foto antes de eliminar el registro
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
                // Eliminar el archivo físico si existe y no es la predeterminada
                if ($photo_to_delete && strpos($photo_to_delete, 'placehold.co') === false) {
                    if (file_exists(__DIR__ . '/../' . $photo_to_delete)) { // Usar ruta absoluta para unlink
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