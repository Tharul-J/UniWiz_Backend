<?php
// FILE: uniwiz-backend/api/create_job.php
// ========================================================================
// This endpoint allows publishers to create a new job post, including payment calculation and admin notifications.

// --- Headers, DB Connection ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Content-Type: application/json; charset=UTF-8"); // Respond with JSON
header("Access-Control-Allow-Methods: POST, OPTIONS"); // Allow POST and OPTIONS methods
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
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
if ( $data === null || !isset($data->publisher_id) || !isset($data->title) || !isset($data->status) ) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
    exit();
}

// --- Function to calculate payment amount based on job type and duration ---
function calculatePaymentAmount($job_type, $payment_range, $start_date, $end_date) {
    // Extract numeric value from payment range (e.g., "5000-10000" -> 5000)
    $min_amount = 0;
    if (preg_match('/(\d+)/', $payment_range, $matches)) {
        $min_amount = (int)$matches[1];
    }
    
    // Calculate based on job type
    switch ($job_type) {
        case 'freelance':
            return $min_amount * 0.05; // 5% of payment range
        case 'part-time':
            return $min_amount * 0.03; // 3% of payment range
        case 'internship':
            return $min_amount * 0.02; // 2% of payment range
        case 'task-based':
            return $min_amount * 0.04; // 4% of payment range
        case 'full-time':
            return $min_amount * 0.08; // 8% of payment range
        default:
            return $min_amount * 0.05; // Default 5%
    }
}

// --- Function to create a notification for all admins ---
function createAdminNotification($db, $type, $message, $link) {
    // Fetch all admin user IDs
    $stmt_admins = $db->prepare("SELECT id FROM users WHERE role = 'admin'");
    $stmt_admins->execute();
    $admin_ids = $stmt_admins->fetchAll(PDO::FETCH_COLUMN, 0);

    if (empty($admin_ids)) {
        // No admins found to notify, just return
        return;
    }

    // Prepare and execute insert for each admin
    $query_notif = "INSERT INTO notifications (user_id, type, message, link) VALUES (:user_id, :type, :message, :link)";
    $stmt_notif = $db->prepare($query_notif);

    foreach ($admin_ids as $admin_id) {
        $stmt_notif->bindParam(':user_id', $admin_id, PDO::PARAM_INT);
        $stmt_notif->bindParam(':type', $type);
        $stmt_notif->bindParam(':message', $message);
        $stmt_notif->bindParam(':link', $link);
        $stmt_notif->execute();
    }
}

// --- Main Create Job Logic ---
try {
    $query = "
        INSERT INTO jobs 
        (publisher_id, category_id, title, description, skills_required, job_type, payment_range, start_date, end_date, status, work_mode, location, application_deadline, vacancies, working_hours, experience_level, payment_status, payment_amount, payment_method) 
        VALUES 
        (:publisher_id, :category_id, :title, :description, :skills_required, :job_type, :payment_range, :start_date, :end_date, :status, :work_mode, :location, :application_deadline, :vacancies, :working_hours, :experience_level, :payment_status, :payment_amount, :payment_method)
    ";

    $stmt = $db->prepare($query);

    // Sanitize data
    $publisher_id = htmlspecialchars(strip_tags($data->publisher_id));
    $category_id = htmlspecialchars(strip_tags($data->category_id));
    $title = htmlspecialchars(strip_tags($data->title));
    $description = htmlspecialchars(strip_tags($data->description));
    $job_type = htmlspecialchars(strip_tags($data->job_type));
    $payment_range = htmlspecialchars(strip_tags($data->payment_range));
    $skills_required = isset($data->skills_required) ? htmlspecialchars(strip_tags($data->skills_required)) : "";
    $start_date = isset($data->start_date) && !empty($data->start_date) ? htmlspecialchars(strip_tags($data->start_date)) : null;
    $end_date = isset($data->end_date) && !empty($data->end_date) ? htmlspecialchars(strip_tags($data->end_date)) : null;
    $status = htmlspecialchars(strip_tags($data->status));
    if ($status !== 'active' && $status !== 'draft') {
        $status = 'draft'; // Default to draft if invalid status is provided
    }

    // Sanitize new fields
    $work_mode = isset($data->work_mode) ? htmlspecialchars(strip_tags($data->work_mode)) : 'on-site';
    $location = isset($data->location) ? htmlspecialchars(strip_tags($data->location)) : null;
    $application_deadline = isset($data->application_deadline) && !empty($data->application_deadline) ? htmlspecialchars(strip_tags($data->application_deadline)) : null;
    $vacancies = isset($data->vacancies) ? filter_var($data->vacancies, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]) : 1;
    $working_hours = isset($data->working_hours) ? htmlspecialchars(strip_tags($data->working_hours)) : null;
    $experience_level = isset($data->experience_level) ? htmlspecialchars(strip_tags($data->experience_level)) : 'any';

    // --- Payment fields ---
    $payment_status = isset($data->payment_status) ? htmlspecialchars(strip_tags($data->payment_status)) : 'pending';
    $payment_method = isset($data->payment_method) ? htmlspecialchars(strip_tags($data->payment_method)) : null;
    
    // Calculate payment amount automatically
    $payment_amount = calculatePaymentAmount($job_type, $payment_range, $start_date, $end_date);

    // Bind parameters
    $stmt->bindParam(':publisher_id', $publisher_id);
    $stmt->bindParam(':category_id', $category_id);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':description', $description);
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

    // Bind payment parameters
    $stmt->bindParam(':payment_status', $payment_status);
    $stmt->bindParam(':payment_amount', $payment_amount);
    $stmt->bindParam(':payment_method', $payment_method);

    if ($stmt->execute()) {
        $job_id = $db->lastInsertId();
        
        // Create notification for admins if job is a draft (pending approval)
        if ($status === 'draft') {
            $notification_message = "New job posted: \"" . $title . "\" is pending approval.";
            createAdminNotification($db, 'new_job_pending_approval', $notification_message, '/job-management?filter=draft');
        }

        http_response_code(201);
        echo json_encode([
            "message" => "Job post saved successfully.",
            "job_id" => $job_id,
            "payment_amount" => $payment_amount,
            "payment_status" => $payment_status
        ]);
    } else {
        throw new Exception("Failed to save job post.");
    }

} catch (PDOException $e) {
    http_response_code(503); 
    echo json_encode(["message" => "A database error occurred while saving the job: " . $e->getMessage()]);
}
?>
