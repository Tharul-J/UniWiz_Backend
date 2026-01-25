<?php
// FILE: uniwiz-backend/api/mark_notification_read.php
// =====================================================================
// This endpoint marks a specific notification as read for a user.

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// --- Database Connection ---
include_once '../config/database.php'; // Include database connection
$database = new Database();
$db = $database->getConnection();

// Check for database connection failure
if ($db === null) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

// Get the posted data
$data = json_decode(file_get_contents("php://input"));

// Validate the incoming data
if ($data === null || !isset($data->notification_id) || !isset($data->user_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Notification ID and User ID are required."]);
    exit();
}

try {
    // Update the notification status to 'read' (is_read = 1)
    // Also check that the notification belongs to the user making the request for security.
    $query = "UPDATE notifications SET is_read = 1 WHERE id = :notification_id AND user_id = :user_id";
    $stmt = $db->prepare($query);

    // Sanitize and bind parameters
    $notification_id = htmlspecialchars(strip_tags($data->notification_id));
    $user_id = htmlspecialchars(strip_tags($data->user_id));

    $stmt->bindParam(':notification_id', $notification_id, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);

    // Execute the query
    if ($stmt->execute()) {
        // Check if any row was actually updated
        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(["message" => "Notification marked as read."]);
        } else {
            // This can happen if the notification doesn't exist or doesn't belong to the user
            http_response_code(404);
            echo json_encode(["message" => "Notification not found for this user or already marked as read."]);
        }
    } else {
        // Throw an exception if the query fails
        throw new Exception("Failed to update notification.");
    }

} catch (Exception $e) {
    // Handle any server errors
    http_response_code(503);
    echo json_encode(["message" => "A server error occurred: " . $e->getMessage()]);
}
?>
