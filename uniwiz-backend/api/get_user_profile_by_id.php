<?php
// FILE: uniwiz-backend/api/get_user_profile_by_id.php
// =====================================================================
// This endpoint fetches a user's full profile by ID, typically for re-initializing
// a session from stored user data (e.g., localStorage) without requiring re-authentication.

// --- Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// --- Suppress PHP Errors for clean JSON output ---
ini_set('display_errors', 0);
error_reporting(0);

// --- Handle Preflight (OPTIONS) Request ---
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
    echo json_encode(array("message" => "Database connection failed."));
    exit(); 
}

// --- Get User ID from GET parameters ---
// Validate that user_id is provided and is an integer
if (!isset($_GET['user_id']) || !filter_var($_GET['user_id'], FILTER_VALIDATE_INT)) {
    http_response_code(400); // Bad Request
    echo json_encode(array("message" => "A valid User ID is required."));
    exit();
}

$user_id = (int)$_GET['user_id'];

// --- Function to fetch full user profile (re-used from auth.php) ---
// This function fetches all user, student, and publisher profile fields for a given user ID.
function getFullUserProfileById($db, $id) {
    $query = "
        SELECT 
            u.id, u.email, u.first_name, u.last_name, u.role, u.company_name, u.profile_image_url, u.is_verified, u.status,
            sp.university_name, sp.field_of_study, sp.year_of_study, sp.languages_spoken, sp.preferred_categories, sp.skills, sp.cv_url,
            pp.about, pp.industry, pp.website_url, pp.address, pp.phone_number, pp.facebook_url, pp.linkedin_url, pp.instagram_url, pp.required_doc_url
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN publisher_profiles pp ON u.id = pp.user_id
        WHERE u.id = :id
    ";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

try {
    $user_profile = getFullUserProfileById($db, $user_id);

    if ($user_profile) {
        http_response_code(200); // OK
        echo json_encode(array("message" => "User profile fetched successfully.", "user" => $user_profile));
    } else {
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "User not found."));
    }

} catch (PDOException $e) {
    http_response_code(503); // Service Unavailable
    echo json_encode(array("message" => "A database error occurred: " . $e->getMessage()));
} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(array("message" => "An unexpected server error occurred: " . $e->getMessage()));
}
?>
