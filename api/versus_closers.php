<?php
// api/versus_closers.php
include 'db.php';
session_start();

if (!isset($_SESSION['user_id']) || ($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'supervisor_closers')) {
    http_response_code(403);
    exit(json_encode(["error" => "Acceso no autorizado."]));
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);

        if (isset($data['action']) && $data['action'] === 'generate_challenge') {
            $available_agent_ids = $data['available_agent_ids'];
            $date = $data['date'];
            $month = date("m", strtotime($date));
            $year = date("Y", strtotime($date));

            // 1. Obtener los closers que ya participan en un versus hoy.
            $sql_participants = "SELECT closer1_id as id FROM versus_entries_closers WHERE date = ? UNION SELECT closer2_id as id FROM versus_entries_closers WHERE date = ?";
            $stmt_participants = $conn->prepare($sql_participants);
            $stmt_participants->bind_param("ss", $date, $date);
            $stmt_participants->execute();
            $result_participants = $stmt_participants->get_result();
            
            $participants_today = [];
            while ($row = $result_participants->fetch_assoc()) {
                $participants_today[] = $row['id'];
            }
            $stmt_participants->close();

            // 2. Filtrar la lista de disponibles, excluyendo a los que ya participan.
            $truly_available_ids = array_diff($available_agent_ids, $participants_today);

            if (count($truly_available_ids) < 2) {
                http_response_code(400);
                echo json_encode(["error" => "No hay suficientes closers disponibles para un nuevo enfrentamiento hoy."]);
                exit();
            }
            // --- Lógica para Sorteo Equitativo ---
            $sql_counts = "
                SELECT closer_id, COUNT(closer_id) as versus_count
                FROM (
                    SELECT closer1_id AS closer_id FROM versus_entries_closers WHERE MONTH(date) = ? AND YEAR(date) = ?
                    UNION ALL
                    SELECT closer2_id AS closer_id FROM versus_entries_closers WHERE MONTH(date) = ? AND YEAR(date) = ?
                ) as matches
                GROUP BY closer_id
            ";
            $stmt_counts = $conn->prepare($sql_counts);
            $stmt_counts->bind_param("iiii", $month, $year, $month, $year);
            $stmt_counts->execute();
            $result_counts = $stmt_counts->get_result();
            
            $counts = [];
            while ($row = $result_counts->fetch_assoc()) {
                $counts[$row['closer_id']] = $row['versus_count'];
            }
            $stmt_counts->close();

            $min_versus = -1;
            foreach ($truly_available_ids as $id) {
                $current_count = isset($counts[$id]) ? $counts[$id] : 0;
                if ($min_versus == -1 || $current_count < $min_versus) {
                    $min_versus = $current_count;
                }
            }

            $candidate_pool = [];
            foreach ($truly_available_ids as $id) {
                $current_count = isset($counts[$id]) ? $counts[$id] : 0;
                if ($current_count == $min_versus) {
                    $candidate_pool[] = $id;
                }
            }
            
            if (count($candidate_pool) < 2) {
                 $candidate_pool = array_values($truly_available_ids);
            }

            shuffle($candidate_pool);
            $selected_ids = array_slice($candidate_pool, 0, 2);
            $closer1_id = $selected_ids[0];
            $closer2_id = $selected_ids[1];

            // Obtener nombres de los closers
            $stmt = $conn->prepare("SELECT id, name, photoUrl FROM closers WHERE id IN (?, ?)");
            $stmt->bind_param("ii", $closer1_id, $closer2_id);
            $stmt->execute();
            $result_names = $stmt->get_result();
            $agents_data = [];
            while($row = $result_names->fetch_assoc()){
                $agents_data[$row['id']] = $row;
            }
            $closer1 = $agents_data[$closer1_id];
            $closer2 = $agents_data[$closer2_id];
            $stmt->close();
            
            $stmt = $conn->prepare("INSERT INTO versus_entries_closers (date, closer1_id, closer2_id, challenge_description) VALUES (?, ?, ?, 'Desafío del día')");
            $stmt->bind_param("sii", $date, $closer1_id, $closer2_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    "success" => true,
                    "message" => "¡Versus Generado!",
                    "versus_id" => $conn->insert_id,
                    "closer1" => $closer1,
                    "closer2" => $closer2
                ]);
            } else {
                echo json_encode(["error" => "Error al guardar el desafío: " . $stmt->error]);
            }
            $stmt->close();
        
        } else if (isset($data['action']) && $data['action'] === 'finalize_match') {
            $versus_id = $data['versus_id'];

            $stmt = $conn->prepare("SELECT * FROM versus_entries_closers WHERE id = ?");
            $stmt->bind_param("i", $versus_id);
            $stmt->execute();
            $match = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$match) {
                http_response_code(404);
                echo json_encode(['error' => 'Versus no encontrado.']);
                exit;
            }

            $date = $match['date'];
            $closer1_id = $match['closer1_id'];
            $closer2_id = $match['closer2_id'];

            $sql_kpi = "SELECT * FROM kpi_entries WHERE date = ? AND closerId IN (?, ?)";
            $stmt_kpi = $conn->prepare($sql_kpi);
            $stmt_kpi->bind_param("sii", $date, $closer1_id, $closer2_id);
            $stmt_kpi->execute();
            $kpi_result = $stmt_kpi->get_result();
            
            $kpis = [];
            while ($row = $kpi_result->fetch_assoc()) {
                $kpis[$row['closerId']] = $row;
            }
            $stmt_kpi->close();

            $kpiCloser1 = $kpis[$closer1_id] ?? ['cierresLogrados' => 0, 'ingresosTotales' => 0, 'calificacionPitch' => 0, 'actividadesCompletadas' => 0];
            $kpiCloser2 = $kpis[$closer2_id] ?? ['cierresLogrados' => 0, 'ingresosTotales' => 0, 'calificacionPitch' => 0, 'actividadesCompletadas' => 0];

            $score1 = ($kpiCloser1['cierresLogrados'] * 40) + ($kpiCloser1['ingresosTotales'] * 0.3) + ($kpiCloser1['calificacionPitch'] * 10) + ($kpiCloser1['actividadesCompletadas'] * 20);
            $score2 = ($kpiCloser2['cierresLogrados'] * 40) + ($kpiCloser2['ingresosTotales'] * 0.3) + ($kpiCloser2['calificacionPitch'] * 10) + ($kpiCloser2['actividadesCompletadas'] * 20);

            $winner_id = null;
            $loser_id = null;
            $is_draw = 0;
            $points_change = 100; 

            if ($score1 > $score2) {
                $winner_id = $closer1_id;
                $loser_id = $closer2_id;
            } else if ($score2 > $score1) {
                $winner_id = $closer2_id;
                $loser_id = $closer1_id;
            } else {
                $is_draw = 1;
                $points_change = 0;
            }

            $stmt_update = $conn->prepare("UPDATE versus_entries_closers SET winner_id = ?, loser_id = ?, is_draw = ?, points_change = ? WHERE id = ?");
            $stmt_update->bind_param("iiiii", $winner_id, $loser_id, $is_draw, $points_change, $versus_id);
            
            if ($stmt_update->execute()) {
                echo json_encode(["success" => true, "message" => "¡Reto terminado! Ganador determinado."]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Error al actualizar el resultado del versus."]);
            }
            $stmt_update->close();

        } else {
            echo json_encode(["error" => "Acción no especificada."]);
        }
        break;

    case 'GET':
        if (isset($_GET['date'])) {
            $date = $_GET['date'];
            $sql = "SELECT v.*, c1.name as name1, c1.photoUrl as photo1, c2.name as name2, c2.photoUrl as photo2 
                    FROM versus_entries_closers v 
                    JOIN closers c1 ON v.closer1_id = c1.id 
                    JOIN closers c2 ON v.closer2_id = c2.id 
                    WHERE v.date = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $date);
            $stmt->execute();
            $result = $stmt->get_result();
            $versus_entries = [];
            while($row = $result->fetch_assoc()) {
                $versus_entries[] = $row;
            }
            $stmt->close();
            echo json_encode($versus_entries);

        } else if (isset($_GET['month'])) {
             $month = $_GET['month'];
             $startDate = $month . "-01";
             $endDate = date("Y-m-t", strtotime($startDate));
             
             $sql = "SELECT v.*, c1.name as name1, c1.photoUrl as photo1, c2.name as name2, c2.photoUrl as photo2
                     FROM versus_entries_closers v
                     JOIN closers c1 ON v.closer1_id = c1.id 
                     JOIN closers c2 ON v.closer2_id = c2.id
                     WHERE v.date >= ? AND v.date <= ?";

             $stmt = $conn->prepare($sql);
             $stmt->bind_param("ss", $startDate, $endDate);
             $stmt->execute();
             $result = $stmt->get_result();
             
             $versus_entries = [];
             while($row = $result->fetch_assoc()) {
                 $versus_entries[] = $row;
             }
             $stmt->close();

             echo json_encode($versus_entries);
        } else {
            echo json_encode(["error" => "Parámetros GET no especificados."]);
        }
        break;
    
    case 'DELETE':
        if ($_SESSION['role'] !== 'admin') {
             http_response_code(403);
             echo json_encode(["error" => "Solo los administradores pueden eliminar un versus."]);
             exit();
        }
        
        $data = json_decode(file_get_contents("php://input"), true);
        $versus_id = $data['versus_id'] ?? null;
        $password_input = $data['password'] ?? null;
        $admin_id = $_SESSION['user_id'];

        if(!$versus_id || !$password_input) {
            http_response_code(400);
            echo json_encode(["error" => "Faltan datos para la eliminación."]);
            exit();
        }

        $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->bind_param("i", $admin_id);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        $login_success = false;
        if ($user && ($password_input === $user['password'] || password_verify($password_input, $user['password']))) {
            $login_success = true;
        }

        if (!$login_success) {
            http_response_code(401);
            echo json_encode(["error" => "Contraseña de administrador incorrecta."]);
            exit();
        }

        $stmt_delete = $conn->prepare("DELETE FROM versus_entries_closers WHERE id = ?");
        $stmt_delete->bind_param("i", $versus_id);
        if($stmt_delete->execute()){
            echo json_encode(["success" => true, "message" => "Versus eliminado correctamente."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "No se pudo eliminar el versus."]);
        }
        $stmt_delete->close();
        break;
}

$conn->close();
?>
