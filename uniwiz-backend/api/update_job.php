<?php
// FILE: uniwiz-backend/api/update_job.php
// ===================================================
// This endpoint handles updating an existing job posting with all details.

// --- Headers & DB Connection ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

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

$data = json_decode(file_get_contents("php://input"));

// --- Validate Data ---
if ($data === null || !isset($data->id) || !isset($data->title)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Job ID and title are required."]);
    exit();
}

try {
    // Update all job fields with new values
    $query = "
        UPDATE jobs SET 
            title = :title,
            description = :description,
            category_id = :category_id,
            skills_required = :skills_required,
            job_type = :job_type,
            payment_range = :payment_range,
            start_date = :start_date,
            end_date = :end_date,
            status = :status,
            work_mode = :work_mode,
            location = :location,
            application_deadline = :application_deadline,
            vacancies = :vacancies,
            working_hours = :working_hours,
            experience_level = :experience_level
        WHERE id = :job_id
    ";

    $stmt = $db->prepare($query);

    // Sanitize data
    $job_id = htmlspecialchars(strip_tags($data->id));
    $title = htmlspecialchars(strip_tags($data->title));
    $description = htmlspecialchars(strip_tags($data->description));
    $category_id = htmlspecialchars(strip_tags($data->category_id));
    $skills_required = isset($data->skills_required) ? htmlspecialchars(strip_tags($data->skills_required)) : "";
    $job_type = htmlspecialchars(strip_tags($data->job_type));
    $payment_range = htmlspecialchars(strip_tags($data->payment_range));
    $start_date = !empty($data->start_date) ? htmlspecialchars(strip_tags($data->start_date)) : null;
    $end_date = !empty($data->end_date) ? htmlspecialchars(strip_tags($data->end_date)) : null;
    $status = htmlspecialchars(strip_tags($data->status));

    // Sanitize new fields
    $work_mode = isset($data->work_mode) ? htmlspecialchars(strip_tags($data->work_mode)) : 'on-site';
    $location = isset($data->location) ? htmlspecialchars(strip_tags($data->location)) : null;
    $application_deadline = isset($data->application_deadline) && !empty($data->application_deadline) ? htmlspecialchars(strip_tags($data->application_deadline)) : null;
    $vacancies = isset($data->vacancies) ? filter_var($data->vacancies, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]) : 1;
    $working_hours = isset($data->working_hours) ? htmlspecialchars(strip_tags($data->working_hours)) : null;
    $experience_level = isset($data->experience_level) ? htmlspecialchars(strip_tags($data->experience_level)) : 'any';

    // Bind parameters
    $stmt->bindParam(':job_id', $job_id);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':category_id', $category_id);
    $stmt->bindParam(':skills_required', $skills_required);
    $stmt->bindParam(':job_type', $job_type);
    $stmt->bindParam(':payment_range', $payment_range);
    $stmt->bindParam(':start_date', $start_date);
    $stmt->bindParam(':end_date', $end_date);
    $stmt->bindParam(':status', $status);
    
    // Bind new parameters
    $stmt->bindParam(':work_mode', $work_mode);
    $stmt->bindParam(':location', $location);
    $stmt->bindParam(':application_deadline', $application_deadline);
    $stmt->bindParam(':vacancies', $vacancies, PDO::PARAM_INT);
    $stmt->bindParam(':working_hours', $working_hours);
    $stmt->bindParam(':experience_level', $experience_level);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Job updated successfully."]);
    } else {
        throw new Exception("Failed to update job.");
    }

} catch (Exception $e) {
    http_response_code(503);
    echo json_encode(["message" => "A server error occurred during update: " . $e->getMessage()]);
}
?>
