<?php
// FILE: uniwiz-backend/api/update_user_status_admin.php (FIXED - Admin Notifications for User Verification)
// =====================================================================
// This endpoint allows an admin to update a user's status (active/blocked)
// and verification status (is_verified).
// FIXED: Now sends a notification to the user when their verification status changes.

// --- Set CORS and Content-Type Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// --- Handle preflight OPTIONS request for CORS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// --- Database Connection ---
include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

// --- Check DB connection ---
if ($db === null) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

// --- Parse and validate input ---
$data = json_decode(file_get_contents("php://input"));

// Basic validation for required fields
if ($data === null || !isset($data->target_user_id) || !isset($data->admin_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Target User ID and Admin ID are required."]);
    exit();
}

$target_user_id = (int)$data->target_user_id;
$admin_id = (int)$data->admin_id;
$new_status = isset($data->status) ? htmlspecialchars(strip_tags($data->status)) : null;
$new_is_verified = isset($data->is_verified) ? (int)$data->is_verified : null;

try {
    // --- Security check: Ensure the user performing the action is actually an admin ---
    $stmt_check = $db->prepare("SELECT role FROM users WHERE id = :admin_id");
    $stmt_check->bindParam(':admin_id', $admin_id, PDO::PARAM_INT);
    $stmt_check->execute();
    $admin_user = $stmt_check->fetch(PDO::FETCH_ASSOC);

    if (!$admin_user || $admin_user['role'] !== 'admin') {
        http_response_code(403); // Forbidden
        echo json_encode(["message" => "You do not have permission to perform this action."]);
        exit();
    }

    // --- Start transaction for atomicity ---
    $db->beginTransaction();

    // --- Fetch current user status before update for notification logic ---
    $stmt_current_user = $db->prepare("SELECT is_verified, status, first_name, last_name, company_name FROM users WHERE id = :target_user_id");
    $stmt_current_user->bindParam(':target_user_id', $target_user_id, PDO::PARAM_INT);
    $stmt_current_user->execute();
    $current_user_data = $stmt_current_user->fetch(PDO::FETCH_ASSOC);

    if (!$current_user_data) {
        $db->rollBack();
        http_response_code(404);
        echo json_encode(["message" => "User not found."]);
        exit();
    }

    $old_is_verified = (int)$current_user_data['is_verified'];
    $old_status = $current_user_data['status'];

    // --- Construct the update query dynamically based on provided fields ---
    $update_fields = [];
    $params = [':target_user_id' => $target_user_id];

    if ($new_status !== null) {
        if (!in_array($new_status, ['active', 'blocked'])) {
            $db->rollBack();
            http_response_code(400);
            echo json_encode(["message" => "Invalid status provided. Must be 'active' or 'blocked'."]);
            exit();
        }
        $update_fields[] = "status = :new_status";
        $params[':new_status'] = $new_status;
    }

    if ($new_is_verified !== null) {
        if (!in_array($new_is_verified, [0, 1])) {
            $db->rollBack();
            http_response_code(400);
            echo json_encode(["message" => "Invalid verification status provided. Must be 0 or 1."]);
            exit();
        }
        $update_fields[] = "is_verified = :new_is_verified";
        $params[':new_is_verified'] = $new_is_verified;
    }

    if (empty($update_fields)) {
        $db->rollBack();
        http_response_code(400);
        echo json_encode(["message" => "No valid fields provided for update."]);
        exit();
    }

    $query = "UPDATE users SET " . implode(", ", $update_fields) . " WHERE id = :target_user_id";
    $stmt = $db->prepare($query);

    // --- Bind parameters dynamically ---
    foreach ($params as $key => &$val) {
        $param_type = is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindParam($key, $val, $param_type);
    }

    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            // --- NEW: Create notification for the target user if status or verification changes ---
            $notification_message = "";
            $notification_type = "account_update"; // Default type
            $notification_link = "/settings"; // Default link

            if ($new_status !== null && $new_status !== $old_status) {
                if ($new_status === 'blocked') {
                    $notification_message = "Your account has been blocked by the administrator.";
                    $notification_type = "account_blocked";
                    $notification_link = "/login"; // Redirect to login as they can't access app
                } else if ($new_status === 'active') {
                    $notification_message = "Your account has been unblocked by the administrator.";
                    $notification_type = "account_unblocked";
                }
            }

            if ($new_is_verified !== null && $new_is_verified !== $old_is_verified) {
                if ($new_is_verified === 1) {
                    $notification_message = "Your account has been verified by the administrator!";
                    $notification_type = "account_verified";
                    $notification_link = "/profile";
                } else if ($new_is_verified === 0) {
                    $notification_message = "Your account verification status has been revoked.";
                    $notification_type = "account_unverified";
                    $notification_link = "/profile";
                }
            }
            
            // Only create notification if a relevant message was generated
            if (!empty($notification_message)) {
                $query_notif = "INSERT INTO notifications (user_id, type, message, link) VALUES (:user_id, :type, :message, :link)";
                $stmt_notif = $db->prepare($query_notif);
                $stmt_notif->bindParam(':user_id', $target_user_id, PDO::PARAM_INT);
                $stmt_notif->bindParam(':type', $notification_type);
                $stmt_notif->bindParam(':message', $notification_message);
                $stmt_notif->bindParam(':link', $notification_link);
                $stmt_notif->execute();
            }

            $db->commit(); // Commit the transaction
            http_response_code(200);
            echo json_encode(["message" => "User updated successfully."]);
        } else {
            $db->rollBack(); // Rollback if no rows were affected
            http_response_code(404);
            echo json_encode(["message" => "User not found or no changes made."]);
        }
    } else {
        throw new Exception("Failed to update user.");
    }

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["message" => "A server error occurred: " . $e->getMessage()]);
}
?>
