<?php
// FILE: uniwiz-backend/api/hash_password.php
// =====================================================
// This script demonstrates how to hash a password using PHP's password_hash function.
// (For demo/testing purposes only; do not expose in production.)

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$plain_password = "Admin@UniWiz"; // Example plain password
$hashed_password = password_hash($plain_password, PASSWORD_BCRYPT); // Hash the password using bcrypt

echo "Plain Password: " . $plain_password . "<br>";
echo "Hashed Password: " . $hashed_password;
?>