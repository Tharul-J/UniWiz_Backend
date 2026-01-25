<?php
// FILE: uniwiz-backend/api/seed_dummy_reviews.php
// =======================================================================
// This script creates dummy reviews and ratings for publishers in the system.
// Run this script once to populate the database with sample review data.

header('Content-Type: application/json');
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

try {
    // First, get all publishers in the system
    $publishers_query = "SELECT id, first_name, last_name, company_name FROM users WHERE role = 'publisher' LIMIT 10";
    $publishers_stmt = $db->prepare($publishers_query);
    $publishers_stmt->execute();
    $publishers = $publishers_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all students in the system to use as reviewers
    $students_query = "SELECT id, first_name, last_name FROM users WHERE role = 'student' LIMIT 20";
    $students_stmt = $db->prepare($students_query);
    $students_stmt->execute();
    $students = $students_stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($publishers) || empty($students)) {
        echo json_encode(["message" => "Need at least 1 publisher and 1 student to create reviews."]);
        exit();
    }

    // Dummy review data with realistic content
    $dummy_reviews = [
        [
            'rating' => 5,
            'review_text' => 'Excellent company to work with! The management is very supportive and the work environment is fantastic. Highly recommend this company for part-time opportunities.'
        ],
        [
            'rating' => 4,
            'review_text' => 'Great experience overall. The team is professional and the work is meaningful. Payment was always on time and the work schedule was flexible.'
        ],
        [
            'rating' => 5,
            'review_text' => 'Outstanding workplace culture! They really care about their part-time employees and provide good training. Would definitely work here again.'
        ],
        [
            'rating' => 3,
            'review_text' => 'Average experience. The work was okay but communication could be improved. Not bad but there are better opportunities out there.'
        ],
        [
            'rating' => 4,
            'review_text' => 'Good company with decent work opportunities. The supervisors are helpful and the work environment is pleasant. Recommended for students.'
        ],
        [
            'rating' => 5,
            'review_text' => 'Fantastic place to gain work experience! They offer good mentorship and the projects are interesting. Very professional organization.'
        ],
        [
            'rating' => 2,
            'review_text' => 'Not the best experience. Work was disorganized and management was not very responsive. Payment was delayed multiple times.'
        ],
        [
            'rating' => 4,
            'review_text' => 'Solid workplace with good opportunities for learning. The team is collaborative and they respect work-life balance. Good for part-time work.'
        ],
        [
            'rating' => 5,
            'review_text' => 'Amazing experience! They treated me like a valued team member from day one. Great company culture and excellent learning opportunities.'
        ],
        [
            'rating' => 3,
            'review_text' => 'Decent work experience. The projects were interesting but the workload was sometimes too heavy for part-time positions.'
        ],
        [
            'rating' => 4,
            'review_text' => 'Good company to work for. Professional environment and fair compensation. Would recommend to other students looking for part-time work.'
        ],
        [
            'rating' => 5,
            'review_text' => 'Exceeded my expectations! The team is very supportive and they provide excellent training. Great stepping stone for career development.'
        ],
        [
            'rating' => 1,
            'review_text' => 'Poor experience overall. Unprofessional management and unclear job requirements. Would not recommend working here.'
        ],
        [
            'rating' => 4,
            'review_text' => 'Nice place to work part-time. Good work environment and reasonable deadlines. The team is friendly and helpful.'
        ],
        [
            'rating' => 5,
            'review_text' => 'Excellent company! They really invest in their employees\' growth. Great work culture and flexible working arrangements.'
        ],
        [
            'rating' => 3,
            'review_text' => 'Okay experience. Work was routine but management was supportive. Good for gaining basic work experience.'
        ],
        [
            'rating' => 4,
            'review_text' => 'Professional organization with good values. They respect their part-time workers and provide fair compensation. Recommended.'
        ],
        [
            'rating' => 5,
            'review_text' => 'Perfect for students! They understand academic commitments and are very flexible with scheduling. Great team to work with.'
        ],
        [
            'rating' => 2,
            'review_text' => 'Below average experience. Communication was poor and work instructions were often unclear. Not ideal for students.'
        ],
        [
            'rating' => 4,
            'review_text' => 'Good workplace with opportunities to learn new skills. The supervisors are knowledgeable and willing to help. Fair compensation.'
        ]
    ];

    $inserted_count = 0;
    $db->beginTransaction();

    // Create reviews for each publisher
    foreach ($publishers as $publisher) {
        // Each publisher gets 2-5 random reviews
        $num_reviews = rand(2, 5);
        $used_students = [];
        
        for ($i = 0; $i < $num_reviews; $i++) {
            // Pick a random student who hasn't reviewed this publisher yet
            do {
                $random_student = $students[array_rand($students)];
            } while (in_array($random_student['id'], $used_students) && count($used_students) < count($students));
            
            $used_students[] = $random_student['id'];
            
            // Pick a random review
            $random_review = $dummy_reviews[array_rand($dummy_reviews)];
            
            // Check if this student has already reviewed this publisher
            $check_query = "SELECT id FROM company_reviews WHERE publisher_id = :publisher_id AND student_id = :student_id";
            $check_stmt = $db->prepare($check_query);
            $check_stmt->bindParam(':publisher_id', $publisher['id']);
            $check_stmt->bindParam(':student_id', $random_student['id']);
            $check_stmt->execute();
            
            if ($check_stmt->rowCount() == 0) {
                // Insert the review
                $insert_query = "INSERT INTO company_reviews (publisher_id, student_id, rating, review_text, created_at) VALUES (:publisher_id, :student_id, :rating, :review_text, NOW() - INTERVAL FLOOR(RAND() * 30) DAY)";
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
        "message" => "Successfully created $inserted_count dummy reviews for " . count($publishers) . " publishers.",
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