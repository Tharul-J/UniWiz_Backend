<?php
// FILE: uniwiz-backend/api/test.php
// ================================
// Simple endpoint to test API connectivity. Returns a JSON response.

header('Access-Control-Allow-Origin: *'); // Allow requests from any origin

echo json_encode(['test' => 'ok']); // Respond with a simple test message
?>