<?php
// FILE: uniwiz-backend/api/get_messages_admin.php
// =====================================================
// DESCRIPTION: Fetches messages for a conversation without marking them as read.
// This is specifically for the admin's read-only view.

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

include_once '../config/database.php'; // Include database connection
$database = new Database();
$db = $database->getConnection();

// Check if database connection is successful
if ($db === null) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

// Validate required parameter
if (!isset($_GET['conversation_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "Conversation ID is required."]);
    exit();
}
$conversation_id = (int)$_GET['conversation_id'];

try {
    // Fetch all messages for the conversation without updating the 'is_read' status.
    $query_fetch = "SELECT * FROM messages WHERE conversation_id = :conversation_id ORDER BY created_at ASC";
    $stmt_fetch = $db->prepare($query_fetch);
    $stmt_fetch->bindParam(':conversation_id', $conversation_id, PDO::PARAM_INT);
    $stmt_fetch->execute();
    $messages = $stmt_fetch->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($messages);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
?>
