<?php
// FILE: uniwiz-backend/api/manage_job_action_admin.php
// ===============================================================
// This endpoint handles admin-specific actions on jobs, such as deleting a job.

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
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

$data = json_decode(file_get_contents("php://input"));

// Basic validation: Ensure required fields are present
if ($data === null || !isset($data->job_id) || !isset($data->action) || !isset($data->admin_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Job ID, action, and Admin ID are required."]);
    exit();
}

$job_id = (int)$data->job_id;
$action = htmlspecialchars(strip_tags($data->action));
$admin_id = (int)$data->admin_id;

try {
    // Security check: Ensure the user performing the action is actually an admin
    $stmt_check = $db->prepare("SELECT role FROM users WHERE id = :admin_id");
    $stmt_check->bindParam(':admin_id', $admin_id, PDO::PARAM_INT);
    $stmt_check->execute();
    $admin_user = $stmt_check->fetch(PDO::FETCH_ASSOC);

    if (!$admin_user || $admin_user['role'] !== 'admin') {
        http_response_code(403); // Forbidden
        echo json_encode(["message" => "You do not have permission to perform this action."]);
        exit();
    }

    // Perform the requested action
    if ($action === 'delete') {
        // Use CASCADE DELETE in database schema to handle related applications, etc.
        $query = "DELETE FROM jobs WHERE id = :job_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':job_id', $job_id, PDO::PARAM_INT);

        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(["message" => "Job deleted successfully."]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Job not found or already deleted."]);
            }
        } else {
            throw new Exception("Failed to delete job.");
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Invalid action specified for admin. Only 'delete' is supported here."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "A server error occurred: " . $e->getMessage()]);
}
?>