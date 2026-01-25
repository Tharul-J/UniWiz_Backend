<?php
// FILE: uniwiz-backend/api/send_message.php
// =================================================================
// This endpoint allows a user to send a message to another user.
// It ensures only ONE conversation thread exists between two users, regardless of job context.
// The job_id is only used when creating the conversation for the first time.

// --- Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// --- Database Connection ---
include_once '../config/database.php'; // Include database connection
$database = new Database();
$db = $database->getConnection();

// Check if database connection is successful
if ($db === null) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

// --- Get and Validate Input Data ---
$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->sender_id) || !isset($data->receiver_id) || !isset($data->message_text) || !isset($data->job_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Sender, receiver, message, and job_id are required."]);
    exit();
}

$sender_id = (int)$data->sender_id;
$receiver_id = (int)$data->receiver_id;
$job_id = (int)$data->job_id;
$message_text = htmlspecialchars(strip_tags($data->message_text));

if (empty(trim($message_text))) {
    http_response_code(400);
    echo json_encode(["message" => "Message cannot be empty."]);
    exit();
}

try {
    $db->beginTransaction();

    // Step 1: Find conversation based ONLY on user IDs.
    $query_conv = "SELECT id FROM conversations WHERE 
                   (user_one_id = :u1 AND user_two_id = :u2) OR (user_one_id = :u2 AND user_two_id = :u1)";
    $stmt_conv = $db->prepare($query_conv);
    $stmt_conv->bindParam(':u1', $sender_id, PDO::PARAM_INT);
    $stmt_conv->bindParam(':u2', $receiver_id, PDO::PARAM_INT);
    $stmt_conv->execute();

    if ($stmt_conv->rowCount() > 0) {
        // Conversation already exists
        $conversation = $stmt_conv->fetch(PDO::FETCH_ASSOC);
        $conversation_id = $conversation['id'];
    } else {
        // Step 2: If no conversation exists, create a new one, storing the initial job_id for context.
        $query_create_conv = "INSERT INTO conversations (user_one_id, user_two_id, job_id) VALUES (:u1, :u2, :job_id)";
        $stmt_create_conv = $db->prepare($query_create_conv);
        $stmt_create_conv->bindParam(':u1', $sender_id, PDO::PARAM_INT);
        $stmt_create_conv->bindParam(':u2', $receiver_id, PDO::PARAM_INT);
        $stmt_create_conv->bindParam(':job_id', $job_id, PDO::PARAM_INT);
        $stmt_create_conv->execute();
        $conversation_id = $db->lastInsertId();
    }

    // Step 3: Insert the message into the messages table.
    $query_msg = "INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text) VALUES (:conv_id, :sender_id, :receiver_id, :msg_text)";
    $stmt_msg = $db->prepare($query_msg);
    $stmt_msg->bindParam(':conv_id', $conversation_id, PDO::PARAM_INT);
    $stmt_msg->bindParam(':sender_id', $sender_id, PDO::PARAM_INT);
    $stmt_msg->bindParam(':receiver_id', $receiver_id, PDO::PARAM_INT);
    $stmt_msg->bindParam(':msg_text', $message_text, PDO::PARAM_STR);
    
    if($stmt_msg->execute()){
        $db->commit();
        http_response_code(201);
        echo json_encode(["message" => "Message sent successfully.", "conversation_id" => $conversation_id]);
    } else {
        throw new Exception("Failed to send message.");
    }

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
?>
