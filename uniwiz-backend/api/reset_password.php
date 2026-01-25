<?php
// FILE: api/reset_password.php
// ===========================
// Handle password reset with token

// --- Set CORS and Content-Type Headers ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// --- Handle preflight OPTIONS request for CORS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Include database and validation ---
require_once '../config/database.php';
require_once 'password_validator.php';

// --- Database Connection ---
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// --- Only allow POST requests for password reset ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

// --- Validate required fields ---
if (!isset($input['token']) || empty($input['token'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Reset token is required']);
    exit;
}

if (!isset($input['password']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'New password is required']);
    exit;
}

$token = $input['token'];
$newPassword = $input['password'];

// --- Validate password strength ---
$passwordValidation = validatePasswordStrength($newPassword);
if (!$passwordValidation['valid']) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Password does not meet security requirements',
        'password_errors' => $passwordValidation['errors'],
        'requirements' => getPasswordRequirements()
    ]);
    exit;
}

try {
    // --- Find user with valid reset token ---
    $stmt = $pdo->prepare("SELECT id, reset_token, reset_token_expiry FROM users WHERE reset_token = ? AND status = 'active'");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired reset token']);
        exit;
    }

    // --- Check if token has expired ---
    if (strtotime($user['reset_token_expiry']) < time()) {
        // Clear expired token
        $stmt = $pdo->prepare("UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        http_response_code(400);
        echo json_encode(['error' => 'Reset token has expired. Please request a new password reset.']);
        exit;
    }

    // --- Hash the new password ---
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // --- Update password and clear reset token ---
    $stmt = $pdo->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?");
    $stmt->execute([$hashedPassword, $user['id']]);

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(['message' => 'Password reset successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update password']);
    }

} catch (PDOException $e) {
    // Log database errors for debugging
    error_log("Database error in reset_password.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred. Please try again later.']);
} catch (Exception $e) {
    // Log general errors for debugging
    error_log("General error in reset_password.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred. Please try again later.']);
}
?> 