<?php
// api/generate_analysis.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$apiKey = "AIzaSyAZ0lZpZsrgHEJ3I_DVLfNgJJiRN3_76qk"; // Esta es TU CLAVE REAL.

if ($apiKey === "AIzaSyD9mdolNE0xnyxsVzFb4wFn_HYrpSAAc0Q" || $apiKey === "") {
    http_response_code(500);
    echo json_encode(["error" => "La clave de API de Gemini no está configurada en el archivo api/generate_analysis.php"]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$prompt = $data['prompt'] ?? null;

if (!$prompt) {
    http_response_code(400);
    echo json_encode(["error" => "No se proporcionó un prompt."]);
    exit();
}

// *** INICIO DE LA CORRECCIÓN: Nombre del modelo actualizado ***
$apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey;
// *** FIN DE LA CORRECCIÓN ***

$payload = json_encode([
    'contents' => [[ 'role' => 'user', 'parts' => [[ 'text' => $prompt ]] ]]
]);

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL Error: ' . curl_error($ch)]);
    curl_close($ch);
    exit();
}

curl_close($ch);

http_response_code($httpcode);
echo $response;
?>