<?php
// FILE: uniwiz-backend/api/extend_job_deadline.php
// =====================================================
// This endpoint allows extending the application deadline for a job.
// It updates the deadline and sets the job status to 'active'.

// --- Set CORS and Content-Type Headers ---
header("Access-Control-Allow-Origin: *"); // Allow requests from any origin
header("Access-Control-Allow-Methods: POST, OPTIONS"); // Allow POST and OPTIONS methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// --- Handle preflight OPTIONS request for CORS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

include_once '../config/database.php'; // Include database connection
$database = new Database();
$db = $database->getConnection();

// --- Check if database connection is successful ---
if ($db === null) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true); // Get POST data as associative array

// --- Validate required fields ---
if (!isset($data['job_id']) || !isset($data['new_deadline'])) {
    http_response_code(400);
    echo json_encode(["message" => "Missing job_id or new_deadline."]);
    exit();
}

$job_id = (int)$data['job_id'];
$new_deadline = $data['new_deadline'];

try {
    // --- Update the job's application deadline and set status to 'active' ---
    $query = "UPDATE jobs SET application_deadline = :new_deadline, status = 'active' WHERE id = :job_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':new_deadline', $new_deadline);
    $stmt->bindParam(':job_id', $job_id, PDO::PARAM_INT);
    $stmt->execute();

    http_response_code(200);
    echo json_encode(["message" => "Job deadline extended successfully."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
?> 