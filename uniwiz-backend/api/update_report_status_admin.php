<?php
// FILE: uniwiz-backend/api/update_report_status_admin.php
// DESCRIPTION: Allows an admin to update the status of a report.

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

// --- Parse and validate input ---
$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->report_id) || !isset($data->status) || !isset($data->admin_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Report ID, status, and Admin ID are required."]);
    exit();
}

try {
    // --- Security check: Ensure the user is an admin ---
    $stmt_check = $db->prepare("SELECT role FROM users WHERE id = :admin_id");
    $stmt_check->bindParam(':admin_id', $data->admin_id);
    $stmt_check->execute();
    $admin_user = $stmt_check->fetch(PDO::FETCH_ASSOC);

    if (!$admin_user || $admin_user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["message" => "Permission denied."]);
        exit();
    }

    // --- Validate allowed statuses ---
    $allowed_statuses = ['resolved', 'dismissed', 'pending'];
    if (!in_array($data->status, $allowed_statuses)) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid status provided."]);
        exit();
    }

    // --- Update the report status ---
    $query = "UPDATE reports SET status = :status WHERE id = :report_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':status', $data->status);
    $stmt->bindParam(':report_id', $data->report_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Report status updated successfully."]);
    } else {
        throw new Exception("Failed to update report status.");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
?>
