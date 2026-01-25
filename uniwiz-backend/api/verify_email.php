<?php
include_once '../config/database.php';
$database = new Database();

// Frontend base URL (configurable via .env -> FRONTEND_URL). Fallback to localhost:3000
$frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:3000';

// Basic CORS headers (not strictly required for redirects)
header("Access-Control-Allow-Origin: {$frontendUrl}");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
} 
$db = $database->getConnection();

if ($db === null) {
    // Basic error message if DB connection fails
    die("<h1>Error: Could not connect to the database.</h1>");
}

// --- Verification Logic ---
// Check if the verification token is provided in the URL
if (!isset($_GET['token']) || empty($_GET['token'])) {
    die("<h1>Verification Failed</h1><p>Invalid verification link. No token provided.</p>");
}

$token = $_GET['token'];

try {
    // 1. Find the user with the given verification token
    $query = "SELECT id, email_verified_at FROM users WHERE email_verification_token = :token LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // 2. Check if the email is already verified
        if ($user['email_verified_at'] !== null) {
            // Already verified: redirect to frontend to trigger auto-login if pending creds exist
            header('Location: ' . rtrim($frontendUrl, '/') . '/?verified=1&status=already');
            exit;
        }

        // 3. If not verified, update the user record to set email_verified_at and clear the token
        $update_query = "
            UPDATE users 
            SET 
                email_verified_at = CURRENT_TIMESTAMP, 
                email_verification_token = NULL 
            WHERE 
                id = :user_id
        ";
        $update_stmt = $db->prepare($update_query);
        $update_stmt->bindParam(':user_id', $user['id']);
        
        if ($update_stmt->execute()) {
            // Create a short-lived magic login token (stateless, HMAC-signed)
            $secret = $_ENV['MAGIC_SECRET'] ?? 'change_me_in_env';
            $issued_at = time();
            $payload = $user['id'] . '|' . $issued_at;
            $signature = hash_hmac('sha256', $payload, $secret);
            $token = rtrim(strtr(base64_encode($payload . '|' . $signature), '+/', '-_'), '=');

            // Redirect back to frontend with magic token for auto-login
            $redirectUrl = rtrim($frontendUrl, '/') . '/?magic=' . urlencode($token);
            header('Location: ' . $redirectUrl);
            exit;
        } else {
            throw new Exception("Failed to update user record.");
        }

    } else {
        // Token not found in the database
        die("<h1>Verification Failed</h1><p>Invalid or expired verification link. Please try registering again.</p>");
    }

} catch (Exception $e) {
    // Generic error message for any other issues
    die("<h1>An Error Occurred</h1><p>Something went wrong during the verification process. Please try again later.</p>");
}
?>