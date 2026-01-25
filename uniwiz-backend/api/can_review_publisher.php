<?php
// FILE: uniwiz-backend/api/can_review_publisher.php
// ========================================================
// This endpoint checks if a student can review a specific publisher
// (based on having accepted applications with that publisher)

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

// Validate required parameters
if (!isset($_GET['student_id']) || !isset($_GET['publisher_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "Student ID and Publisher ID are required."]);
    exit();
}

$student_id = (int)$_GET['student_id'];
$publisher_id = (int)$_GET['publisher_id'];

try {
    // Check if student has any accepted applications with this publisher
    $query = "
        SELECT COUNT(*) as accepted_applications 
        FROM job_applications ja 
        JOIN jobs j ON ja.job_id = j.id 
        WHERE ja.student_id = :student_id 
        AND j.publisher_id = :publisher_id 
        AND ja.status = 'accepted'
    ";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $student_id);
    $stmt->bindParam(':publisher_id', $publisher_id);
    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $canReview = $result['accepted_applications'] > 0;
    
    http_response_code(200);
    echo json_encode([
        "can_review" => $canReview,
        "accepted_applications" => (int)$result['accepted_applications'],
        "message" => $canReview ? 
            "Student can review this publisher." : 
            "Student has no accepted applications with this publisher."
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "An error occurred while checking review permissions: " . $e->getMessage()]);
}
?>