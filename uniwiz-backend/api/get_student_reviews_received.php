<?php
// FILE: uniwiz-backend/api/get_student_reviews_received.php
// ========================================================
// This endpoint fetches all reviews received by a student from publishers

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

// Validate that student_id is provided
if (!isset($_GET['student_id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing student_id parameter']);
    exit;
}

$student_id = (int)$_GET['student_id'];

try {
    // Fetch all reviews for the student with publisher info and job details
    $stmt = $db->prepare("
        SELECT 
            sr.id as review_id,
            sr.rating, 
            sr.review_text, 
            sr.created_at,
            sr.updated_at,
            u.id as publisher_id,
            u.first_name as publisher_first_name, 
            u.last_name as publisher_last_name,
            u.company_name,
            u.profile_image_url as publisher_image_url,
            j.id as job_id,
            j.title as job_title
        FROM student_reviews sr
        JOIN users u ON sr.publisher_id = u.id
        LEFT JOIN jobs j ON sr.job_id = j.id
        WHERE sr.student_id = :student_id AND sr.status = 'active'
        ORDER BY sr.created_at DESC
    ");
    $stmt->bindParam(':student_id', $student_id);
    $stmt->execute();
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate average rating for the student
    $avgStmt = $db->prepare("
        SELECT 
            AVG(rating) as avg_rating,
            COUNT(*) as total_reviews
        FROM student_reviews 
        WHERE student_id = :student_id AND status = 'active'
    ");
    $avgStmt->bindParam(':student_id', $student_id);
    $avgStmt->execute();
    $stats = $avgStmt->fetch(PDO::FETCH_ASSOC);

    // Get rating distribution
    $distStmt = $db->prepare("
        SELECT 
            rating,
            COUNT(*) as count
        FROM student_reviews 
        WHERE student_id = :student_id AND status = 'active'
        GROUP BY rating
        ORDER BY rating DESC
    ");
    $distStmt->bindParam(':student_id', $student_id);
    $distStmt->execute();
    $rating_distribution = $distStmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the response
    echo json_encode([
        'reviews' => $reviews,
        'stats' => [
            'avg_rating' => $stats['avg_rating'] ? round($stats['avg_rating'], 2) : 0,
            'total_reviews' => (int)$stats['total_reviews'],
            'rating_distribution' => $rating_distribution
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(503);
    echo json_encode(['message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Server error: ' . $e->getMessage()]);
}
?>