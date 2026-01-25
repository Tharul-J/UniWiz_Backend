<?php
// FILE: uniwiz-backend/api/get_job_details.php
// ===============================================================================
// This endpoint fetches all details for a single job, including the company name
// and optionally the application status for a specific student.

// --- Headers & DB Connection ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
include_once '../config/database.php'; // Include database connection
$database = new Database();
$db = $database->getConnection();
if ($db === null) { 
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

// --- Get parameters ---
// Validate job_id parameter
if (!isset($_GET['job_id']) || !filter_var($_GET['job_id'], FILTER_VALIDATE_INT)) {
    http_response_code(400);
    echo json_encode(["message" => "A valid Job ID is required."]);
    exit();
}
$job_id = (int)$_GET['job_id'];
// Optionally get student_id to fetch application status
$student_id = isset($_GET['student_id']) ? (int)$_GET['student_id'] : null;

try {
    // Build query to fetch job details, company name, and accepted count
    $query = "
        SELECT 
            j.*,
            u.company_name,
            (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted') as accepted_count";

    // If a student_id is provided, get their specific application status
    if ($student_id !== null) {
        $query .= ", ja.status as application_status ";
    }
    
    $query .= "
        FROM 
            jobs j
        LEFT JOIN
            users u ON j.publisher_id = u.id ";

    // Conditionally join the job_applications table if student_id is provided
    if ($student_id !== null) {
        $query .= " LEFT JOIN job_applications ja ON j.id = ja.job_id AND ja.student_id = :student_id ";
    }

    $query .= " WHERE j.id = :job_id LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':job_id', $job_id, PDO::PARAM_INT);
    // Bind student_id only if it's provided
    if ($student_id !== null) {
        $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
    }
    
    $stmt->execute();
    
    $job = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($job) {
        // Ensure application_status is set to null if not found, for consistency
        if ($student_id !== null && !isset($job['application_status'])) {
            $job['application_status'] = null;
        }
        http_response_code(200);
        echo json_encode($job);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Job not found."]);
    }

} catch (PDOException $e) {
    http_response_code(503); 
    echo json_encode(["message" => "Database error while fetching job details: " . $e->getMessage()]);
}
?>
