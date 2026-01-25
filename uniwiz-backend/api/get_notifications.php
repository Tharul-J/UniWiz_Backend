<?php
// FILE: uniwiz-backend/api/get_notifications.php (NEW FILE)
// =====================================================================
// This file fetches all notifications for a given user.

// --- Set CORS and Content-Type Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// --- Handle preflight OPTIONS request for CORS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// --- Database Connection ---
include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

// --- Check for database connection failure ---
if ($db === null) {
    http_response_code(503); // Service Unavailable
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

// --- Get and Validate user_id ---
// Ensure user_id is provided and is a valid integer
if (!isset($_GET['user_id']) || !filter_var($_GET['user_id'], FILTER_VALIDATE_INT)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "A valid User ID is required."]);
    exit();
}
$user_id = (int)$_GET['user_id'];

try {
    // --- Query to fetch all notifications for the specified user ---
    $query = "
        SELECT
            id,
            user_id,
            type,
            message,
            link,
            is_read,
            created_at
        FROM
            notifications
        WHERE
            user_id = :user_id
        ORDER BY
            created_at DESC
        LIMIT 20
    "; // Limit to the latest 20 notifications for performance

    // Prepare and execute the statement
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();

    // Fetch all notifications
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return the notifications as JSON
    http_response_code(200);
    echo json_encode($notifications);

} catch (PDOException $e) {
    // Handle any database errors
    http_response_code(503);
    echo json_encode(["message" => "A database error occurred: " . $e->getMessage()]);
}
?>
