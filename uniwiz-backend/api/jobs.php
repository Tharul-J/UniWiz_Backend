<?php
// FILE: uniwiz-backend/api/jobs.php
// =================================================================================================
// This endpoint fetches all active jobs, with optional filters and student-specific application status.

// --- Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// --- Handle Preflight (OPTIONS) Request ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// --- Database Connection ---
include_once '../config/database.php'; // Include database connection
$database = new Database();
$db = $database->getConnection();

// Check if database connection is successful
if ($db === null) { 
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit(); 
}

// --- Main Logic to Fetch Jobs ---
try {
    // Get filter parameters from query string
    $student_id = isset($_GET['student_id']) ? (int)$_GET['student_id'] : null; // Get student_id if available
    $search_term = isset($_GET['search']) ? trim($_GET['search']) : '';
    $category_id_filter = isset($_GET['category_id']) ? trim($_GET['category_id']) : '';
    $job_type_filter = isset($_GET['job_type']) ? trim($_GET['job_type']) : '';

    // The query includes a LEFT JOIN to the job_applications table
    // to fetch the status of the application for the specific student.
    // Also includes profile_image_url for company logos
    $query = "
        SELECT 
            j.id, 
            j.title, 
            jc.name as category, 
            j.category_id,      
            j.job_type, 
            j.payment_range, 
            j.created_at,       
            j.start_date,       
            j.end_date,         
            u.first_name as publisher_first_name,
            u.company_name as publisher_company_name,
            u.profile_image_url,
            u.id as publisher_id,
            ja.status as application_status
        FROM 
            jobs as j
        LEFT JOIN 
            job_categories as jc ON j.category_id = jc.id
        LEFT JOIN 
            users as u ON j.publisher_id = u.id
        LEFT JOIN
            job_applications ja ON j.id = ja.job_id AND ja.student_id = :student_id
        WHERE 
            j.status = 'active'
    ";

    // Add search term filter
    if (!empty($search_term)) {
        $query .= " AND (j.title LIKE :search_term OR u.company_name LIKE :search_term)";
    }
    // Add category filter
    if (!empty($category_id_filter)) {
        $query .= " AND j.category_id = :category_id_filter";
    }
    // Add job type filter
    if (!empty($job_type_filter)) {
        $query .= " AND j.job_type = :job_type_filter";
    }

    $query .= " ORDER BY j.created_at DESC";

    $stmt = $db->prepare($query);

    // Bind the student_id parameter. It will be NULL if not provided.
    $stmt->bindParam(':student_id', $student_id, $student_id === null ? PDO::PARAM_NULL : PDO::PARAM_INT);

    // Bind other parameters
    if (!empty($search_term)) {
        $search_param = "%" . $search_term . "%";
        $stmt->bindParam(':search_term', $search_param, PDO::PARAM_STR);
    }
    if (!empty($category_id_filter)) {
        $stmt->bindParam(':category_id_filter', $category_id_filter, PDO::PARAM_INT);
    }
    if (!empty($job_type_filter)) {
        $stmt->bindParam(':job_type_filter', $job_type_filter, PDO::PARAM_STR);
    }

    $stmt->execute();

    $jobs_arr = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $job_item = array(
            "id" => $row['id'],
            "title" => $row['title'],
            "category" => html_entity_decode($row['category'], ENT_QUOTES, 'UTF-8'),
            "category_id" => $row['category_id'],
            "job_type" => $row['job_type'],
            "payment_range" => $row['payment_range'],
            "created_at" => $row['created_at'], 
            "start_date" => $row['start_date'], 
            "end_date" => $row['end_date'],     
            "publisher_id" => $row['publisher_id'],
            "publisher_name" => $row['publisher_first_name'],
            "company_name" => $row['publisher_company_name'],
            "profile_image_url" => $row['profile_image_url'], // Company logo
            "application_status" => $row['application_status'] // Student's application status
        );
        array_push($jobs_arr, $job_item);
    }
    http_response_code(200);
    echo json_encode($jobs_arr);

} catch (PDOException $e) {
    http_response_code(503); 
    echo json_encode(["message" => "Database error while fetching jobs: " . $e->getMessage()]);
}
?>
