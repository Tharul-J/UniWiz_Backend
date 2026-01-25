<?php
// FILE: uniwiz-backend/api/update_application_status.php (ENHANCED with Vacancy Check)
// ===================================================================================
// This file now checks if the vacancy limit has been reached before accepting an applicant.

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

// --- Check DB connection ---
if ($db === null) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

// --- Parse and validate input ---
$data = json_decode(file_get_contents("php://input"));

if ($data === null || !isset($data->application_id) || !isset($data->status)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Application ID and new status are required."]);
    exit();
}

// --- Allowed statuses for application ---
$allowed_statuses = ['viewed', 'accepted', 'rejected', 'pending'];
if (!in_array($data->status, $allowed_statuses)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid status provided."]);
    exit();
}

$application_id = htmlspecialchars(strip_tags($data->application_id));
$status = htmlspecialchars(strip_tags($data->status));

try {
    $db->beginTransaction(); // Start transaction for atomicity

    // --- If status is 'accepted', check if job has available vacancies ---
    if ($status === 'accepted') {
        // 1. Get job_id from the application
        $stmt_job_info = $db->prepare("SELECT job_id FROM job_applications WHERE id = :application_id");
        $stmt_job_info->bindParam(':application_id', $application_id, PDO::PARAM_INT);
        $stmt_job_info->execute();
        $job_info = $stmt_job_info->fetch(PDO::FETCH_ASSOC);

        if (!$job_info) {
            throw new Exception("Application not found.");
        }
        $job_id = $job_info['job_id'];

        // 2. Get vacancy count and current accepted count for the job
        $stmt_vacancy = $db->prepare("
            SELECT 
                j.vacancies,
                (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted') as accepted_count
            FROM jobs j
            WHERE j.id = :job_id
        ");
        $stmt_vacancy->bindParam(':job_id', $job_id, PDO::PARAM_INT);
        $stmt_vacancy->execute();
        $vacancy_details = $stmt_vacancy->fetch(PDO::FETCH_ASSOC);

        // 3. Compare and throw error if limit is reached
        if ($vacancy_details && $vacancy_details['accepted_count'] >= $vacancy_details['vacancies']) {
            http_response_code(409); // 409 Conflict
            echo json_encode(["message" => "Vacancy limit reached. Cannot accept more applicants for this job."]);
            $db->rollBack();
            exit();
        }
    }

    // --- Update the application status ---
    $query_update = "UPDATE job_applications SET status = :status WHERE id = :application_id";
    $stmt_update = $db->prepare($query_update);
    $stmt_update->bindParam(':status', $status);
    $stmt_update->bindParam(':application_id', $application_id);

    if ($stmt_update->execute()) {
        if ($stmt_update->rowCount() > 0) {
            
            // --- Create a notification for the student if accepted or rejected ---
            if ($status === 'accepted' || $status === 'rejected') {
                $query_info = "SELECT ja.student_id, j.title as job_title FROM job_applications ja JOIN jobs j ON ja.job_id = j.id WHERE ja.id = :application_id";
                $stmt_info = $db->prepare($query_info);
                $stmt_info->bindParam(':application_id', $application_id, PDO::PARAM_INT);
                $stmt_info->execute();
                $app_info = $stmt_info->fetch(PDO::FETCH_ASSOC);

                if ($app_info) {
                    $student_id = $app_info['student_id'];
                    $job_title = $app_info['job_title'];
                    $notification_type = 'application_' . $status;
                    $notification_message = "Congratulations! Your application for the job \"$job_title\" has been $status.";
                    if ($status === 'rejected') {
                        $notification_message = "Your application for the job \"$job_title\" has been updated to '$status'.";
                    }

                    $query_notif = "INSERT INTO notifications (user_id, type, message, link) VALUES (:user_id, :type, :message, '/applied-jobs')";
                    $stmt_notif = $db->prepare($query_notif);
                    $stmt_notif->bindParam(':user_id', $student_id, PDO::PARAM_INT);
                    $stmt_notif->bindParam(':type', $notification_type);
                    $stmt_notif->bindParam(':message', $notification_message);
                    $stmt_notif->execute();
                }
            }

            $db->commit(); // Commit transaction
            http_response_code(200);
            echo json_encode(["message" => "Application status updated successfully."]);

        } else {
            $db->rollBack();
            http_response_code(404);
            echo json_encode(["message" => "Application not found or status is already the same."]);
        }
    } else {
        throw new Exception("Failed to update application status.");
    }

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(503);
    echo json_encode(["message" => "A server error occurred: " . $e->getMessage()]);
}
?>
