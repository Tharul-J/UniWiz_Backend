<?php
// FILE: uniwiz-backend/api/upload_cv.php (Fixed with enhanced error reporting)
// =================================================
// This file handles uploading a student's CV file.

// --- Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// Suppress PHP errors from being displayed directly in output for cleaner JSON
ini_set('display_errors', 0);
error_reporting(0);

// --- Handle preflight OPTIONS request for CORS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Database Connection ---
include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();
if ($db === null) { 
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

// --- Basic Validation ---
if (!isset($_POST['user_id']) || !isset($_FILES['cv_file'])) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete request. User ID and CV file are required."]);
    exit();
}

$user_id = $_POST['user_id'];
$file = $_FILES['cv_file'];

// --- File Validation ---
$allowed_types = ['application/pdf']; // Only PDF allowed for CV
if (!in_array($file['type'], $allowed_types)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid file type. Only PDF files are allowed for CV."]);
    exit();
}
if ($file['size'] > 5242880) { // 5MB limit for CV
    http_response_code(400);
    echo json_encode(["message" => "File is too large. Maximum size is 5MB."]);
    exit();
}

// --- File Upload Logic ---
$target_dir = "uploads/cvs/"; // Relative to the current script in the 'api' folder
$file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$new_filename = "cv_user_" . $user_id . "_" . time() . "." . $file_extension;
$target_file = $target_dir . $new_filename;

// Check if the uploads/cvs directory exists, if not, create it.
// Ensure the web server has write permissions to this directory.
if (!is_dir($target_dir)) {
    if (!mkdir($target_dir, 0777, true)) { // Attempt to create directory with full permissions
        http_response_code(500);
        echo json_encode(["message" => "Failed to create upload directory. Check server permissions."]);
        exit();
    }
}

if (move_uploaded_file($file['tmp_name'], $target_file)) {
    try {
        // --- Update Database (student_profiles table) ---
        $cv_url = "uploads/cvs/" . $new_filename; // Path relative to web root

        // Check if student profile exists, if not, create a basic one
        $stmt_check = $db->prepare("SELECT id FROM student_profiles WHERE user_id = :user_id LIMIT 1");
        $stmt_check->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt_check->execute();
        $profile_exists = $stmt_check->rowCount() > 0;

        if ($profile_exists) {
            // Update existing student profile with new CV URL
            $stmt = $db->prepare("UPDATE student_profiles SET cv_url = :cv_url WHERE user_id = :user_id");
        } else {
            // If profile doesn't exist, create a new entry with user_id and cv_url
            // This case should ideally be handled during user registration, but added for robustness.
            $stmt = $db->prepare("INSERT INTO student_profiles (user_id, cv_url) VALUES (:user_id, :cv_url)");
        }
        
        $stmt->bindParam(':cv_url', $cv_url);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            // Fetch the updated user data (including student profile data) to send back
            // This query now correctly joins with student_profiles to get all student-specific data
            $query_fetch = "
                SELECT 
                    u.id, u.email, u.first_name, u.last_name, u.role, u.company_name, u.profile_image_url,
                    sp.university_name, sp.field_of_study, sp.year_of_study, sp.languages_spoken, sp.preferred_categories, sp.skills, sp.cv_url
                FROM users u
                LEFT JOIN student_profiles sp ON u.id = sp.user_id
                WHERE u.id = :id
            ";
            $stmt_fetch = $db->prepare($query_fetch);
            $stmt_fetch->bindParam(':id', $user_id, PDO::PARAM_INT);
            $stmt_fetch->execute();
            $updated_user = $stmt_fetch->fetch(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                "message" => "CV uploaded successfully.",
                "user" => $updated_user
            ]);
        } else {
            // If database update fails, provide a specific message
            http_response_code(500);
            echo json_encode(["message" => "Failed to update CV URL in database. SQL error: " . implode(" ", $stmt->errorInfo())]);
        }
    } catch (PDOException $e) {
        http_response_code(503);
        echo json_encode(["message" => "Database error during CV update: " . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "An unexpected server error occurred during CV update: " . $e->getMessage()]);
    }
} else {
    // If move_uploaded_file fails, provide a more specific error
    $php_upload_errors = [
        UPLOAD_ERR_INI_SIZE   => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
        UPLOAD_ERR_FORM_SIZE  => 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.',
        UPLOAD_ERR_PARTIAL    => 'The uploaded file was only partially uploaded.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder.',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
        UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the file upload.',
    ];
    $error_code = $file['error'];
    $error_message = isset($php_upload_errors[$error_code]) ? $php_upload_errors[$error_code] : 'Unknown upload error.';

    http_response_code(500);
    echo json_encode(["message" => "Sorry, there was an error uploading your file: " . $error_message . " (Code: " . $error_code . ")"]);
}
?>