<?php
// FILE: uniwiz-backend/api/manage_categories_admin.php
// =====================================================
// This endpoint allows admin users to manage (view, add, delete) job categories in the system.

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// Handle preflight (OPTIONS) request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
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

$method = $_SERVER['REQUEST_METHOD'];

// Security Check: Ensure only authenticated admins can access this.
// (This is a placeholder for your actual session/token validation)
/*
session_start();
if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    http_response_code(403); // Forbidden
    echo json_encode(["message" => "Access denied. Administrator privileges required."]);
    exit();
}
*/

try {
    switch ($method) {
        case 'GET':
            // Fetch all job categories from the database
            $stmt = $db->prepare("SELECT id, name FROM job_categories ORDER BY name ASC");
            $stmt->execute();
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Fix HTML entities in category names
            foreach ($categories as &$category) {
                $category['name'] = html_entity_decode($category['name'], ENT_QUOTES, 'UTF-8');
            }
            
            http_response_code(200);
            echo json_encode($categories);
            break;

        case 'POST':
            // Add a new job category
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->name)) {
                $name = htmlspecialchars(strip_tags($data->name));

                // Check for duplicates
                $check_stmt = $db->prepare("SELECT id FROM job_categories WHERE name = :name");
                $check_stmt->bindParam(':name', $name);
                $check_stmt->execute();

                if ($check_stmt->rowCount() > 0) {
                    http_response_code(409); // Conflict
                    echo json_encode(["message" => "Category already exists."]);
                } else {
                    $stmt = $db->prepare("INSERT INTO job_categories (name) VALUES (:name)");
                    $stmt->bindParam(':name', $name);
                    if ($stmt->execute()) {
                        http_response_code(201); // Created
                        echo json_encode(["message" => "Category created successfully."]);
                    } else {
                        throw new Exception("Failed to create category.");
                    }
                }
            } else {
                http_response_code(400); // Bad Request
                echo json_encode(["message" => "Category name is required."]);
            }
            break;

        case 'DELETE':
            // Delete a category by its ID
            if (isset($_GET['id'])) {
                $id = (int)$_GET['id'];

                // Note: You might want to check if any jobs are using this category before deleting.
                // The current database schema uses ON DELETE RESTRICT, which will prevent deletion if jobs are linked.
                $stmt = $db->prepare("DELETE FROM job_categories WHERE id = :id");
                $stmt->bindParam(':id', $id, PDO::PARAM_INT);
                
                if ($stmt->execute()) {
                    if ($stmt->rowCount() > 0) {
                        http_response_code(200);
                        echo json_encode(["message" => "Category deleted successfully."]);
                    } else {
                        http_response_code(404); // Not Found
                        echo json_encode(["message" => "Category not found."]);
                    }
                } else {
                    // This error will likely trigger if jobs are associated with the category
                    http_response_code(409); // Conflict
                    echo json_encode(["message" => "Cannot delete category. It is currently in use by one or more jobs."]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["message" => "Category ID is required."]);
            }
            break;
            
        default:
            // Handle any other methods
            http_response_code(405); // Method Not Allowed
            echo json_encode(["message" => "Method not allowed."]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "A server error occurred: " . $e->getMessage()]);
}
?>