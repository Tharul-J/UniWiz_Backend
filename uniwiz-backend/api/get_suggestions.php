<?php
// FILE: uniwiz-backend/api/get_suggestions.php
// =====================================================
// This endpoint fetches all available skills and job categories for suggestions (e.g., for search/autocomplete).

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

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

try {
    // Fetch all skill names from the skills table
    $skills_stmt = $db->prepare("SELECT name FROM skills ORDER BY name ASC");
    $skills_stmt->execute();
    $skills = $skills_stmt->fetchAll(PDO::FETCH_COLUMN, 0);

    // Fetch all category names from the job_categories table
    $categories_stmt = $db->prepare("SELECT name FROM job_categories ORDER BY name ASC");
    $categories_stmt->execute();
    $categories = $categories_stmt->fetchAll(PDO::FETCH_COLUMN, 0);

    // Fix HTML entities in category names
    $categories = array_map(function($category) {
        return html_entity_decode($category, ENT_QUOTES, 'UTF-8');
    }, $categories);

    // Return both lists as a JSON object
    http_response_code(200);
    echo json_encode([
        "skills" => $skills,
        "categories" => $categories
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
?>