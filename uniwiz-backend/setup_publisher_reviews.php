<?php
// FILE: uniwiz-backend/setup_publisher_reviews.php
// =================================================
// This script creates the student_reviews table for publishers to review students
// Run this once to set up the database table for publisher-to-student reviews

header('Content-Type: application/json');
include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    echo json_encode(["error" => "Database connection failed."]);
    exit();
}

try {
    // Create student_reviews table for publisher-to-student reviews
    $createTableQuery = "
    CREATE TABLE IF NOT EXISTS student_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        publisher_id INT NOT NULL,
        student_id INT NOT NULL,
        job_id INT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        status ENUM('active', 'hidden', 'flagged') DEFAULT 'active',
        
        -- Foreign key constraints
        FOREIGN KEY (publisher_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
        
        -- Ensure one review per publisher-student-job combination
        UNIQUE KEY unique_publisher_student_job (publisher_id, student_id, job_id),
        
        -- Indexes for performance
        INDEX idx_student_reviews_student (student_id),
        INDEX idx_student_reviews_publisher (publisher_id),
        INDEX idx_student_reviews_rating (rating),
        INDEX idx_student_reviews_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $db->exec($createTableQuery);
    
    echo json_encode([
        "success" => true,
        "message" => "Student reviews table created successfully. Publishers can now review students."
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "error" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        "error" => "Error: " . $e->getMessage()
    ]);
}
?>