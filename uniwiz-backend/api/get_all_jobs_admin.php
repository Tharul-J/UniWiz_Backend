<?php
// FILE: uniwiz-backend/api/get_all_jobs_admin.php
// ==========================================================
// This endpoint provides all job data specifically for the admin panel,
// with improved filtering for status, search, and handling of expired jobs.

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
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

// Get filter parameters from query string (with defaults)
$search_term = isset($_GET['search']) ? trim($_GET['search']) : '';
$status_filter = isset($_GET['status']) ? trim($_GET['status']) : 'All'; // 'All', 'active', 'draft', 'closed', 'expired'
$sort_order = isset($_GET['sort_order']) ? trim($_GET['sort_order']) : 'newest'; // 'newest', 'oldest'

try {
    // Build the main query with optional filters and sorting
    $query = "
        SELECT 
            j.id, 
            j.title, 
            j.status, 
            j.created_at,
            j.application_deadline, -- Fetch application_deadline to determine 'expired' status
            u.company_name, 
            u.first_name, 
            u.last_name,
            jc.name as category_name
        FROM 
            jobs j
        JOIN 
            users u ON j.publisher_id = u.id
        LEFT JOIN 
            job_categories jc ON j.category_id = jc.id
        WHERE 1=1
    ";

    $params = [];

    // Add status filter if specified
    if ($status_filter !== 'All') {
        if ($status_filter === 'expired') {
            $query .= " AND j.application_deadline IS NOT NULL AND j.application_deadline < CURDATE() AND j.status != 'closed'";
        } else {
            $query .= " AND j.status = :status_filter";
            $params[':status_filter'] = $status_filter;
        }
    }

    // Add search term filter (matches job title, company name, or publisher's name)
    if (!empty($search_term)) {
        $query .= " AND (j.title LIKE :search_term OR u.company_name LIKE :search_term OR u.first_name LIKE :search_term OR u.last_name LIKE :search_term)";
        $params[':search_term'] = "%" . $search_term . "%";
    }

    // Add sorting (newest or oldest)
    if ($sort_order === 'oldest') {
        $query .= " ORDER BY j.created_at ASC";
    } else { // Default to 'newest'
        $query .= " ORDER BY j.created_at DESC";
    }

    $stmt = $db->prepare($query);

    // Bind parameters with correct PDO types
    foreach ($params as $key => &$val) {
        $param_type = is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindParam($key, $val, $param_type);
    }

    $stmt->execute();

    $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($jobs);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "An error occurred: " . $e->getMessage()]);
}
?>
