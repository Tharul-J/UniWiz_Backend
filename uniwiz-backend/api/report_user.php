<?php
// FILE: uniwiz-backend/api/report_user.php
// =====================================================
// This endpoint allows users to report other users or app problems.
// It saves the report and notifies all administrators.

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

include_once '../config/database.php'; // Include database connection

// Utility function to notify all administrators about a new event/report
// This can be moved to a common utility file if needed
function createAdminNotification($db, $type, $message, $link) {
    // Fetch all admin user IDs
    $stmt_admins = $db->prepare("SELECT id FROM users WHERE role = 'admin'");
    $stmt_admins->execute();
    $admin_ids = $stmt_admins->fetchAll(PDO::FETCH_COLUMN, 0);

    if (empty($admin_ids)) {
        return; // No admins to notify
    }

    // Prepare and execute notification insert for each admin
    $query_notif = "INSERT INTO notifications (user_id, type, message, link) VALUES (:user_id, :type, :message, :link)";
    $stmt_notif = $db->prepare($query_notif);

    foreach ($admin_ids as $admin_id) {
        $stmt_notif->bindParam(':user_id', $admin_id, PDO::PARAM_INT);
        $stmt_notif->bindParam(':type', $type, PDO::PARAM_STR);
        $stmt_notif->bindParam(':message', $message, PDO::PARAM_STR);
        $stmt_notif->bindParam(':link', $link, PDO::PARAM_STR);
        $stmt_notif->execute();
    }
}

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input")); // Get POST data as JSON

$type = isset($data->type) ? $data->type : 'user'; // Default type is 'user'

// Validate required fields based on report type
if ($type === 'app_problem') {
    if (!isset($data->reporter_id) || !isset($data->reason)) {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data. Reporter ID and a reason are required for app problem reports."]);
        exit();
    }
    $reporter_id = (int)$data->reporter_id;
    $reported_user_id = null;
    $conversation_id = null;
    $reason = htmlspecialchars(strip_tags($data->reason));
} else {
    if (!isset($data->reporter_id) || !isset($data->reported_user_id) || !isset($data->reason)) {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data. Reporter ID, Reported User ID, and a reason are required."]);
        exit();
    }
    $reporter_id = (int)$data->reporter_id;
    $reported_user_id = (int)$data->reported_user_id;
    $conversation_id = isset($data->conversation_id) ? (int)$data->conversation_id : null;
    $reason = htmlspecialchars(strip_tags($data->reason));
}

// Ensure the reason is not empty
if (empty(trim($reason))) {
    http_response_code(400);
    echo json_encode(["message" => "A reason for the report is required."]);
    exit();
}

try {
    // Insert the report into the database
    $query = "INSERT INTO reports (type, reporter_id, reported_user_id, conversation_id, reason) 
              VALUES (:type, :reporter_id, :reported_user_id, :conversation_id, :reason)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':type', $type, PDO::PARAM_STR);
    $stmt->bindParam(':reporter_id', $reporter_id, PDO::PARAM_INT);
    $stmt->bindParam(':reported_user_id', $reported_user_id, $reported_user_id !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
    $stmt->bindParam(':conversation_id', $conversation_id, $conversation_id !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
    $stmt->bindParam(':reason', $reason, PDO::PARAM_STR);

    if ($stmt->execute()) {
        // Notify all admins about the new report
        $reporter_name_stmt = $db->prepare("SELECT first_name, last_name FROM users WHERE id = :id");
        $reporter_name_stmt->execute([':id' => $reporter_id]);
        $reporter = $reporter_name_stmt->fetch(PDO::FETCH_ASSOC);
        $reporter_name = $reporter ? trim($reporter['first_name'] . ' ' . $reporter['last_name']) : 'A user';
        $notif_msg = $type === 'app_problem' ? "$reporter_name has reported an app problem." : "$reporter_name has submitted a new user report.";
        createAdminNotification($db, 'new_report', $notif_msg, "/report-management");
        http_response_code(201);
        echo json_encode(["message" => "Report submitted successfully. An administrator will review it shortly."]);
    } else {
        throw new Exception("Could not save the report.");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
?>
