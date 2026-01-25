<?php
// FILE: uniwiz-backend/api/delete_user_admin.php
// =========================================================
// This endpoint allows an admin to delete a user from the system.

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

$data = json_decode(file_get_contents("php://input"));

// Basic validation: Ensure required fields are present
if ($data === null || !isset($data->target_user_id) || !isset($data->admin_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Target User ID and Admin ID are required."]);
    exit();
}

$target_user_id = (int)$data->target_user_id;
$admin_id = (int)$data->admin_id;

try {
    // Security check: Ensure the user performing the action is actually an admin
    $stmt_check = $db->prepare("SELECT role FROM users WHERE id = :admin_id");
    $stmt_check->bindParam(':admin_id', $admin_id, PDO::PARAM_INT);
    $stmt_check->execute();
    $admin_user = $stmt_check->fetch(PDO::FETCH_ASSOC);

    if (!$admin_user || $admin_user['role'] !== 'admin') {
        http_response_code(403); // Forbidden
        echo json_encode(["message" => "You do not have permission to perform this action."]);
        exit();
    }

    // Prevent admin from deleting their own account (optional but recommended)
    if ($target_user_id === $admin_id) {
        http_response_code(403);
        echo json_encode(["message" => "You cannot delete your own admin account."]);
        exit();
    }

    // Begin transaction for data integrity
    $db->beginTransaction();

    // Delete the user. Due to CASCADE DELETE constraints in the database schema,
    // related records in student_profiles, publisher_profiles, job_applications,
    // company_reviews, notifications, and wishlist tables will also be deleted automatically.
    $query = "DELETE FROM users WHERE id = :target_user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':target_user_id', $target_user_id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            $db->commit(); // Commit the transaction
            http_response_code(200);
            echo json_encode(["message" => "User deleted successfully."]);
        } else {
            $db->rollBack(); // Rollback if no user was found/deleted
            http_response_code(404);
            echo json_encode(["message" => "User not found or already deleted."]);
        }
    } else {
        throw new Exception("Failed to delete user.");
    }

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack(); // Rollback on any error
    }
    http_response_code(500);
    echo json_encode(["message" => "A server error occurred: " . $e->getMessage()]);
}
?>