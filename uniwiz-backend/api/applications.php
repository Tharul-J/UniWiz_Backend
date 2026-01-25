<?php
// FILE: uniwiz-backend/api/applications.php
// ==================================================================================
// This endpoint allows a student to apply for a job and notifies the publisher.
// The notification includes a direct link to the application for the frontend.

// --- Headers, DB Connection ---
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
    echo json_encode(array("message" => "Database connection failed."));
    exit();
}
$data = json_decode(file_get_contents("php://input"));

// --- Validate Input ---
if ($data === null || !isset($data->user_id) || !isset($data->job_id) || !isset($data->proposal)) {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. User ID, Job ID, and Proposal are required."));
    exit();
}

// --- Main Application Logic ---
try {
    // Start a transaction
    $db->beginTransaction();

    $studentId = htmlspecialchars(strip_tags($data->user_id));
    $jobId = htmlspecialchars(strip_tags($data->job_id));
    $proposal = htmlspecialchars(strip_tags($data->proposal));
    $status = "pending";

    // 1. Check if the user has already applied for this job
    $query_check = "SELECT id FROM job_applications WHERE student_id = :student_id AND job_id = :job_id";
    $stmt_check = $db->prepare($query_check);
    $stmt_check->bindParam(':student_id', $studentId);
    $stmt_check->bindParam(':job_id', $jobId);
    $stmt_check->execute();

    if ($stmt_check->rowCount() > 0) {
        http_response_code(409); // Conflict
        echo json_encode(array("message" => "You have already applied for this job."));
        $db->rollBack(); // Rollback the transaction
        exit();
    } 
    
    // 2. If not, insert the new application
    $query_insert = "INSERT INTO job_applications (student_id, job_id, proposal, status) VALUES (:student_id, :job_id, :proposal, :status)";
    $stmt_insert = $db->prepare($query_insert);

    $stmt_insert->bindParam(':student_id', $studentId);
    $stmt_insert->bindParam(':job_id', $jobId);
    $stmt_insert->bindParam(':proposal', $proposal);
    $stmt_insert->bindParam(':status', $status);

    if(!$stmt_insert->execute()){
        throw new Exception("Could not execute the application insert statement.");
    }
    
    // Get the ID of the application we just created
    $new_application_id = $db->lastInsertId();
        
    // 3. Create a notification for the publisher
    $query_info = "
        SELECT 
            u.first_name, u.last_name, 
            j.title as job_title, j.publisher_id 
        FROM users u, jobs j 
        WHERE u.id = :student_id AND j.id = :job_id
    ";
    $stmt_info = $db->prepare($query_info);
    $stmt_info->bindParam(':student_id', $studentId, PDO::PARAM_INT);
    $stmt_info->bindParam(':job_id', $jobId, PDO::PARAM_INT);
    $stmt_info->execute();
    $info = $stmt_info->fetch(PDO::FETCH_ASSOC);

    if ($info) {
        $student_name = $info['first_name'] . ' ' . $info['last_name'];
        $job_title = $info['job_title'];
        $publisher_id = $info['publisher_id'];
        
        $notification_message = "$student_name has applied for your job \"$job_title\".";
        $notification_type = 'new_applicant';
        // The link now includes the application ID to directly open the modal.
        $notification_link = "/applicants/view/{$new_application_id}"; 

        $query_notif = "INSERT INTO notifications (user_id, type, message, link) VALUES (:user_id, :type, :message, :link)";
        $stmt_notif = $db->prepare($query_notif);
        $stmt_notif->bindParam(':user_id', $publisher_id, PDO::PARAM_INT);
        $stmt_notif->bindParam(':type', $notification_type);
        $stmt_notif->bindParam(':message', $notification_message);
        $stmt_notif->bindParam(':link', $notification_link);
        
        if (!$stmt_notif->execute()) {
             throw new Exception("Failed to create notification for publisher.");
        }
    }

    $db->commit();
    http_response_code(201);
    echo json_encode(array("message" => "Application submitted successfully."));

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(503);
    echo json_encode(array("message" => "A server error occurred: " . $e->getMessage()));
}
?>
