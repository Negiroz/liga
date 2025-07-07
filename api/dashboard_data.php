<?php
header('Content-Type: application/json');
include 'db.php';
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["error" => "Acceso no autorizado."]);
    exit();
}

$month = $_GET['month'] ?? date('Y-m');
$startDate = $month . "-01";
$endDate = date("Y-m-t", strtotime($startDate));

function calculate_kpi_score($kpis, $points_config) {
    $score = 0;
    foreach ($kpis as $key => $value) {
        if (isset($points_config[$key])) {
            $score += $value * $points_config[$key];
        }
    }
    return $score;
}

$all_performers = [];

// 1. Obtener datos de Closers
$closers_sql = "SELECT c.id, c.name, c.photoUrl, k.* FROM closers c LEFT JOIN kpi_entries k ON c.id = k.closerId AND k.date >= ? AND k.date <= ?";
$stmt = $conn->prepare($closers_sql);
$stmt->bind_param("ss", $startDate, $endDate);
$stmt->execute();
$result = $stmt->get_result();
$closers_data = [];
while ($row = $result->fetch_assoc()) {
    $id = $row['id'];
    if (!isset($closers_data[$id])) {
        $closers_data[$id] = ['id' => $id, 'name' => $row['name'], 'photoUrl' => $row['photoUrl'], 'cierres' => 0, 'ingresos' => 0, 'calificaciones' => [], 'actAsignadas' => 0, 'actCompletadas' => 0];
    }
    $closers_data[$id]['cierres'] += (int)$row['cierresLogrados'];
    $closers_data[$id]['ingresos'] += (float)$row['ingresosTotales'];
    if($row['calificacionPitch'] > 0) $closers_data[$id]['calificaciones'][] = (float)$row['calificacionPitch'];
    $closers_data[$id]['actAsignadas'] += (int)$row['actividadesAsignadas'];
    $closers_data[$id]['actCompletadas'] += (int)$row['actividadesCompletadas'];
}
$stmt->close();

foreach ($closers_data as $data) {
    $cierreMeta = 40; $mostExpensivePlan = 30;
    $arpu = $data['cierres'] > 0 ? $data['ingresos'] / $data['cierres'] : 0;
    $qual_avg = count($data['calificaciones']) > 0 ? array_sum($data['calificaciones']) / count($data['calificaciones']) : 0;
    $act_percent = $data['actAsignadas'] > 0 ? ($data['actCompletadas'] / $data['actAsignadas']) : 0;
    $puntaje = (($data['cierres'] / $cierreMeta) * 40) + (($arpu / $mostExpensivePlan) * 30) + (($qual_avg / 5) * 10) + ($act_percent * 20);
    $all_performers[] = ['id' => 'c_'.$data['id'], 'name' => $data['name'], 'photoUrl' => $data['photoUrl'], 'puntaje' => $puntaje, 'area' => 'Closers'];
}


// 2. Obtener datos de Agentes de Campo
$campo_sql = "SELECT a.id, a.name, a.photoUrl, k.* FROM agentes_campo a LEFT JOIN kpi_entries_campo k ON a.id = k.agenteId AND k.date >= ? AND k.date <= ?";
$stmt = $conn->prepare($campo_sql);
$stmt->bind_param("ss", $startDate, $endDate);
$stmt->execute();
$result = $stmt->get_result();
$campo_data = [];
while ($row = $result->fetch_assoc()) {
     $id = $row['id'];
    if (!isset($campo_data[$id])) {
        $campo_data[$id] = ['id' => $id, 'name' => $row['name'], 'photoUrl' => $row['photoUrl'], 'prospectos' => 0, 'oportunidades' => 0, 'arpuTotal' => 0, 'arpuCount' => 0, 'actAsignadas' => 0, 'actCompletadas' => 0];
    }
    $campo_data[$id]['prospectos'] += (int)$row['prospectosCualificados'];
    $campo_data[$id]['oportunidades'] += (int)$row['oportunidadesConvertidas'];
    if((float)$row['arpuProspectos'] > 0) {
        $campo_data[$id]['arpuTotal'] += (float)$row['arpuProspectos'];
        $campo_data[$id]['arpuCount']++;
    }
    $campo_data[$id]['actAsignadas'] += (int)$row['actividadesAsignadas'];
    $campo_data[$id]['actCompletadas'] += (int)$row['actividadesCompletadas'];
}
$stmt->close();

