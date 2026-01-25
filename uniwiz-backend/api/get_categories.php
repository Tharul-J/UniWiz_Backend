<?php
// FILE: uniwiz-backend/api/get_categories.php
// =============================================
// This endpoint fetches all available job categories from the database.

// --- Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// --- Handle Preflight Request ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
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

// --- Main Logic to Fetch Categories ---
try {
    $query = "SELECT id, name FROM job_categories ORDER BY name ASC";
    $stmt = $db->prepare($query);
    $stmt->execute();

    // Fetch all categories as an associative array
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fix HTML entities in category names
    foreach ($categories as &$category) {
        $category['name'] = html_entity_decode($category['name'], ENT_QUOTES, 'UTF-8');
    }

    http_response_code(200);
    echo json_encode($categories);

} catch (PDOException $e) {
    http_response_code(503); 
    echo json_encode(["message" => "Database error while fetching categories."]);
}
?>
