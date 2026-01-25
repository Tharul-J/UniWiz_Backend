<?php
// FILE: uniwiz-backend/api/update_site_settings.php
// =====================================================
// This endpoint allows an administrator to update site-wide settings (e.g., footer links).

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Content-Type: application/json; charset=UTF-8"); // Respond with JSON
header("Access-Control-Allow-Methods: POST, OPTIONS"); // Allow POST and OPTIONS methods
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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

$data = json_decode(file_get_contents("php://input"));

// Basic validation: Ensure we have the admin ID and the settings data
if ($data === null || !isset($data->admin_id) || !isset($data->settings_value)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Admin ID and settings data are required."]);
    exit();
}

$admin_id = (int)$data->admin_id;
$setting_key = 'footer_links'; // We are specifically updating footer links
$settings_value_json = json_encode($data->settings_value); // Re-encode to ensure it's a valid JSON string

try {
    // Security Check: Verify the user is an admin
    $stmt_check = $db->prepare("SELECT role FROM users WHERE id = :admin_id");
    $stmt_check->bindParam(':admin_id', $admin_id, PDO::PARAM_INT);
    $stmt_check->execute();
    $admin_user = $stmt_check->fetch(PDO::FETCH_ASSOC);

    if (!$admin_user || $admin_user['role'] !== 'admin') {
        http_response_code(403); // Forbidden
        echo json_encode(["message" => "You do not have permission to perform this action."]);
        exit();
    }

    // Proceed with the update
    $query = "UPDATE site_settings SET setting_value = :setting_value WHERE setting_key = :setting_key";
    $stmt = $db->prepare($query);

    $stmt->bindParam(':setting_value', $settings_value_json);
    $stmt->bindParam(':setting_key', $setting_key);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Footer settings updated successfully."]);
    } else {
        throw new Exception("Failed to update settings in the database.");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "A server error occurred: " . $e->getMessage()]);
}
?>
