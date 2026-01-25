<?php
// FILE: uniwiz-backend/api/get_messages.php (NEW FILE)
// =====================================================
// This file fetches all messages for a given conversation and marks them as read for the user.

// --- Set CORS and Content-Type Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Database Connection ---
include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

// --- Validate required query parameters ---
if (!isset($_GET['conversation_id']) || !isset($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "Conversation ID and User ID are required."]);
    exit();
}
$conversation_id = (int)$_GET['conversation_id'];
$user_id = (int)$_GET['user_id'];

try {
    $db->beginTransaction(); // Start transaction for atomicity

    // --- Mark messages as read for this user in this conversation ---
    $query_update = "UPDATE messages SET is_read = 1 WHERE conversation_id = :conversation_id AND receiver_id = :user_id AND is_read = 0";
    $stmt_update = $db->prepare($query_update);
    $stmt_update->bindParam(':conversation_id', $conversation_id, PDO::PARAM_INT);
    $stmt_update->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt_update->execute();

    // --- Fetch all messages for the conversation ---
    $query_fetch = "SELECT * FROM messages WHERE conversation_id = :conversation_id ORDER BY created_at ASC";
    $stmt_fetch = $db->prepare($query_fetch);
    $stmt_fetch->bindParam(':conversation_id', $conversation_id, PDO::PARAM_INT);
    $stmt_fetch->execute();
    $messages = $stmt_fetch->fetchAll(PDO::FETCH_ASSOC);

    $db->commit(); // Commit transaction

    http_response_code(200);
    echo json_encode($messages);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
?>