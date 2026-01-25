<?php
// FILE: uniwiz-backend/seed_student_reviews.php
// ==============================================
// This script creates dummy reviews from publishers to students

header('Content-Type: application/json');
include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

try {
    // Get publishers and students
    $publishers_query = "SELECT id, first_name, last_name, company_name FROM users WHERE role = 'publisher' LIMIT 10";
    $publishers_stmt = $db->prepare($publishers_query);
    $publishers_stmt->execute();
    $publishers = $publishers_stmt->fetchAll(PDO::FETCH_ASSOC);

    $students_query = "SELECT id, first_name, last_name FROM users WHERE role = 'student' LIMIT 20";
    $students_stmt = $db->prepare($students_query);
    $students_stmt->execute();
    $students = $students_stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($publishers) || empty($students)) {
        echo json_encode(["message" => "Need at least 1 publisher and 1 student to create reviews."]);
        exit();
    }

    // Sample review data from publishers to students
    $dummy_reviews = [
        [
            'rating' => 5,
            'review_text' => 'Excellent student! Very reliable, punctual, and produced high-quality work. Would definitely hire again.'
        ],
        [
            'rating' => 4,
            'review_text' => 'Good performance overall. Completed tasks on time and showed good initiative. Minor room for improvement in communication.'
        ],
        [
            'rating' => 5,
            'review_text' => 'Outstanding work ethic! This student went above and beyond expectations. Professional attitude and excellent results.'
        ],
        [
            'rating' => 3,
            'review_text' => 'Satisfactory work. Completed assigned tasks but could improve on attention to detail. Shows potential with more experience.'
        ],
        [
            'rating' => 4,
            'review_text' => 'Reliable and hardworking student. Good technical skills and always willing to learn. Would recommend for similar projects.'
        ],
        [
            'rating' => 5,
            'review_text' => 'Exceptional student worker! Quick learner, proactive, and delivered excellent results. A pleasure to work with.'
        ],
        [
            'rating' => 2,
            'review_text' => 'Work quality was below expectations. Missed several deadlines and required frequent follow-up. Needs improvement.'
        ],
        [
            'rating' => 4,
            'review_text' => 'Good student with strong problem-solving skills. Completed project successfully with minimal supervision.'
        ],
        [
            'rating' => 5,
            'review_text' => 'Amazing experience working with this student! Professional, skilled, and delivered outstanding results on time.'
        ],
        [
            'rating' => 3,
            'review_text' => 'Average performance. Work was completed but lacked creativity and initiative. Adequate for basic tasks.'
        ]
    ];

    $inserted_count = 0;
    $db->beginTransaction();

    // Create reviews from publishers to students
    foreach ($publishers as $publisher) {
        // Each publisher gives 2-4 random reviews
        $num_reviews = rand(2, 4);
        $used_students = [];
        
        for ($i = 0; $i < $num_reviews; $i++) {
            // Pick a random student who hasn't been reviewed by this publisher yet
            do {
                $random_student = $students[array_rand($students)];
            } while (in_array($random_student['id'], $used_students) && count($used_students) < count($students));
            
            $used_students[] = $random_student['id'];
            
            // Pick a random review
            $random_review = $dummy_reviews[array_rand($dummy_reviews)];
            
            // Check if this publisher has already reviewed this student
            $check_query = "SELECT id FROM student_reviews WHERE publisher_id = :publisher_id AND student_id = :student_id";
            $check_stmt = $db->prepare($check_query);
            $check_stmt->bindParam(':publisher_id', $publisher['id']);
            $check_stmt->bindParam(':student_id', $random_student['id']);
            $check_stmt->execute();
            
            if ($check_stmt->rowCount() == 0) {
                // Insert the review
                $insert_query = "INSERT INTO student_reviews (publisher_id, student_id, rating, review_text, created_at) VALUES (:publisher_id, :student_id, :rating, :review_text, NOW() - INTERVAL FLOOR(RAND() * 30) DAY)";
                $insert_stmt = $db->prepare($insert_query);
                $insert_stmt->bindParam(':publisher_id', $publisher['id']);
                $insert_stmt->bindParam(':student_id', $random_student['id']);
                $insert_stmt->bindParam(':rating', $random_review['rating']);
                $insert_stmt->bindParam(':review_text', $random_review['review_text']);
                
                if ($insert_stmt->execute()) {
                    $inserted_count++;
                }
            }
        }
    }
    
    $db->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Successfully created $inserted_count dummy student reviews from " . count($publishers) . " publishers.",
        "publishers_processed" => count($publishers),
        "reviews_created" => $inserted_count
    ]);

} catch (PDOException $e) {
    $db->rollback();
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    $db->rollback();
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>