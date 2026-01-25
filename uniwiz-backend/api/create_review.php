<?php
// FILE: uniwiz-backend/api/create_review.php
// =====================================================================
// This endpoint handles both creating and updating a company review by a student.
// It prevents duplicate reviews by updating the existing one if found, otherwise inserts a new review.
// Also sends a notification to the publisher when a new review is created.

header('Access-Control-Allow-Origin: *'); // Allow requests from any origin
header('Access-Control-Allow-Methods: POST, GET, OPTIONS'); // Allow these HTTP methods
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Content-Type: application/json'); // Response will be in JSON format

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

$data = json_decode(file_get_contents("php://input")); // Get POST data as JSON

// --- Validate Data ---
// Ensure all required fields are present
if (
    $data === null || 
    !isset($data->publisher_id) || 
    !isset($data->student_id) ||
    !isset($data->rating) ||
    !isset($data->comment)
) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Publisher ID, Student ID, rating, and comment are required."]);
    exit();
}

// Validate rating is an integer between 1 and 5
$rating = filter_var($data->rating, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1, "max_range" => 5]]);
if ($rating === false) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid rating. Must be an integer between 1 and 5."]);
    exit();
}

$publisher_id = (int)$data->publisher_id;
$student_id = (int)$data->student_id;
$review_text = htmlspecialchars(strip_tags($data->comment)); // Sanitize comment

if (empty($review_text)) {
    http_response_code(400);
    echo json_encode(["message" => "Comment cannot be empty."]);
    exit();
}

try {
    $db->beginTransaction(); // Start transaction

    // --- NEW: Check if student had an accepted application with this publisher ---
    $query_check_application = "
        SELECT COUNT(*) as accepted_applications 
        FROM job_applications ja 
        JOIN jobs j ON ja.job_id = j.id 
        WHERE ja.student_id = :student_id 
        AND j.publisher_id = :publisher_id 
        AND ja.status = 'accepted'
    ";
    $stmt_check_application = $db->prepare($query_check_application);
    $stmt_check_application->bindParam(':publisher_id', $publisher_id);
    $stmt_check_application->bindParam(':student_id', $student_id);
    $stmt_check_application->execute();
    $application_result = $stmt_check_application->fetch(PDO::FETCH_ASSOC);

    // If student has no accepted applications with this publisher, deny review access
    if ($application_result['accepted_applications'] == 0) {
        http_response_code(403); // Forbidden
        echo json_encode(["message" => "You can only review publishers who have accepted your job applications."]);
        exit();
    }

    // 1. Check if the student has already reviewed this publisher
    $query_check = "SELECT id FROM company_reviews WHERE publisher_id = :publisher_id AND student_id = :student_id";
    $stmt_check = $db->prepare($query_check);
    $stmt_check->bindParam(':publisher_id', $publisher_id);
    $stmt_check->bindParam(':student_id', $student_id);
    $stmt_check->execute();

    if ($stmt_check->rowCount() > 0) {
        // --- UPDATE LOGIC ---
        // If a review exists, update it with the new rating and comment
        $existing_review = $stmt_check->fetch(PDO::FETCH_ASSOC);
        $review_id = $existing_review['id'];

        $query_update = "UPDATE company_reviews SET rating = :rating, review_text = :review_text, created_at = CURRENT_TIMESTAMP WHERE id = :review_id";
        $stmt_update = $db->prepare($query_update);
        $stmt_update->bindParam(':rating', $rating);
        $stmt_update->bindParam(':review_text', $review_text);
        $stmt_update->bindParam(':review_id', $review_id);
        
        if ($stmt_update->execute()) {
            $db->commit();
            http_response_code(200); // OK for update
            echo json_encode(["message" => "Your review has been updated successfully."]);
        } else {
            throw new Exception("Failed to update review.");
        }

    } else {
        // --- INSERT LOGIC ---
        // If no review exists, insert a new one
        $query_insert = "INSERT INTO company_reviews (publisher_id, student_id, rating, review_text) VALUES (:publisher_id, :student_id, :rating, :review_text)";
        $stmt_insert = $db->prepare($query_insert);
        $stmt_insert->bindParam(':publisher_id', $publisher_id);
        $stmt_insert->bindParam(':student_id', $student_id);
        $stmt_insert->bindParam(':rating', $rating);
        $stmt_insert->bindParam(':review_text', $review_text);

        if ($stmt_insert->execute()) {
            // Create a notification for the publisher on the FIRST review only.
            $query_student = "SELECT first_name, last_name FROM users WHERE id = :student_id";
            $stmt_student = $db->prepare($query_student);
            $stmt_student->bindParam(':student_id', $student_id);
            $stmt_student->execute();
            $student_info = $stmt_student->fetch(PDO::FETCH_ASSOC);
            $student_name = $student_info ? $student_info['first_name'] . ' ' . $student_info['last_name'] : 'A student';

            // Prepare notification message
            $notification_message = "$student_name has left a $rating-star review for your company.";
            $notification_link = "/applicants"; // Or a link to a dedicated reviews page

            // Insert notification for the publisher
            $query_notif = "INSERT INTO notifications (user_id, type, message, link) VALUES (:user_id, 'new_review', :message, :link)";
            $stmt_notif = $db->prepare($query_notif);
            $stmt_notif->bindParam(':user_id', $publisher_id);
            $stmt_notif->bindParam(':message', $notification_message);
            $stmt_notif->bindParam(':link', $notification_link);
            $stmt_notif->execute();
            
            $db->commit();
            http_response_code(201); // Created
            echo json_encode(["message" => "Review submitted successfully."]);

        } else {
            throw new Exception("Failed to submit review.");
        }
    }

} catch (Exception $e) {
    // Rollback transaction if any error occurs
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(503);
    echo json_encode(["message" => "A server error occurred: " . $e->getMessage()]);
}
?>
