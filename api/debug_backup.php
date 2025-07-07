<?php
echo "<pre>"; // Para un formato más legible

// --- Prueba 1: Conexión a la Base de Datos ---
echo "<strong>Paso 1: Probando conexión a la base de datos...</strong>\n";
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "liga_sigma_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("<strong>Error:</strong> Falló la conexión a la base de datos. Mensaje: " . $conn->connect_error . "\n");
}
echo "<strong>Resultado:</strong> Conexión a la base de datos exitosa.\n\n";
$conn->close();

// --- Prueba 2: Verificar si `mysqldump` existe ---
echo "<strong>Paso 2: Verificando si 'mysqldump' está disponible...</strong>\n";
$mysqldump_path = '/usr/bin/mysqldump';
if (is_executable($mysqldump_path)) {
    echo "<strong>Resultado:</strong> `mysqldump` encontrado y es ejecutable en: " . $mysqldump_path . "\n\n";
} else {
    die("<strong>Error Crítico:</strong> El comando `mysqldump` no se encontró o no tiene permisos de ejecución en la ruta '$mysqldump_path'. Este es el problema principal.\n");
}

// --- Prueba 3: Intentar ejecutar `mysqldump` y capturar salida ---
echo "<strong>Paso 3: Ejecutando un respaldo de prueba...</strong>\n";
$command = $mysqldump_path . " --user=" . escapeshellarg($username);
if (!empty($password)) {
    $command .= " --password=" . escapeshellarg($password);
}
$command .= " --host=" . escapeshellarg($servername);
$command .= " " . escapeshellarg($dbname);
$command .= " --no-data users"; // Respaldamos solo la estructura de la tabla 'users' para una prueba rápida
$command .= " 2>&1"; // Redirigir errores a la salida

$output = [];
$return_var = -1;
exec($command, $output, $return_var);

echo "Comando ejecutado: " . htmlspecialchars($command) . "\n";
echo "Código de retorno del comando: " . $return_var . "\n\n";

if ($return_var === 0) {
    echo "<strong>Resultado:</strong> ¡El respaldo de prueba funcionó correctamente!\n";
    echo "La configuración del servidor es correcta. El problema podría estar en el script de descarga.\n";
} else {
    echo "<strong>Error Crítico:</strong> `mysqldump` falló al ejecutarse.\n";
    echo "<strong>Mensaje de error del sistema:</strong>\n";
    echo htmlspecialchars(implode("\n", $output));
}

echo "</pre>";
?>
