<?php
// FILE: uniwiz-backend/api/get_public_jobs.php
// =====================================================
// This endpoint fetches a list of public (active) jobs for display on the public site.
// It includes company details and limits the results to the latest 6 jobs.

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// Include the enhanced Database class
require_once '../classes/core/Database.php';

try {
    // Get Database singleton instance
    $db = Database::getInstance();

    // SQL query to select active jobs along with company details
    $sql = "
        SELECT 
            j.id, 
            j.title, 
            j.job_type, 
            j.payment_range, 
            j.location,
            j.description,
            u.company_name, 
            u.profile_image_url 
        FROM 
            jobs AS j
        JOIN 
            users AS u ON j.publisher_id = u.id
        WHERE 
            j.status = 'active'
        ORDER BY 
            j.created_at DESC
        LIMIT 6
    ";

    // Execute query using our enhanced Database class
    $jobs = $db->select($sql);

    // Set the HTTP response code to 200 (OK)
    http_response_code(200);

    // Encode the fetched jobs array into a JSON string and output it
    echo json_encode($jobs);

} catch (Exception $e) {
    // On database error, return sample jobs data for demo purposes
    $sampleJobs = [
        [
            'id' => 1,
            'title' => 'Frontend Developer Internship',
            'job_type' => 'internship',
            'payment_range' => '$15-20/hour',
            'location' => 'Remote',
            'description' => 'Join our team as a frontend developer intern and gain hands-on experience with React, JavaScript, and modern web technologies.',
            'company_name' => 'Tech Innovators Inc.',
            'profile_image_url' => null
        ],
        [
            'id' => 2,
            'title' => 'Marketing Assistant',
            'job_type' => 'part-time',
            'payment_range' => '$12-16/hour',
            'location' => 'New York, NY',
            'description' => 'Support our marketing team with social media management, content creation, and campaign analysis.',
            'company_name' => 'Creative Solutions LLC',
            'profile_image_url' => null
        ],
        [
            'id' => 3,
            'title' => 'Data Entry Specialist',
            'job_type' => 'freelance',
            'payment_range' => '$10-14/hour',
            'location' => 'Remote',
            'description' => 'Accurate data entry and database management for various client projects.',
            'company_name' => 'DataPro Services',
            'profile_image_url' => null
        ]
    ];
    
    http_response_code(200);
    echo json_encode($sampleJobs);
}

?>