<?php
// FILE: uniwiz-backend/api/create_student_review.php
// ====================================================
// This endpoint allows publishers to create/update reviews for students

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Only POST method is allowed."]);
    exit();
}

// Get POST data
$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->publisher_id, $data->student_id, $data->rating, $data->comment)) {
    http_response_code(400);
    echo json_encode(["message" => "Missing required fields: publisher_id, student_id, rating, comment"]);
    exit();
}

$publisher_id = (int)$data->publisher_id;
$student_id = (int)$data->student_id;
$job_id = isset($data->job_id) ? (int)$data->job_id : null;
$rating = (int)$data->rating;
$review_text = htmlspecialchars(strip_tags($data->comment));

// Validate rating
if ($rating < 1 || $rating > 5) {
    http_response_code(400);
    echo json_encode(["message" => "Rating must be between 1 and 5."]);
    exit();
}

// Validate review text
if (empty($review_text)) {
    http_response_code(400);
    echo json_encode(["message" => "Review text cannot be empty."]);
    exit();
}

try {
    $db->beginTransaction();

    // Check if publisher and student exist
    $stmt_check_users = $db->prepare("
        SELECT COUNT(*) as count 
        FROM users 
        WHERE (id = :publisher_id AND role = 'publisher') OR (id = :student_id AND role = 'student')
    ");
    $stmt_check_users->bindParam(':publisher_id', $publisher_id);
    $stmt_check_users->bindParam(':student_id', $student_id);
    $stmt_check_users->execute();
    
    if ($stmt_check_users->fetch(PDO::FETCH_ASSOC)['count'] != 2) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid publisher or student ID."]);
        exit();
    }

    // If job_id is provided, verify it exists and belongs to the publisher
    if ($job_id) {
        $stmt_check_job = $db->prepare("SELECT COUNT(*) as count FROM jobs WHERE id = :job_id AND publisher_id = :publisher_id");
        $stmt_check_job->bindParam(':job_id', $job_id);
        $stmt_check_job->bindParam(':publisher_id', $publisher_id);
        $stmt_check_job->execute();
        
        if ($stmt_check_job->fetch(PDO::FETCH_ASSOC)['count'] == 0) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid job ID or job doesn't belong to this publisher."]);
            exit();
        }
    }

    // Check if review already exists
    $query_check = "SELECT id FROM student_reviews WHERE publisher_id = :publisher_id AND student_id = :student_id AND (job_id = :job_id OR (job_id IS NULL AND :job_id IS NULL))";
    $stmt_check = $db->prepare($query_check);
    $stmt_check->bindParam(':publisher_id', $publisher_id);
    $stmt_check->bindParam(':student_id', $student_id);
    $stmt_check->bindParam(':job_id', $job_id);
    $stmt_check->execute();

    if ($stmt_check->rowCount() > 0) {
        // Update existing review
        $existing_review = $stmt_check->fetch(PDO::FETCH_ASSOC);
        $review_id = $existing_review['id'];
        
        $query_update = "UPDATE student_reviews SET rating = :rating, review_text = :review_text, updated_at = CURRENT_TIMESTAMP WHERE id = :review_id";
        $stmt_update = $db->prepare($query_update);
        $stmt_update->bindParam(':rating', $rating);
        $stmt_update->bindParam(':review_text', $review_text);
        $stmt_update->bindParam(':review_id', $review_id);
        
        if ($stmt_update->execute()) {
            $db->commit();
            http_response_code(200);
            echo json_encode(["message" => "Student review updated successfully."]);
        } else {
            throw new Exception("Failed to update review.");
        }
    } else {
        // Create new review
        $query_insert = "INSERT INTO student_reviews (publisher_id, student_id, job_id, rating, review_text) VALUES (:publisher_id, :student_id, :job_id, :rating, :review_text)";
        $stmt_insert = $db->prepare($query_insert);
        $stmt_insert->bindParam(':publisher_id', $publisher_id);
        $stmt_insert->bindParam(':student_id', $student_id);
        $stmt_insert->bindParam(':job_id', $job_id);
        $stmt_insert->bindParam(':rating', $rating);
        $stmt_insert->bindParam(':review_text', $review_text);

        if ($stmt_insert->execute()) {
            // Get publisher name for notification
            $query_publisher = "SELECT first_name, last_name, company_name FROM users WHERE id = :publisher_id";
            $stmt_publisher = $db->prepare($query_publisher);
            $stmt_publisher->bindParam(':publisher_id', $publisher_id);
            $stmt_publisher->execute();
            $publisher_info = $stmt_publisher->fetch(PDO::FETCH_ASSOC);
            
            $publisher_name = $publisher_info ? 
                ($publisher_info['company_name'] ?: $publisher_info['first_name'] . ' ' . $publisher_info['last_name']) : 
                'A company';

            // Create notification for student
            $notification_message = "$publisher_name has left a $rating-star review for your work.";
            $notification_link = "/profile"; // Link to student profile page

            $query_notification = "INSERT INTO notifications (user_id, type, message, link, is_read) VALUES (:user_id, 'review_received', :message, :link, 0)";
            $stmt_notification = $db->prepare($query_notification);
            $stmt_notification->bindParam(':user_id', $student_id);
            $stmt_notification->bindParam(':message', $notification_message);
            $stmt_notification->bindParam(':link', $notification_link);
            $stmt_notification->execute();

            $db->commit();
            http_response_code(201);
            echo json_encode(["message" => "Student review created successfully."]);
        } else {
            throw new Exception("Failed to create review.");
        }
    }

} catch (PDOException $e) {
    $db->rollback();
    http_response_code(503);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    $db->rollback();
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
?>