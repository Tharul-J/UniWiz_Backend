<?php
// FILE: uniwiz-backend/api/get_all_conversations_admin.php (NEW FILE)
// DESCRIPTION: Fetches all conversations in the system for the admin panel.

// --- Set CORS and Content-Type Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// --- Handle preflight OPTIONS request for CORS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Database Connection ---
include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

// --- Check for database connection failure ---
if ($db === null) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

try {
    // --- Query: Join conversations with both users to get their names and last message ---
    $query = "
        SELECT 
            c.id as conversation_id,
            c.job_id,
            u1.id as user_one_id,
            u1.first_name as user_one_first_name,
            u1.last_name as user_one_last_name,
            u1.company_name as user_one_company_name,
            u1.profile_image_url as user_one_profile_image,
            u2.id as user_two_id,
            u2.first_name as user_two_first_name,
            u2.last_name as user_two_last_name,
            u2.company_name as user_two_company_name,
            u2.profile_image_url as user_two_profile_image,
            (SELECT message_text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
        FROM conversations c
        JOIN users u1 ON c.user_one_id = u1.id
        JOIN users u2 ON c.user_two_id = u2.id
        ORDER BY last_message_time DESC
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode($conversations);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
?>
