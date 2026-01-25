<?php
// FILE: uniwiz-backend/api/get_recommended_jobs.php
// =================================================================
// This endpoint recommends jobs to a student based on their profile.
// It includes the company name and the student's application status for each job.

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

// Check if database connection is successful
if ($db === null) { 
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit(); 
}

// --- Input Validation ---
// Ensure a valid student_id is provided
if (!isset($_GET['student_id']) || !filter_var($_GET['student_id'], FILTER_VALIDATE_INT)) {
    http_response_code(400);
    echo json_encode(["message" => "A valid Student ID is required."]);
    exit();
}
$student_id = (int)$_GET['student_id'];

try {
    // 1. Get student's profile details (skills and preferred categories)
    $stmt_student = $db->prepare("SELECT skills, preferred_categories FROM student_profiles WHERE user_id = :student_id");
    $stmt_student->bindParam(':student_id', $student_id, PDO::PARAM_INT);
    $stmt_student->execute();
    $student_profile = $stmt_student->fetch(PDO::FETCH_ASSOC);

    $student_skills = $student_profile ? array_map('trim', explode(',', $student_profile['skills'])) : [];
    $student_categories = $student_profile ? array_map('trim', explode(',', $student_profile['preferred_categories'])) : [];

    // 2. Get all active jobs with company details and application status for this student
    $stmt_jobs = $db->prepare("
        SELECT 
            j.*, 
            jc.name as category_name,
            u.first_name as publisher_name,
            u.company_name,
            u.profile_image_url,
            ja.status as application_status
        FROM jobs j 
        JOIN job_categories jc ON j.category_id = jc.id
        LEFT JOIN users u ON j.publisher_id = u.id
        LEFT JOIN job_applications ja ON j.id = ja.job_id AND ja.student_id = :student_id
        WHERE j.status = 'active'
    ");
    $stmt_jobs->bindParam(':student_id', $student_id, PDO::PARAM_INT);
    $stmt_jobs->execute();
    $all_jobs = $stmt_jobs->fetchAll(PDO::FETCH_ASSOC);

    $recommended_jobs = [];

    // 3. Score each job based on relevance to the student's profile
    foreach ($all_jobs as $job) {
        $score = 0;
        $job_skills = array_map('trim', explode(',', $job['skills_required']));

        // Add score if job category matches student's preferred categories
        if (in_array($job['category_name'], $student_categories)) {
            $score += 5;
        }

        // Add score for each matching skill
        $matching_skills = array_intersect($job_skills, $student_skills);
        $score += count($matching_skills) * 2;

        // Only recommend jobs with a positive score
        if ($score > 0) {
            $job['recommendation_score'] = $score;
            $recommended_jobs[] = $job;
        }
    }

    // 4. Sort jobs by recommendation score (highest first) and return the top 3
    usort($recommended_jobs, function($a, $b) {
        return $b['recommendation_score'] - $a['recommendation_score'];
    });

    http_response_code(200);
    echo json_encode(array_slice($recommended_jobs, 0, 3));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "An error occurred: " . $e->getMessage()]);
}
?>