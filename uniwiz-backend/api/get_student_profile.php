<?php
// FILE: uniwiz-backend/api/get_student_profile.php
// =====================================================================
// This endpoint fetches all public details for a specific student, including their verification status.

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
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

// Validate student_id parameter
if (!isset($_GET['student_id']) || !filter_var($_GET['student_id'], FILTER_VALIDATE_INT)) {
    http_response_code(400);
    echo json_encode(["message" => "A valid Student ID is required."]);
    exit();
}
$student_id = (int)$_GET['student_id'];

try {
    // Query fetches student public profile details, including verification status
    $query = "
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.profile_image_url,
            u.is_verified,
            sp.university_name,
            sp.field_of_study,
            sp.year_of_study,
            sp.languages_spoken,
            sp.skills,
            sp.cv_url
        FROM
            users u
        LEFT JOIN
            student_profiles sp ON u.id = sp.user_id
        WHERE
            u.id = :student_id AND u.role = 'student'
        LIMIT 1
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
    $stmt->execute();

    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($student) {
        http_response_code(200);
        echo json_encode($student);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Student not found."]);
    }

} catch (PDOException $e) {
    http_response_code(503);
    echo json_encode(["message" => "A database error occurred: " . $e->getMessage()]);
}
?>