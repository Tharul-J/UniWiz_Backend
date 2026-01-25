<?php
// FILE: uniwiz-backend/config/database.php (FULLY FIXED FOR .ENV LOADING)
// ======================================================================
// This file handles the database connection for the backend API.
// It loads environment variables from a .env file and provides a Database class for PDO connection.

// --- Load environment variables from .env file ---
// This ensures that this file can be included anywhere and still find the root .env file.
require_once __DIR__ . '/../vendor/autoload.php';
try {
    // createImmutable will throw an error if the .env file is not found.
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..'); 
    $dotenv->load();
} catch (Exception $e) {
    // This will help us debug if the .env file is missing.
    die("Error: Could not load the .env file. Please ensure it exists in the 'uniwiz-backend' directory. Details: " . $e->getMessage());
}

// --- Database Credentials (fallbacks, not used if .env is loaded) ---
$host = "localhost";
$dbname = "uniwiz_db";
$username = "root";
$password = ""; // Your Laragon password (usually empty)

class Database {
    // --- Database Credentials ---
    // These now come from the .env file, but we keep them here as fallbacks.
    private $host = "localhost";
    private $db_name = "uniwiz_db";
    private $username = "root";
    private $password = ""; // Your Laragon password (usually empty)
    public $conn;

    // --- Get the database connection ---
    public function getConnection() {
        $this->conn = null;

        try {
            // Create a new PDO connection
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            // This error is critical and should stop the script.
            die("DATABASE CONNECTION ERROR: " . $exception->getMessage());
        }

        return $this->conn;
    }
}
?>