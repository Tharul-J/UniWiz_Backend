<?php
// FILE: uniwiz-backend/api/get_conversations.php
// =====================================================
// This endpoint fetches all conversations for a given user, including job info and unread message count.

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../config/database.php'; // Include database connection
$database = new Database();
$db = $database->getConnection();

// Validate user_id parameter
if (!isset($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "User ID is required."]);
    exit();
}
$user_id = (int)$_GET['user_id'];

try {
    // Query fetches all conversations for the user, including job title, other user info, last message, and unread count
    $query = "
        SELECT 
            c.id as conversation_id,
            c.job_id,
            j.title as job_title,
            u.id as other_user_id,
            u.first_name,
            u.last_name,
            u.company_name,
            u.profile_image_url,
            (SELECT message_text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
            (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND receiver_id = :user_id AND is_read = 0) as unread_count
        FROM conversations c
        JOIN users u ON u.id = IF(c.user_one_id = :user_id, c.user_two_id, c.user_one_id)
        LEFT JOIN jobs j ON c.job_id = j.id 
        WHERE (c.user_one_id = :user_id OR c.user_two_id = :user_id)
        ORDER BY last_message_time DESC
    ";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode($conversations);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
?>
