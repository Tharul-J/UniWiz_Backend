<?php
// FILE: uniwiz-backend/api/update_account_settings.php
// =====================================================================
// This endpoint handles account-level actions like changing a password or deleting an account.

// --- Headers & DB Connection ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

include_once '../config/database.php'; // Include database connection
include_once 'password_validator.php'; // Include password validation functions
$database = new Database();
$db = $database->getConnection();

// Check if database connection is successful
if ($db === null) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if ($data === null || !isset($data->action) || !isset($data->user_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid request. Action and User ID are required."]);
    exit();
}

$user_id = (int)$data->user_id;

// --- ACTION ROUTER ---
if ($data->action === 'update_password') {
    // --- UPDATE PASSWORD LOGIC ---
    if (!isset($data->current_password) || !isset($data->new_password)) {
        http_response_code(400);
        echo json_encode(["message" => "Current and new passwords are required."]);
        exit();
    }

    // Validate new password strength
    $passwordValidation = validatePasswordStrength($data->new_password);
    if (!$passwordValidation['valid']) {
        http_response_code(400);
        echo json_encode([
            "message" => "New password does not meet security requirements",
            "password_errors" => $passwordValidation['errors'],
            "requirements" => getPasswordRequirements()
        ]);
        exit();
    }

    try {
        // Get the current stored password hash for the user
        $stmt_get = $db->prepare("SELECT password FROM users WHERE id = :user_id");
        $stmt_get->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt_get->execute();

        if ($stmt_get->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(["message" => "User not found."]);
            exit();
        }

        $row = $stmt_get->fetch(PDO::FETCH_ASSOC);
        $current_password_hash = $row['password'];

        // Verify if the provided current password matches the stored hash
        if (password_verify($data->current_password, $current_password_hash)) {
            // If it matches, hash the new password and update it in the database
            $new_password_hash = password_hash($data->new_password, PASSWORD_BCRYPT);
            $stmt_update = $db->prepare("UPDATE users SET password = :new_password WHERE id = :user_id");
            $stmt_update->bindParam(':new_password', $new_password_hash);
            $stmt_update->bindParam(':user_id', $user_id, PDO::PARAM_INT);

            if ($stmt_update->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Password updated successfully."]);
            } else {
                throw new Exception("Failed to update password in the database.");
            }
        } else {
            // If the current password does not match
            http_response_code(401);
            echo json_encode(["message" => "Incorrect current password."]);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "A server error occurred: " . $e->getMessage()]);
    }

} elseif ($data->action === 'delete_account') {
    // --- DELETE ACCOUNT LOGIC ---
    if (!isset($data->password)) {
        http_response_code(400);
        echo json_encode(["message" => "Password is required to delete the account."]);
        exit();
    }

    try {
        // Get the current password hash to verify
        $stmt_get = $db->prepare("SELECT password FROM users WHERE id = :user_id");
        $stmt_get->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt_get->execute();
        
        if ($stmt_get->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(["message" => "User not found."]);
            exit();
        }

        $row = $stmt_get->fetch(PDO::FETCH_ASSOC);
        $password_hash = $row['password'];

        // Verify the password before deleting
        if (password_verify($data->password, $password_hash)) {
            // Password is correct, proceed with deletion
            // The database is set up with ON DELETE CASCADE, so related records will be deleted automatically.
            $stmt_delete = $db->prepare("DELETE FROM users WHERE id = :user_id");
            $stmt_delete->bindParam(':user_id', $user_id, PDO::PARAM_INT);

            if ($stmt_delete->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Account deleted successfully."]);
            } else {
                throw new Exception("Failed to delete the account.");
            }
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Incorrect password. Account deletion failed."]);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "A server error occurred during account deletion: " . $e->getMessage()]);
    }

} else {
    http_response_code(400);
    echo json_encode(["message" => "Invalid action specified."]);
}
?>
