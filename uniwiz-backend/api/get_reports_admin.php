<?php
// FILE: uniwiz-backend/api/get_reports_admin.php
// =====================================================
// DESCRIPTION: Fetches all user-submitted reports for the admin panel, including the roles of the reporter and the reported user.

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
$database = new Database();
$db = $database->getConnection();

// Check if database connection is successful
if ($db === null) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

// If only the count of pending reports is requested, return it and exit
if (isset($_GET['pending_count_only'])) {
    $query = "SELECT COUNT(*) as pending_count FROM reports WHERE status = 'pending'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    http_response_code(200);
    echo json_encode(['pending_count' => (int)($row['pending_count'] ?? 0)]);
    exit();
}

try {
    // Fetch user/conversation reports with reporter and reported user details
    $query_user = "
        SELECT 
            r.id, r.type, r.reason, r.status, r.created_at,
            r.conversation_id,
            reporter.id as reporter_id,
            reporter.first_name as reporter_first_name,
            reporter.last_name as reporter_last_name,
            reporter.role as reporter_role,
            reported.id as reported_id,
            reported.first_name as reported_first_name,
            reported.last_name as reported_last_name,
            reported.role as reported_role
        FROM reports r
        JOIN users reporter ON r.reporter_id = reporter.id
        JOIN users reported ON r.reported_user_id = reported.id
        WHERE r.type IN ('user', 'conversation')
        ORDER BY r.created_at DESC
    ";
    $stmt_user = $db->prepare($query_user);
    $stmt_user->execute();
    $userReports = $stmt_user->fetchAll(PDO::FETCH_ASSOC);

    // Fetch app problem reports (no reported user, only reporter)
    $query_app = "
        SELECT 
            r.id, r.type, r.reason, r.status, r.created_at,
            reporter.id as reporter_id,
            reporter.first_name as reporter_first_name,
            reporter.last_name as reporter_last_name,
            reporter.role as reporter_role
        FROM reports r
        JOIN users reporter ON r.reporter_id = reporter.id
        WHERE r.type = 'app_problem'
        ORDER BY r.created_at DESC
    ";
    $stmt_app = $db->prepare($query_app);
    $stmt_app->execute();
    $appProblemReports = $stmt_app->fetchAll(PDO::FETCH_ASSOC);

    // Respond with both user/conversation and app problem reports
    http_response_code(200);
    echo json_encode([
        "userReports" => $userReports,
        "appProblemReports" => $appProblemReports
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
?>
