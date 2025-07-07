<?php
// api/versus_campo.php
include 'db.php';
session_start();

if (!isset($_SESSION['user_id']) || ($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'supervisor_campo')) {
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

            // 1. Obtener los agentes que ya participan en un versus hoy.
            $sql_participants = "SELECT agente1_id as id FROM versus_entries_campo WHERE date = ? UNION SELECT agente2_id as id FROM versus_entries_campo WHERE date = ?";
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
                echo json_encode(["error" => "No hay suficientes agentes disponibles para un nuevo enfrentamiento hoy."]);
                exit();
            }
            // --- Lógica para Sorteo Equitativo ---
            $sql_counts = "
                SELECT agente_id, COUNT(agente_id) as versus_count
                FROM (
                    SELECT agente1_id AS agente_id FROM versus_entries_campo WHERE MONTH(date) = ? AND YEAR(date) = ?
                    UNION ALL
                    SELECT agente2_id AS agente_id FROM versus_entries_campo WHERE MONTH(date) = ? AND YEAR(date) = ?
                ) as matches
                GROUP BY agente_id
            ";
            $stmt_counts = $conn->prepare($sql_counts);
            $stmt_counts->bind_param("iiii", $month, $year, $month, $year);
            $stmt_counts->execute();
            $result_counts = $stmt_counts->get_result();
            
            $counts = [];
            while ($row = $result_counts->fetch_assoc()) {
                $counts[$row['agente_id']] = $row['versus_count'];
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
            $agente1_id = $selected_ids[0];
            $agente2_id = $selected_ids[1];

            // Obtener nombres de los agentes
            $stmt = $conn->prepare("SELECT id, name, photoUrl FROM agentes_campo WHERE id IN (?, ?)");
            $stmt->bind_param("ii", $agente1_id, $agente2_id);
            $stmt->execute();
            $result_names = $stmt->get_result();
            $agents_data = [];
            while($row = $result_names->fetch_assoc()){
                $agents_data[$row['id']] = $row;
            }
            $agente1 = $agents_data[$agente1_id];
            $agente2 = $agents_data[$agente2_id];
            $stmt->close();
            
            $stmt = $conn->prepare("INSERT INTO versus_entries_campo (date, agente1_id, agente2_id, challenge_description) VALUES (?, ?, ?, 'Desafío del día')");
            $stmt->bind_param("sii", $date, $agente1_id, $agente2_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    "success" => true,
                    "message" => "¡Versus Generado!",
                    "versus_id" => $conn->insert_id,
                    "agente1" => $agente1,
                    "agente2" => $agente2
                ]);
            } else {
                echo json_encode(["error" => "Error al guardar el desafío: " . $stmt->error]);
            }
            $stmt->close();
        
        } else if (isset($data['action']) && $data['action'] === 'finalize_match') {
            $versus_id = $data['versus_id'];

            $stmt = $conn->prepare("SELECT * FROM versus_entries_campo WHERE id = ?");
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
            $agente1_id = $match['agente1_id'];
            $agente2_id = $match['agente2_id'];

            $sql_kpi = "SELECT * FROM kpi_entries_campo WHERE date = ? AND agenteId IN (?, ?)";
            $stmt_kpi = $conn->prepare($sql_kpi);
            $stmt_kpi->bind_param("sii", $date, $agente1_id, $agente2_id);
            $stmt_kpi->execute();
            $kpi_result = $stmt_kpi->get_result();
            
            $kpis = [];
            while ($row = $kpi_result->fetch_assoc()) {
                $kpis[$row['agenteId']] = $row;
            }
            $stmt_kpi->close();

            // KPIs para Agentes de Campo: prospectosCualificados, oportunidadesConvertidas, arpuProspectos, actividadesAsignadas, actividadesCompletadas
            $kpiAgente1 = $kpis[$agente1_id] ?? ['prospectosCualificados' => 0, 'oportunidadesConvertidas' => 0, 'arpuProspectos' => 0, 'actividadesAsignadas' => 0, 'actividadesCompletadas' => 0];
            $kpiAgente2 = $kpis[$agente2_id] ?? ['prospectosCualificados' => 0, 'oportunidadesConvertidas' => 0, 'arpuProspectos' => 0, 'actividadesAsignadas' => 0, 'actividadesCompletadas' => 0];

            // Lógica de puntuación adaptada de dashboard_data.php para Agentes de Campo
            $score1 = (
                ($kpiAgente1['prospectosCualificados'] / 50 * 20) + 
                ($kpiAgente1['oportunidadesConvertidas'] / 10 * 30) + 
                ($kpiAgente1['prospectosCualificados'] > 0 ? ($kpiAgente1['oportunidadesConvertidas'] / $kpiAgente1['prospectosCualificados']) * 25 : 0) + 
                ($kpiAgente1['arpuProspectos'] / 30 * 15) + 
                ($kpiAgente1['actividadesAsignadas'] > 0 ? ($kpiAgente1['actividadesCompletadas'] / $kpiAgente1['actividadesAsignadas']) * 10 : 0)
            );

            $score2 = (
                ($kpiAgente2['prospectosCualificados'] / 50 * 20) + 
                ($kpiAgente2['oportunidadesConvertidas'] / 10 * 30) + 
                ($kpiAgente2['prospectosCualificados'] > 0 ? ($kpiAgente2['oportunidadesConvertidas'] / $kpiAgente2['prospectosCualificados']) * 25 : 0) + 
                ($kpiAgente2['arpuProspectos'] / 30 * 15) + 
                ($kpiAgente2['actividadesAsignadas'] > 0 ? ($kpiAgente2['actividadesCompletadas'] / $kpiAgente2['actividadesAsignadas']) * 10 : 0)
            );

            $winner_id = null;
            $loser_id = null;
            $is_draw = 0;
            $points_change = 100; 

            if ($score1 > $score2) {
                $winner_id = $agente1_id;
                $loser_id = $agente2_id;
            } else if ($score2 > $score1) {
                $winner_id = $agente2_id;
                $loser_id = $agente1_id;
            } else {
                $is_draw = 1;
                $points_change = 0;
            }

            $stmt_update = $conn->prepare("UPDATE versus_entries_campo SET winner_id = ?, loser_id = ?, is_draw = ?, points_change = ? WHERE id = ?");
            $stmt_update->bind_param("iiiii", $winner_id, $loser_id, $is_draw, $points_change, $versus_id);
            
            if ($stmt_update->execute()) {
                echo json_encode(["success" => true, "message" => "¡Reto terminado! Ganador determinado."]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Error al actualizar el resultado del versus." . $stmt_update->error]);
            }
            $stmt_update->close();

        } else {
            echo json_encode(["error" => "Acción no especificada."]);
        }
        break;

    case 'GET':
        if (isset($_GET['date'])) {
            $date = $_GET['date'];
            $sql = "SELECT v.*, a1.name as name1, a1.photoUrl as photo1, a2.name as name2, a2.photoUrl as photo2 
                    FROM versus_entries_campo v 
                    JOIN agentes_campo a1 ON v.agente1_id = a1.id 
                    JOIN agentes_campo a2 ON v.agente2_id = a2.id 
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
             
             $sql = "SELECT v.*, a1.name as name1, a1.photoUrl as photo1, a2.name as name2, a2.photoUrl as photo2
                     FROM versus_entries_campo v
                     JOIN agentes_campo a1 ON v.agente1_id = a1.id 
                     JOIN agentes_campo a2 ON v.agente2_id = a2.id
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
            http_response_code(400);
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

        $stmt_delete = $conn->prepare("DELETE FROM versus_entries_campo WHERE id = ?");
        $stmt_delete->bind_param("i", $versus_id);
        if($stmt_delete->execute()){
            echo json_encode(["success" => true, "message" => "Versus eliminado correctamente."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "No se pudo eliminar el versus." . $stmt_delete->error]);
        }
        $stmt_delete->close();
        break;
}

$conn->close();
?>