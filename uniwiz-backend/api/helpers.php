<?php
/**
 * FILE: uniwiz-backend/api/helpers.php
 * ==============================================================================
 * Common helper functions for API endpoints to improve code reusability
 * and maintain consistency across the application.
 */

/**
 * Send a standardized JSON response
 * 
 * @param int $statusCode HTTP status code
 * @param array $data Response data
 * @param string|null $message Optional message
 */
function sendJsonResponse($statusCode, $data = [], $message = null) {
    http_response_code($statusCode);
    
    $response = [];
    
    if ($message !== null) {
        $response['message'] = $message;
    }
    
    if (!empty($data)) {
        $response = array_merge($response, $data);
    }
    
    echo json_encode($response);
    exit();
}

/**
 * Send a success response
 * 
 * @param array $data Response data
 * @param string $message Success message
 * @param int $statusCode HTTP status code (default: 200)
 */
function sendSuccess($data = [], $message = "Success", $statusCode = 200) {
    sendJsonResponse($statusCode, $data, $message);
}

/**
 * Send an error response
 * 
 * @param string $message Error message
 * @param int $statusCode HTTP status code (default: 400)
 */
function sendError($message, $statusCode = 400) {
    sendJsonResponse($statusCode, [], $message);
}

/**
 * Validate required fields in request data
 * 
 * @param object|array $data Request data
 * @param array $requiredFields Array of required field names
 * @return array|null Returns null if valid, or array with missing fields
 */
function validateRequiredFields($data, $requiredFields) {
    $missing = [];
    
    foreach ($requiredFields as $field) {
        if (is_object($data)) {
            if (!isset($data->$field) || empty($data->$field)) {
                $missing[] = $field;
            }
        } else {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing[] = $field;
            }
        }
    }
    
    return empty($missing) ? null : $missing;
}

/**
 * Sanitize string input to prevent XSS
 * 
 * @param string $input Raw input string
 * @return string Sanitized string
 */
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

/**
 * Check if request method matches expected method
 * 
 * @param string $expectedMethod Expected HTTP method (GET, POST, PUT, DELETE)
 * @return bool True if matches, sends error response if not
 */
function validateRequestMethod($expectedMethod) {
    if ($_SERVER['REQUEST_METHOD'] !== $expectedMethod) {
        sendError("Invalid request method. Expected: {$expectedMethod}", 405);
        return false;
    }
    return true;
}

/**
 * Get parsed JSON input from request body
 * 
 * @return object|null Decoded JSON object or null on failure
 */
function getJsonInput() {
    $input = file_get_contents("php://input");
    $data = json_decode($input);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError("Invalid JSON format", 400);
        return null;
    }
    
    return $data;
}

/**
 * Set standard CORS headers for API responses
 * 
 * @param string $origin Allowed origin (default: http://localhost:3000)
 */
function setCorsHeaders($origin = "http://localhost:3000") {
    header("Access-Control-Allow-Origin: {$origin}");
    header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header('Content-Type: application/json');
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit();
    }
}

/**
 * Generate a random token for verification purposes
 * 
 * @param int $length Token length (default: 32)
 * @return string Random token
 */
function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

/**
 * Format datetime for consistent API responses
 * 
 * @param string $datetime MySQL datetime string
 * @param string $format Output format (default: ISO 8601)
 * @return string Formatted datetime
 */
function formatDateTime($datetime, $format = 'c') {
    $dt = new DateTime($datetime);
    return $dt->format($format);
}

/**
 * Check if user is authenticated based on session or token
 * 
 * @return bool True if authenticated, sends error response if not
 */
function requireAuth() {
    session_start();
    
    if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
        sendError("Authentication required", 401);
        return false;
    }
    
    return true;
}

/**
 * Paginate query results
 * 
 * @param int $page Current page number
 * @param int $perPage Items per page (default: 10)
 * @return array Offset and limit for SQL query
 */
function getPagination($page = 1, $perPage = 10) {
    $page = max(1, intval($page));
    $perPage = max(1, min(100, intval($perPage))); // Max 100 items per page
    $offset = ($page - 1) * $perPage;
    
    return [
        'offset' => $offset,
        'limit' => $perPage,
        'page' => $page
    ];
}
?>
