<?php
// api/kpi.php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['month'])) {
            $month = $_GET['month']; // Formato YYYY-MM
            $startDate = $month . "-01";
            $endDate = date("Y-m-t", strtotime($startDate));

            $sql = "SELECT k.*, c.name as closerName FROM kpi_entries k JOIN closers c ON k.closerId = c.id WHERE k.date >= ? AND k.date <= ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ss", $startDate, $endDate);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $entries = [];
            if ($result->num_rows > 0) {
                while($row = $result->fetch_assoc()) {
                    $entries[] = $row;
                }
            }
            echo json_encode($entries);
            $stmt->close();
        }
        break;

    case 'POST':
        $entries = json_decode(file_get_contents('php://input'), true);
        $conn->begin_transaction();
        
        try {
            $stmt = $conn->prepare("INSERT INTO kpi_entries (closerId, date, oportunidadesAsignadas, cierresLogrados, ingresosTotales, calificacionPitch, actividadesAsignadas, actividadesCompletadas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            
            foreach ($entries as $entry) {
                 $stmt->bind_param("isiiidii", 
                    $entry['closerId'], $entry['date'], $entry['oportunidadesAsignadas'], $entry['cierresLogrados'],
                    $entry['ingresosTotales'], $entry['calificacionPitch'], $entry['actividadesAsignadas'], $entry['actividadesCompletadas']
                );
                $stmt->execute();
            }
            $stmt->close();
            $conn->commit();
            echo json_encode(["message" => count($entries) . " jugada(s) guardada(s) exitosamente."]);
        } catch (mysqli_sql_exception $exception) {
            $conn->rollback();
            echo json_encode(["error" => "Transaction Failed: " . $exception->getMessage()]);
        }
        break;

    case 'PUT':
        $entries = json_decode(file_get_contents('php://input'), true);
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("UPDATE kpi_entries SET oportunidadesAsignadas = ?, cierresLogrados = ?, ingresosTotales = ?, calificacionPitch = ?, actividadesAsignadas = ?, actividadesCompletadas = ? WHERE id = ?");
            
            foreach ($entries as $entry) {
                 $stmt->bind_param("iididii", 
                    $entry['oportunidadesAsignadas'], $entry['cierresLogrados'], $entry['ingresosTotales'],
                    $entry['calificacionPitch'], $entry['actividadesAsignadas'], $entry['actividadesCompletadas'], $entry['id']
                );
                $stmt->execute();
            }
            $stmt->close();
            $conn->commit();
            echo json_encode(["message" => count($entries) . " registro(s) actualizado(s) correctamente."]);
        } catch (mysqli_sql_exception $exception) {
            $conn->rollback();
            echo json_encode(["error" => "Transaction Failed: " . $exception->getMessage()]);
        }
        break;
}

$conn->close();
?>