<?php
include 'db.php';
session_start();
if (!isset($_SESSION['user_id'])) { http_response_code(401); exit(json_encode(["error" => "Acceso no autorizado."])); }

$method = $_SERVER['REQUEST_METHOD'];
// No establecer Content-Type: application/json aquí, ya que puede ser multipart/form-data
// header('Content-Type: application/json'); // Esto se establecerá condicionalmente

$upload_dir = __DIR__ . '/../uploads/agentes_atc/'; // Ruta absoluta para la carpeta de subidas

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

        $new_file_name = uniqid('agente_', true) . '.' . $file_ext;
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

switch ($method) {
    case 'GET':
        header('Content-Type: application/json');
        $result = $conn->query("SELECT * FROM agentes_atc ORDER BY name ASC");
        $items = [];
        while($row = $result->fetch_assoc()) { $items[] = $row; }
        echo json_encode($items);
        break;

    case 'POST':
        header('Content-Type: application/json');
        // Para POST, los datos pueden venir de FormData (con archivo) o JSON (sin archivo)
        $name = $_POST['name'] ?? null;
        $action = $_POST['action'] ?? null;
        $id = $_POST['id'] ?? null;

        if ($action === 'update') {
            // Lógica para ACTUALIZAR un agente existente
            $current_photo_url = null;
            if ($id) {
                $stmt_select = $conn->prepare("SELECT photoUrl FROM agentes_atc WHERE id = ?");
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

            $stmt = $conn->prepare("UPDATE agentes_atc SET name = ?, photoUrl = ? WHERE id = ?");
            $stmt->bind_param("ssi", $name, $photoUrl, $id);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Agente actualizado"]);
            } else {
                echo json_encode(["error" => $stmt->error]);
            }

        } else {
            // Lógica para CREAR un nuevo agente
            $photo_upload_result = handle_photo_upload('photo');
            if (isset($photo_upload_result['error'])) {
                http_response_code(400);
                echo json_encode(["error" => $photo_upload_result['error']]);
                exit();
            }
            $photoUrl = $photo_upload_result['success'];

            $stmt = $conn->prepare("INSERT INTO agentes_atc (name, photoUrl) VALUES (?, ?)");
            $stmt->bind_param("ss", $name, $photoUrl);
            if ($stmt->execute()) { echo json_encode(["message" => "Agente añadido"]); }
            else { echo json_encode(["error" => $stmt->error]); }
        }
        
        $stmt->close();
        break;
        
    case 'DELETE':
        header('Content-Type: application/json');
        $id = $_GET['id'];
        // Obtener la URL de la foto antes de eliminar el registro
        $stmt_select = $conn->prepare("SELECT photoUrl FROM agentes_atc WHERE id = ?");
        $stmt_select->bind_param("i", $id);
        $stmt_select->execute();
        $result_select = $stmt_select->get_result();
        $photo_to_delete = null;
        if ($row = $result_select->fetch_assoc()) {
            $photo_to_delete = $row['photoUrl'];
        }
        $stmt_select->close();

        $stmt = $conn->prepare("DELETE FROM agentes_atc WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            // Eliminar el archivo físico si existe y no es la predeterminada
            if ($photo_to_delete && strpos($photo_to_delete, 'placehold.co') === false) {
                if (file_exists($photo_to_delete)) {
                    unlink($photo_to_delete);
                }
            }
            echo json_encode(["message" => "Agente eliminado"]);
        }
        else { echo json_encode(["error" => $stmt->error]); }
        $stmt->close();
        break;
}
$conn->close();
?>