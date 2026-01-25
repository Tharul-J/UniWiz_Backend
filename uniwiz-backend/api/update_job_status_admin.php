<?php
// FILE: uniwiz-backend/api/update_job_status_admin.php (NEW FILE)
// ==============================================================
// This endpoint allows an admin to update the status of a job (e.g., approve/reject).

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
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

// --- Parse and validate input ---
$data = json_decode(file_get_contents("php://input"));

// Basic validation for required fields
if ($data === null || !isset($data->job_id) || !isset($data->status) || !isset($data->admin_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Job ID, new status, and Admin ID are required."]);
    exit();
}

try {
    // --- Security check: Ensure the user performing the action is actually an admin ---
    $stmt_check = $db->prepare("SELECT role FROM users WHERE id = :admin_id");
    $stmt_check->bindParam(':admin_id', $data->admin_id);
    $stmt_check->execute();
    $admin_user = $stmt_check->fetch(PDO::FETCH_ASSOC);

    if (!$admin_user || $admin_user['role'] !== 'admin') {
        http_response_code(403); // Forbidden
        echo json_encode(["message" => "You do not have permission to perform this action."]);
        exit();
    }

    // --- Validate allowed statuses for job ---
    $allowed_statuses = ['active', 'closed']; // Admin can approve ('active') or reject ('closed')
    if (!in_array($data->status, $allowed_statuses)) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid status provided for this action."]);
        exit();
    }

    // --- Update the job status ---
    $query = "UPDATE jobs SET status = :status WHERE id = :job_id";
    $stmt = $db->prepare($query);

    $stmt->bindParam(':status', $data->status);
    $stmt->bindParam(':job_id', $data->job_id);

    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(["message" => "Job status updated successfully."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Job not found or status is already the same."]);
        }
    } else {
        throw new Exception("Failed to update job status.");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "A server error occurred: " . $e->getMessage()]);
}
?>
 