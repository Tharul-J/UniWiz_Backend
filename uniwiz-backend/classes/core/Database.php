<?php
/**
 * FILE: uniwiz-backend/classes/core/Database.php
 * ==============================================================================
 * Enhanced Database class using Singleton pattern with ORM-like methods
 * for better data access abstraction and connection management.
 */

class Database {
    private static $instance = null;
    private $connection = null;
    
    // Database credentials (from environment or defaults)
    private $host;
    private $db_name;
    private $username;
    private $password;
    
    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct() {
        $this->loadConfig();
        $this->connect();
    }
    
    /**
     * Get singleton instance of Database
     * @return Database
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Prevent cloning of the instance
     */
    private function __clone() {}
    
    /**
     * Prevent unserialization of the instance
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
    
    /**
     * Load database configuration from environment or defaults
     */
    private function loadConfig() {
        // Load environment variables if available
        if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
            require_once __DIR__ . '/../../vendor/autoload.php';
            try {
                $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../..');
                $dotenv->load();
            } catch (Exception $e) {
                // Continue with default values
            }
        }
        
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->db_name = $_ENV['DB_NAME'] ?? 'uniwiz_db';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASS'] ?? '';
    }
    
    /**
     * Establish database connection
     */
    private function connect() {
        try {
            $this->connection = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $exception) {
            throw new Exception("Database connection failed: " . $exception->getMessage());
        }
    }
    
    /**
     * Get PDO connection
     * @return PDO
     */
    public function getConnection() {
        return $this->connection;
    }
    
    /**
     * Begin transaction
     */
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    /**
     * Commit transaction
     */
    public function commit() {
        return $this->connection->commit();
    }
    
    /**
     * Rollback transaction
     */
    public function rollback() {
        return $this->connection->rollback();
    }
    
    /**
     * Execute a SELECT query and return all results
     * @param string $sql
     * @param array $params
     * @return array
     */
    public function select($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new Exception("Select query failed: " . $e->getMessage());
        }
    }
    
    /**
     * Execute a SELECT query and return single result
     * @param string $sql
     * @param array $params
     * @return array|false
     */
    public function selectOne($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            throw new Exception("Select one query failed: " . $e->getMessage());
        }
    }
    
    /**
     * Insert a record and return the last insert ID
     * @param string $table
     * @param array $data
     * @return int
     */
    public function insert($table, $data) {
        try {
            $columns = implode(', ', array_keys($data));
            $placeholders = ':' . implode(', :', array_keys($data));
            
            $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
            $stmt = $this->connection->prepare($sql);
            
            foreach ($data as $key => $value) {
                $stmt->bindValue(":{$key}", $value);
            }
            
            $stmt->execute();
            return $this->connection->lastInsertId();
        } catch (PDOException $e) {
            throw new Exception("Insert query failed: " . $e->getMessage());
        }
    }
    
    /**
     * Update records
     * @param string $table
     * @param array $data
     * @param array $where
     * @return int Number of affected rows
     */
    public function update($table, $data, $where) {
        try {
            $setClause = [];
            foreach ($data as $key => $value) {
                $setClause[] = "{$key} = :{$key}";
            }
            
            $whereClause = [];
            foreach ($where as $key => $value) {
                $whereClause[] = "{$key} = :where_{$key}";
            }
            
            $sql = "UPDATE {$table} SET " . implode(', ', $setClause) . 
                   " WHERE " . implode(' AND ', $whereClause);
            
            $stmt = $this->connection->prepare($sql);
            
            // Bind data parameters
            foreach ($data as $key => $value) {
                $stmt->bindValue(":{$key}", $value);
            }
            
            // Bind where parameters
            foreach ($where as $key => $value) {
                $stmt->bindValue(":where_{$key}", $value);
            }
            
            $stmt->execute();
            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw new Exception("Update query failed: " . $e->getMessage());
        }
    }
    
    /**
     * Delete records
     * @param string $table
     * @param array $where
     * @return int Number of affected rows
     */
    public function delete($table, $where) {
        try {
            $whereClause = [];
            foreach ($where as $key => $value) {
                $whereClause[] = "{$key} = :{$key}";
            }
            
            $sql = "DELETE FROM {$table} WHERE " . implode(' AND ', $whereClause);
            $stmt = $this->connection->prepare($sql);
            
            foreach ($where as $key => $value) {
                $stmt->bindValue(":{$key}", $value);
            }
            
            $stmt->execute();
            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw new Exception("Delete query failed: " . $e->getMessage());
        }
    }
    
    /**
     * Execute custom query
     * @param string $sql
     * @param array $params
     * @return PDOStatement
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            throw new Exception("Query execution failed: " . $e->getMessage());
        }
    }
    
    /**
     * Check if a record exists
     * @param string $table
     * @param array $where
     * @return bool
     */
    public function exists($table, $where) {
        $whereClause = [];
        foreach ($where as $key => $value) {
            $whereClause[] = "{$key} = :{$key}";
        }
        
        $sql = "SELECT 1 FROM {$table} WHERE " . implode(' AND ', $whereClause) . " LIMIT 1";
        $result = $this->selectOne($sql, $where);
        
        return $result !== false;
    }
    
    /**
     * Count records in a table
     * @param string $table
     * @param array $where
     * @return int
     */
    public function count($table, $where = []) {
        $sql = "SELECT COUNT(*) as count FROM {$table}";
        
        if (!empty($where)) {
            $whereClause = [];
            foreach ($where as $key => $value) {
                $whereClause[] = "{$key} = :{$key}";
            }
            $sql .= " WHERE " . implode(' AND ', $whereClause);
        }
        
        $result = $this->selectOne($sql, $where);
        return (int)$result['count'];
    }
    
    /**
     * Get table columns
     * @param string $table
     * @return array
     */
    public function getTableColumns($table) {
        $sql = "DESCRIBE {$table}";
        $columns = $this->select($sql);
        return array_column($columns, 'Field');
    }
    
    /**
     * Sanitize input data
     * @param mixed $data
     * @return mixed
     */
    public function sanitize($data) {
        if (is_array($data)) {
            return array_map([$this, 'sanitize'], $data);
        }
        
        if (is_string($data)) {
            return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
        }
        
        return $data;
    }
    
    /**
     * Log database errors
     * @param string $message
     * @param array $context
     */
    private function logError($message, $context = []) {
        error_log("Database Error: " . $message . " Context: " . json_encode($context));
    }
}
?>