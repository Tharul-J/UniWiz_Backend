<?php
// FILE: uniwiz-backend/api/get_reviewable_students.php
// ====================================================
// This endpoint gets students that a publisher can review (based on accepted job applications)

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
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

// Validate that publisher_id is provided
if (!isset($_GET['publisher_id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing publisher_id parameter']);
    exit;
}

$publisher_id = (int)$_GET['publisher_id'];

try {
    // Get students who have accepted applications with this publisher
    $stmt = $db->prepare("
        SELECT DISTINCT
            s.id as student_id,
            s.first_name,
            s.last_name,
            s.email,
            s.profile_image_url,
            j.id as job_id,
            j.title as job_title,
            sr.id as existing_review_id,
            sr.rating as existing_rating,
            sr.review_text as existing_review_text,
            sr.created_at as review_created_at
        FROM job_applications ja
        JOIN users s ON ja.student_id = s.id
        JOIN jobs j ON ja.job_id = j.id
        LEFT JOIN student_reviews sr ON (sr.publisher_id = :publisher_id AND sr.student_id = s.id AND sr.job_id = j.id)
        WHERE j.publisher_id = :publisher_id 
        AND ja.status = 'accepted'
        AND s.role = 'student'
        ORDER BY s.first_name ASC
    ");
    
    $stmt->bindParam(':publisher_id', $publisher_id);
    $stmt->execute();
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group students by whether they have been reviewed or not
    $reviewed = [];
    $not_reviewed = [];

    foreach ($students as $student) {
        if ($student['existing_review_id']) {
            $reviewed[] = $student;
        } else {
            $not_reviewed[] = $student;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'not_reviewed' => $not_reviewed,
            'reviewed' => $reviewed,
            'total_students' => count($students),
            'reviewed_count' => count($reviewed),
            'pending_reviews' => count($not_reviewed)
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>