<?php
// api/check_session.php
session_start();
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        "loggedIn" => true,
        "user" => [
            "username" => $_SESSION['username'],
            "role" => $_SESSION['role']
        ]
    ]);
} else {
    echo json_encode(["loggedIn" => false]);
}
?>