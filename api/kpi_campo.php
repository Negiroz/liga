<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include 'db.php';
session_start();
if (!isset($_SESSION['user_id'])) { http_response_code(401); exit(json_encode(["error" => "Acceso no autorizado."])); }

$method = $_SERVER['REQUEST_METHOD'];
header('Content-Type: application/json');

switch ($method) {
    case 'GET':
        $aggregate = isset($_GET['aggregate']) && $_GET['aggregate'] === 'true';
        $select_cols = $aggregate ?
            "k.agenteId, k.date, a.name as agenteName,
             SUM(k.prospectosCualificados) as prospectosCualificados,
             SUM(k.oportunidadesConvertidas) as oportunidadesConvertidas,
             SUM(k.arpuProspectos) as arpuProspectos,
             SUM(k.actividadesAsignadas) as actividadesAsignadas,
             SUM(k.actividadesCompletadas) as actividadesCompletadas" :
            "k.*, a.name as agenteName";
        $group_by = $aggregate ? " GROUP BY k.agenteId, k.date" : "";

        if (isset($_GET['date'])) {
            $date = $_GET['date'];
            $sql = "SELECT $select_cols FROM kpi_entries_campo k JOIN agentes_campo a ON k.agenteId = a.id WHERE k.date = ?" . $group_by;
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $date);
        } else if (isset($_GET['month'])) {
            $month = $_GET['month'];
            $startDate = $month . "-01";
            $endDate = date("Y-m-t", strtotime($startDate));
            $sql = "SELECT $select_cols FROM kpi_entries_campo k JOIN agentes_campo a ON k.agenteId = a.id WHERE k.date >= ? AND k.date <= ?" . $group_by;
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ss", $startDate, $endDate);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Se requiere especificar 'date' o 'month'."]);
            exit();
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $entries = [];
        while($row = $result->fetch_assoc()) { $entries[] = $row; }
        echo json_encode($entries);
        $stmt->close();
        break;

    case 'POST':
        $entries = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($entries)) {
            http_response_code(400);
            echo json_encode(["error" => "Datos JSON inválidos."]);
            exit();
        }
        
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare(
                "INSERT INTO kpi_entries_campo (agenteId, date, prospectosCualificados, oportunidadesConvertidas, arpuProspectos, actividadesAsignadas, actividadesCompletadas) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                    prospectosCualificados = VALUES(prospectosCualificados),
                    oportunidadesConvertidas = VALUES(oportunidadesConvertidas),
                    arpuProspectos = VALUES(arpuProspectos),
                    actividadesAsignadas = VALUES(actividadesAsignadas),
                    actividadesCompletadas = VALUES(actividadesCompletadas)"
            );
            
            $entries_processed = 0;
            foreach ($entries as $entry) {
                 if ($entry['prospectosCualificados'] > 0 || $entry['oportunidadesConvertidas'] > 0 || $entry['arpuProspectos'] > 0 || $entry['actividadesAsignadas'] > 0 || $entry['actividadesCompletadas'] > 0) {
                     $stmt->bind_param("isddiii", 
                        $entry['agenteId'], $entry['date'], $entry['prospectosCualificados'], $entry['oportunidadesConvertidas'],
                        $entry['arpuProspectos'], $entry['actividadesAsignadas'], $entry['actividadesCompletadas']
                    );
                    $stmt->execute();
                    $entries_processed++;
                 }
            }
            
            $stmt->close();
            $conn->commit();
            echo json_encode(["message" => $entries_processed . " registro(s) guardado(s) o actualizado(s)."]);
        } catch (mysqli_sql_exception $exception) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["error" => "La transacción falló: " . $exception->getMessage()]);
        }
        break;

    case 'PUT':
        $updates = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($updates)) {
            http_response_code(400);
            echo json_encode(["error" => "Datos JSON inválidos."]);
            exit();
        }

        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare(
                "INSERT INTO kpi_entries_campo (agenteId, date, prospectosCualificados, oportunidadesConvertidas, arpuProspectos, actividadesAsignadas, actividadesCompletadas) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                    prospectosCualificados = VALUES(prospectosCualificados),
                    oportunidadesConvertidas = VALUES(oportunidadesConvertidas),
                    arpuProspectos = VALUES(arpuProspectos),
                    actividadesAsignadas = VALUES(actividadesAsignadas),
                    actividadesCompletadas = VALUES(actividadesCompletadas)"
            );

            foreach ($updates as $update) {
                if (!isset($update['agenteId']) || !isset($update['date'])) continue; 

                $stmt->bind_param("isddiii",
                    $update['agenteId'],
                    $update['date'],
                    $update['prospectosCualificados'],
                    $update['oportunidadesConvertidas'],
                    $update['arpuProspectos'],
                    $update['actividadesAsignadas'],
                    $update['actividadesCompletadas']
                );
                $stmt->execute();
            }
            $stmt->close();
            $conn->commit();
            echo json_encode(["message" => count($updates) . " registro(s) actualizado(s) correctamente."]);

        } catch (mysqli_sql_exception $exception) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["error" => "La actualización de la base de datos falló.", "details" => $exception->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido."]);
        break;
}

$conn->close();
?>