foreach ($campo_data as $data) {
    $metaProspectos = 50; $metaCierres = 10; $refPlanCaro = 30;
    $arpu_avg = $data['arpuCount'] > 0 ? $data['arpuTotal'] / $data['arpuCount'] : 0;
    $tc_percent = ($data['prospectos'] / $metaProspectos) * 100;
    $cierre_percent = ($data['oportunidades'] / $metaCierres) * 100;
    $conversion_percent = $data['prospectos'] > 0 ? ($data['oportunidades'] / $data['prospectos']) * 100 : 0;
    $arpu_percent = ($arpu_avg / $refPlanCaro) * 100;
    $act_percent = $data['actAsignadas'] > 0 ? ($data['actCompletadas'] / $data['actAsignadas']) * 100 : 0;
    $puntaje = ($tc_percent/100 * 20) + ($cierre_percent/100 * 30) + ($conversion_percent/100 * 25) + ($arpu_percent/100 * 15) + ($act_percent/100 * 10);
    $all_performers[] = ['id' => 'f_'.$data['id'], 'name' => $data['name'], 'photoUrl' => $data['photoUrl'], 'puntaje' => $puntaje, 'area' => 'Agentes de Campo'];
}


// 3. Obtener datos de ATC
$atc_kpi_sql = "SELECT a.id, a.name, a.photoUrl, k.* FROM agentes_atc a LEFT JOIN kpi_entries_atc k ON a.id = k.agenteId AND k.date >= ? AND k.date <= ?";
$stmt = $conn->prepare($atc_kpi_sql);
$stmt->bind_param("ss", $startDate, $endDate);
$stmt->execute();
$result = $stmt->get_result();
$atc_data = [];
$kpi_entries_atc = [];
while ($row = $result->fetch_assoc()) {
    $kpi_entries_atc[] = $row; // Store for versus calculation
    $id = $row['id'];
    if (!isset($atc_data[$id])) {
        $atc_data[$id] = ['id' => $id, 'name' => $row['name'], 'photoUrl' => $row['photoUrl'], 'soportes' => 0, 'tickets' => 0, 'pagos' => 0, 'conversaciones' => 0, 'versus_points' => 0];
    }
    $atc_data[$id]['soportes'] += (int)$row['soportesAtendidos'];
    $atc_data[$id]['tickets'] += (int)$row['ticketsGenerados'];
    $atc_data[$id]['pagos'] += (int)$row['pagosRegistrados'];
    $atc_data[$id]['conversaciones'] += (int)$row['actividadesAsignadas'];
}
$stmt->close();

$versus_sql = "SELECT * FROM versus_entries_atc WHERE date >= ? AND date <= ?";
$stmt_v = $conn->prepare($versus_sql);
$stmt_v->bind_param("ss", $startDate, $endDate);
$stmt_v->execute();
$versus_entries = $stmt_v->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt_v->close();

foreach ($versus_entries as $match) {
    if ($match['winner_id'] && isset($atc_data[$match['winner_id']])) {
        $atc_data[$match['winner_id']]['versus_points'] += (int)$match['points_change'];
    }
}

foreach ($atc_data as $data) {
    $puntaje = ($data['soportes'] * 2) + ($data['tickets'] * 0.5) + ($data['conversaciones'] * 1) + ($data['pagos'] * 1.5) + $data['versus_points'];
    $all_performers[] = ['id' => 'a_'.$data['id'], 'name' => $data['name'], 'photoUrl' => $data['photoUrl'], 'puntaje' => $puntaje, 'area' => 'Atención al Cliente'];
}


// Ordenar y seleccionar Top 5
usort($all_performers, function($a, $b) {
    return $b['puntaje'] <=> $a['puntaje'];
});
$top_performers = array_slice($all_performers, 0, 5);

// Seleccionar Low 3 (puntaje mayor a 0)
$low_performers = array_filter($all_performers, function($p) { return $p['puntaje'] > 0; });
usort($low_performers, function($a, $b) {
    return $a['puntaje'] <=> $b['puntaje'];
});
$low_performers = array_slice($low_performers, 0, 3);


// Calcular rendimiento promedio por área
$area_scores = ['Closers' => [], 'Agentes de Campo' => [], 'Atención al Cliente' => []];
foreach ($all_performers as $p) {
    $area_scores[$p['area']][] = $p['puntaje'];
}

$area_performance = [];
foreach ($area_scores as $area => $scores) {
    $area_performance[$area] = count($scores) > 0 ? array_sum($scores) / count($scores) : 0;
}


// Ensamblar respuesta final
$response_data = [
    'areaPerformance' => $area_performance,
    'topPerformers' => $top_performers,
    'lowPerformers' => $low_performers
];

echo json_encode($response_data);

$conn->close();
?>