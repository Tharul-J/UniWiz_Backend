<?php
// FILE: uniwiz-backend/api/manage_skills_admin.php
// =====================================================
// This endpoint allows admin users to manage (view, add, delete) skills in the system.

header("Content-Type: application/json; charset=UTF-8"); // Respond with JSON
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend

// Handle preflight (OPTIONS) request for CORS
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

$method = $_SERVER['REQUEST_METHOD'];

// In a real application, you should add a security check here to ensure
// that only an authenticated admin user can perform these actions.
// For example:
// session_start();
// if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
//     http_response_code(403); // Forbidden
//     echo json_encode(["message" => "Access denied."]);
//     exit();
// }

try {
    switch ($method) {
        case 'GET':
            // Fetch all skills from the database
            $stmt = $db->prepare("SELECT id, name FROM skills ORDER BY name ASC");
            $stmt->execute();
            $skills = $stmt->fetchAll(PDO::FETCH_ASSOC);
            http_response_code(200);
            echo json_encode($skills);
            break;

        case 'POST':
            // Add a new skill
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->name)) {
                $name = htmlspecialchars(strip_tags($data->name));

                // Check for duplicates before inserting
                $check_stmt = $db->prepare("SELECT id FROM skills WHERE name = :name");
                $check_stmt->bindParam(':name', $name);
                $check_stmt->execute();

                if ($check_stmt->rowCount() > 0) {
                    http_response_code(409); // Conflict
                    echo json_encode(["message" => "Skill already exists."]);
                } else {
                    $stmt = $db->prepare("INSERT INTO skills (name) VALUES (:name)");
                    $stmt->bindParam(':name', $name);
                    if ($stmt->execute()) {
                        http_response_code(201); // Created
                        echo json_encode(["message" => "Skill created successfully."]);
                    } else {
                        throw new Exception("Failed to create skill.");
                    }
                }
            } else {
                http_response_code(400); // Bad Request
                echo json_encode(["message" => "Skill name is required."]);
            }
            break;

        case 'DELETE':
            // Delete a skill by its ID
            if (isset($_GET['id'])) {
                $id = (int)$_GET['id'];
                $stmt = $db->prepare("DELETE FROM skills WHERE id = :id");
                $stmt->bindParam(':id', $id, PDO::PARAM_INT);
                if ($stmt->execute()) {
                     if ($stmt->rowCount() > 0) {
                        http_response_code(200);
                        echo json_encode(["message" => "Skill deleted successfully."]);
                    } else {
                        http_response_code(404); // Not Found
                        echo json_encode(["message" => "Skill not found."]);
                    }
                } else {
                     throw new Exception("Failed to delete skill.");
                }
            } else {
                http_response_code(400);
                echo json_encode(["message" => "Skill ID is required."]);
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