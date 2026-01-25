<?php
// FILE: uniwiz-backend/api/get_student_stats.php
// =========================================================
// This endpoint fetches statistics for a student, including profile completion,
// accepted applications, and profile views.

// --- Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
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

// Validate student_id parameter
if (!isset($_GET['student_id']) || !filter_var($_GET['student_id'], FILTER_VALIDATE_INT)) {
    http_response_code(400);
    echo json_encode(["message" => "A valid Student ID is required."]);
    exit();
}
$student_id = (int)$_GET['student_id'];

try {
    $stats = [];

    // 1. Applications Sent Count
    $stmt_sent = $db->prepare("SELECT COUNT(*) as count FROM job_applications WHERE student_id = :student_id");
    $stmt_sent->bindParam(':student_id', $student_id, PDO::PARAM_INT);
    $stmt_sent->execute();
    $stats['applications_sent'] = $stmt_sent->fetch(PDO::FETCH_ASSOC)['count'];

    // 2. Accepted Applications Count
    $stmt_accepted = $db->prepare("SELECT COUNT(*) as count FROM job_applications WHERE student_id = :student_id AND status = 'accepted'");
    $stmt_accepted->bindParam(':student_id', $student_id, PDO::PARAM_INT);
    $stmt_accepted->execute();
    $stats['applications_accepted'] = $stmt_accepted->fetch(PDO::FETCH_ASSOC)['count'];

    // 3. Profile Views (applications with status 'viewed')
    $stmt_viewed = $db->prepare("SELECT COUNT(*) as count FROM job_applications WHERE student_id = :student_id AND status = 'viewed'");
    $stmt_viewed->bindParam(':student_id', $student_id, PDO::PARAM_INT);
    $stmt_viewed->execute();
    $stats['profile_views'] = $stmt_viewed->fetch(PDO::FETCH_ASSOC)['count'];

    // 4. Calculate Profile Completion Percentage
    $query_profile = "
        SELECT u.profile_image_url, sp.*
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.id = :student_id
    ";
    $stmt_profile = $db->prepare($query_profile);
    $stmt_profile->bindParam(':student_id', $student_id, PDO::PARAM_INT);
    $stmt_profile->execute();
    $profile_data = $stmt_profile->fetch(PDO::FETCH_ASSOC);

    $completed_fields = 0;
    $total_fields = 6; // Total fields tracked for profile completion

    if ($profile_data) {
        if (!empty($profile_data['profile_image_url'])) $completed_fields++;
        if (!empty($profile_data['university_name'])) $completed_fields++;
        if (!empty($profile_data['field_of_study'])) $completed_fields++;
        if (!empty($profile_data['year_of_study'])) $completed_fields++;
        if (!empty($profile_data['skills'])) $completed_fields++;
        if (!empty($profile_data['cv_url'])) $completed_fields++;
    }
    
    $stats['profile_completion_percentage'] = ($total_fields > 0) ? round(($completed_fields / $total_fields) * 100) : 0;

    http_response_code(200);
    echo json_encode($stats);

} catch (PDOException $e) {
    http_response_code(503);
    echo json_encode(["message" => "A database error occurred while fetching student stats."]);
}
?>
