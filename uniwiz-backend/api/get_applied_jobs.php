<?php
// FILE: uniwiz-backend/api/get_applied_jobs.php
// =================================================
// Fetches an array of job IDs a specific user has applied to.

// --- Set CORS and Content-Type Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// --- Handle Preflight Request for CORS ---
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

// --- Get user_id from the query string ---
// We expect a URL like: /get_applied_jobs.php?user_id=1
if (!isset($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "User ID is missing."]);
    exit();
}
$user_id = $_GET['user_id'];

// --- Main Logic to Fetch Applied Job IDs ---
try {
    // Select only the job_id column for the given student
    $query = "SELECT job_id FROM job_applications WHERE student_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    // Fetch all results into a simple numeric array of job IDs
    $applied_job_ids = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

    http_response_code(200);
    // The result will be like: [1, 5, 12]
    echo json_encode($applied_job_ids);

} catch (PDOException $e) {
    http_response_code(503); 
    echo json_encode(["message" => "Database error while fetching applied jobs."]);
}
?>
