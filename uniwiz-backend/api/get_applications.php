<?php
// FILE: uniwiz-backend/api/get_applications.php
// =================================================
// This endpoint fetches all student applications for a specific job.

// --- Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// --- Handle Preflight Request ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

// --- Get job_id from the query string ---
// We expect a URL like: /get_applications.php?job_id=12
if (!isset($_GET['job_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "Job ID is missing."]);
    exit();
}
$job_id = $_GET['job_id'];

// --- Main Logic to Fetch Applications ---
try {
    // Query joins the job_applications table with the users table
    // to get the details of each student who applied for the job
    $query = "
        SELECT 
            u.id as student_id,
            u.first_name,
            u.last_name,
            u.email,
            ja.status,
            ja.applied_at
        FROM 
            job_applications as ja
        JOIN 
            users as u ON ja.student_id = u.id
        WHERE 
            ja.job_id = :job_id
        ORDER BY 
            ja.applied_at DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':job_id', $job_id);
    $stmt->execute();
    
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($applications);

} catch (PDOException $e) {
    http_response_code(503); 
    echo json_encode(["message" => "Database error while fetching applications."]);
}
?>
