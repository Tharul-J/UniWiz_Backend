<?php
// FILE: uniwiz-backend/api/get_student_application_details.php
// =======================================================================
// This endpoint fetches all details for a student's job applications,
// including job title, publisher, date applied, application status, and job status.

// --- Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // OK
    exit();
}

// --- Database Connection ---
include_once '../config/database.php'; // Include database connection
$database = new Database();
$db = $database->getConnection();

// Check for database connection failure
if ($db === null) {
    http_response_code(503); // Service Unavailable
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

// --- Get and Validate student_id ---
// Ensure student_id is provided and is a valid integer
if (!isset($_GET['student_id']) || !filter_var($_GET['student_id'], FILTER_VALIDATE_INT)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "A valid Student ID is required."]);
    exit();
}
$student_id = (int)$_GET['student_id'];

try {
    // SQL query to fetch application details, joining with jobs and users tables
    // to get job title, publisher name, job status, and application status.
    $query = "
        SELECT
            ja.job_id,
            j.title AS job_title,
            j.status AS job_status, -- Job status (e.g., active, closed)
            u.first_name AS publisher_name,
            ja.applied_at,
            ja.status AS application_status -- Application status for the student
        FROM
            job_applications ja
        JOIN
            jobs j ON ja.job_id = j.id
        JOIN
            users u ON j.publisher_id = u.id
        WHERE
            ja.student_id = :student_id
        ORDER BY
            ja.applied_at DESC
    ";

    // Prepare the SQL statement
    $stmt = $db->prepare($query);

    // Bind the student_id parameter
    $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);

    // Execute the statement
    $stmt->execute();

    // Fetch all applications as an associative array
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    // Return applications as JSON
    echo json_encode($applications);

} catch (PDOException $e) {
    // Catch any PDO (database) exceptions
    http_response_code(503); // Service Unavailable
    echo json_encode(["message" => "A database error occurred while fetching student applications."]);
} catch (Exception $e) {
    // Catch any other general exceptions
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "An unexpected server error occurred."]);
}
?>