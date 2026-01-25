<?php
// FILE: uniwiz-backend/api/upload_profile_picture.php (Fixed Upload Path)
// ======================================================================
// This file handles uploading and updating a user's profile picture.

// --- Headers & DB Connection ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

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
if (!isset($_POST['user_id']) || !isset($_FILES['profile_picture'])) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete request. User ID and profile picture are required."]);
    exit();
}

$user_id = $_POST['user_id'];
$file = $_FILES['profile_picture'];

// --- File Validation ---
$allowed_types = ['image/jpeg', 'image/png', 'image/gif']; // Only allow JPG, PNG, GIF
if (!in_array($file['type'], $allowed_types)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid file type. Only JPG, PNG, and GIF are allowed."]);
    exit();
}
if ($file['size'] > 2097152) { // 2MB limit
    http_response_code(400);
    echo json_encode(["message" => "File is too large. Maximum size is 2MB."]);
    exit();
}

// --- File Upload Logic ---
// The target directory is inside the 'api' folder.
$target_dir = "uploads/"; // Relative to the current script in the 'api' folder
$file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$new_filename = "user_" . $user_id . "_" . time() . "." . $file_extension;
$target_file = $target_dir . $new_filename;

// Check if the uploads directory exists, if not, create it.
if (!is_dir($target_dir)) {
    mkdir($target_dir, 0777, true);
}

if (move_uploaded_file($file['tmp_name'], $target_file)) {
    try {
        // --- Update Database ---
        // The URL stored is relative to the web root (which is the 'api' folder)
        $image_url = "uploads/" . $new_filename;
        
        $stmt = $db->prepare("UPDATE users SET profile_image_url = :image_url WHERE id = :user_id");
        $stmt->bindParam(':image_url', $image_url);
        $stmt->bindParam(':user_id', $user_id);
        
        if ($stmt->execute()) {
            // Fetch the updated user data to send back
            $stmt = $db->prepare("SELECT id, email, first_name, last_name, role, company_name, profile_image_url FROM users WHERE id = :user_id");
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            $updated_user = $stmt->fetch(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                "message" => "Profile picture updated successfully.",
                "user" => $updated_user
            ]);
        } else {
            throw new Exception("Failed to update database with new image URL.");
        }
    } catch (Exception $e) {
        http_response_code(503);
        echo json_encode(["message" => "Database update failed: " . $e->getMessage()]);
    }
} else {
    http_response_code(500);
    echo json_encode(["message" => "Sorry, there was an error uploading your file."]);
}
?>
