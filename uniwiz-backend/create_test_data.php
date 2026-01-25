<?php
// FILE: uniwiz-backend/create_test_data.php
// ========================================
// Creates test job applications and student reviews

header('Content-Type: application/json');
include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

try {
    $db->beginTransaction();
    
    // Get first publisher and first few students
    $publisher_query = "SELECT id FROM users WHERE role = 'publisher' LIMIT 1";
    $publisher_stmt = $db->prepare($publisher_query);
    $publisher_stmt->execute();
    $publisher = $publisher_stmt->fetch(PDO::FETCH_ASSOC);
    
    $students_query = "SELECT id, first_name, last_name FROM users WHERE role = 'student' LIMIT 3";
    $students_stmt = $db->prepare($students_query);
    $students_stmt->execute();
    $students = $students_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!$publisher || empty($students)) {
        echo json_encode(["message" => "Need at least 1 publisher and 3 students"]);
        exit();
    }
    
    // Create a test job if none exists
    $job_query = "SELECT id FROM jobs WHERE publisher_id = ? LIMIT 1";
    $job_stmt = $db->prepare($job_query);
    $job_stmt->execute([$publisher['id']]);
    $job = $job_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$job) {
        // Create a test job
        $create_job = "INSERT INTO jobs (publisher_id, title, description, salary, location, status) VALUES (?, 'Student Assistant', 'Help with various office tasks and data entry', '15.00', 'Campus Office', 'active')";
        $create_job_stmt = $db->prepare($create_job);
        $create_job_stmt->execute([$publisher['id']]);
        $job_id = $db->lastInsertId();
    } else {
        $job_id = $job['id'];
    }
    
    // Create job applications for students
    $applications_created = 0;
    foreach ($students as $student) {
        // Check if application already exists
        $check_app = "SELECT id FROM job_applications WHERE job_id = ? AND student_id = ?";
        $check_stmt = $db->prepare($check_app);
        $check_stmt->execute([$job_id, $student['id']]);
        
        if ($check_stmt->rowCount() == 0) {
            // Create application
            $create_app = "INSERT INTO job_applications (job_id, student_id, status) VALUES (?, ?, 'accepted')";
            $create_app_stmt = $db->prepare($create_app);
            $create_app_stmt->execute([$job_id, $student['id']]);
            $applications_created++;
        }
    }
    
    // Create student reviews from publisher
    $reviews_created = 0;
    $review_texts = [
        'Excellent student! Very reliable and produced high-quality work.',
        'Good performance overall. Completed tasks on time and showed initiative.',
        'Outstanding work ethic! This student exceeded expectations.',
    ];
    $ratings = [5, 4, 5];
    
    for ($i = 0; $i < min(count($students), 3); $i++) {
        $student = $students[$i];
        
        // Check if review already exists
        $check_review = "SELECT id FROM student_reviews WHERE publisher_id = ? AND student_id = ? AND job_id = ?";
        $check_review_stmt = $db->prepare($check_review);
        $check_review_stmt->execute([$publisher['id'], $student['id'], $job_id]);
        
        if ($check_review_stmt->rowCount() == 0) {
            // Create review
            $create_review = "INSERT INTO student_reviews (publisher_id, student_id, job_id, rating, review_text) VALUES (?, ?, ?, ?, ?)";
            $create_review_stmt = $db->prepare($create_review);
            $create_review_stmt->execute([$publisher['id'], $student['id'], $job_id, $ratings[$i], $review_texts[$i]]);
            $reviews_created++;
        }
    }
    
    $db->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Created test data successfully",
        "details" => [
            "publisher_id" => $publisher['id'],
            "job_id" => $job_id,
            "applications_created" => $applications_created,
            "reviews_created" => $reviews_created,
            "students_processed" => count($students)
        ]
    ]);

} catch (PDOException $e) {
    $db->rollback();
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    $db->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>