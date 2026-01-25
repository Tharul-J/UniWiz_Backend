<?php
/**
 * FILE: uniwiz-backend/classes/users/User.php
 * ==============================================================================
 * Abstract User base class that defines common properties and methods
 * for all user types in the UniWiz system.
 */

require_once __DIR__ . '/../core/Database.php';

abstract class User {
    protected $id;
    protected $email;
    protected $firstName;
    protected $lastName;
    protected $role;
    protected $profileImageUrl;
    protected $status;
    protected $isVerified;
    protected $emailVerifiedAt;
    protected $createdAt;
    protected $updatedAt;
    
    protected $db;
    protected $data = [];
    
    /**
     * Constructor
     * @param array $data User data from database
     */
    public function __construct($data = []) {
        $this->db = Database::getInstance();
        
        if (!empty($data)) {
            $this->loadFromArray($data);
        }
    }
    
    /**
     * Load user data from array
     * @param array $data
     */
    protected function loadFromArray($data) {
        $this->data = $data;
        $this->id = $data['id'] ?? null;
        $this->email = $data['email'] ?? null;
        $this->firstName = $data['first_name'] ?? null;
        $this->lastName = $data['last_name'] ?? null;
        $this->role = $data['role'] ?? null;
        $this->profileImageUrl = $data['profile_image_url'] ?? null;
        $this->status = $data['status'] ?? 'active';
        $this->isVerified = $data['is_verified'] ?? false;
        $this->emailVerifiedAt = $data['email_verified_at'] ?? null;
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
    }
    
    /**
     * Find user by ID
     * @param int $id
     * @return static|null
     */
    public static function findById($id) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM users WHERE id = :id";
        $data = $db->selectOne($sql, ['id' => $id]);
        
        if ($data) {
            return static::createFromData($data);
        }
        
        return null;
    }
    
    /**
     * Find user by email
     * @param string $email
     * @return static|null
     */
    public static function findByEmail($email) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM users WHERE email = :email";
        $data = $db->selectOne($sql, ['email' => $email]);
        
        if ($data) {
            return static::createFromData($data);
        }
        
        return null;
    }
    
    /**
     * Create user instance from data based on role
     * @param array $data
     * @return static
     */
    public static function createFromData($data) {
        switch ($data['role']) {
            case 'student':
                require_once __DIR__ . '/Student.php';
                return new Student($data);
            case 'publisher':
                require_once __DIR__ . '/Publisher.php';
                return new Publisher($data);
            case 'admin':
                require_once __DIR__ . '/Admin.php';
                return new Admin($data);
            default:
                require_once __DIR__ . '/Visitor.php';
                return new Visitor($data);
        }
    }
    
    /**
     * Get all users with filters
     * @param array $filters
     * @return array
     */
    public static function getAll($filters = []) {
        $db = Database::getInstance();
        
        $sql = "SELECT * FROM users WHERE 1=1";
        $params = [];
        
        if (isset($filters['role'])) {
            $sql .= " AND role = :role";
            $params['role'] = $filters['role'];
        }
        
        if (isset($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (isset($filters['is_verified'])) {
            $sql .= " AND is_verified = :is_verified";
            $params['is_verified'] = $filters['is_verified'];
        }
        
        if (isset($filters['search'])) {
            $sql .= " AND (first_name LIKE :search OR last_name LIKE :search OR email LIKE :search OR company_name LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        if (isset($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = $filters['limit'];
        }
        
        $results = $db->select($sql, $params);
        $users = [];
        
        foreach ($results as $data) {
            $users[] = static::createFromData($data);
        }
        
        return $users;
    }
    
    /**
     * Save user to database
     * @return bool
     */
    public function save() {
        try {
            $data = [
                'email' => $this->email,
                'first_name' => $this->firstName,
                'last_name' => $this->lastName,
                'role' => $this->role,
                'profile_image_url' => $this->profileImageUrl,
                'status' => $this->status,
                'is_verified' => $this->isVerified,
                'email_verified_at' => $this->emailVerifiedAt,
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            if ($this->id) {
                // Update existing user
                $this->db->update('users', $data, ['id' => $this->id]);
            } else {
                // Insert new user
                $data['created_at'] = date('Y-m-d H:i:s');
                $this->id = $this->db->insert('users', $data);
            }
            
            return true;
        } catch (Exception $e) {
            error_log("User save error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete user
     * @return bool
     */
    public function delete() {
        try {
            if ($this->id) {
                $this->db->delete('users', ['id' => $this->id]);
                return true;
            }
            return false;
        } catch (Exception $e) {
            error_log("User delete error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Validate password
     * @param string $password
     * @return bool
     */
    public function validatePassword($password) {
        $sql = "SELECT password FROM users WHERE id = :id";
        $result = $this->db->selectOne($sql, ['id' => $this->id]);
        
        if ($result) {
            return password_verify($password, $result['password']);
        }
        
        return false;
    }
    
    /**
     * Update password
     * @param string $newPassword
     * @return bool
     */
    public function updatePassword($newPassword) {
        try {
            $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
            $this->db->update('users', ['password' => $hashedPassword], ['id' => $this->id]);
            return true;
        } catch (Exception $e) {
            error_log("Password update error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Verify email
     * @return bool
     */
    public function verifyEmail() {
        try {
            $this->isVerified = true;
            $this->emailVerifiedAt = date('Y-m-d H:i:s');
            
            $this->db->update('users', [
                'is_verified' => 1,
                'email_verified_at' => $this->emailVerifiedAt,
                'email_verification_token' => null
            ], ['id' => $this->id]);
            
            return true;
        } catch (Exception $e) {
            error_log("Email verification error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Block/Unblock user
     * @param bool $blocked
     * @return bool
     */
    public function setBlocked($blocked = true) {
        try {
            $this->status = $blocked ? 'blocked' : 'active';
            $this->db->update('users', ['status' => $this->status], ['id' => $this->id]);
            return true;
        } catch (Exception $e) {
            error_log("User block/unblock error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get full name
     * @return string
     */
    public function getFullName() {
        return trim($this->firstName . ' ' . $this->lastName);
    }
    
    /**
     * Check if user is verified
     * @return bool
     */
    public function isVerified() {
        return (bool)$this->isVerified;
    }
    
    /**
     * Check if user is blocked
     * @return bool
     */
    public function isBlocked() {
        return $this->status === 'blocked';
    }
    
    /**
     * Check if user is active
     * @return bool
     */
    public function isActive() {
        return $this->status === 'active';
    }
    
    /**
     * Get user's profile image URL
     * @return string
     */
    public function getProfileImageUrl() {
        if ($this->profileImageUrl) {
            return 'http://uniwiz-backend.test/api/' . $this->profileImageUrl;
        }
        
        return "https://ui-avatars.com/api/?name=" . urlencode($this->getFullName()) . "&background=E8EAF6&color=211C84";
    }
    
    /**
     * Convert user to array
     * @return array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'first_name' => $this->firstName,
            'last_name' => $this->lastName,
            'role' => $this->role,
            'profile_image_url' => $this->profileImageUrl,
            'status' => $this->status,
            'is_verified' => $this->isVerified,
            'email_verified_at' => $this->emailVerifiedAt,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
            'full_name' => $this->getFullName()
        ];
    }
    
    // Abstract methods that must be implemented by child classes
    abstract public function getPermissions();
    abstract public function canAccess($resource);
    abstract public function getProfileData();
    
    // Getters
    public function getId() { return $this->id; }
    public function getEmail() { return $this->email; }
    public function getFirstName() { return $this->firstName; }
    public function getLastName() { return $this->lastName; }
    public function getRole() { return $this->role; }
    public function getStatus() { return $this->status; }
    public function getCreatedAt() { return $this->createdAt; }
    
    // Setters
    public function setEmail($email) { $this->email = $email; }
    public function setFirstName($firstName) { $this->firstName = $firstName; }
    public function setLastName($lastName) { $this->lastName = $lastName; }
    public function setProfileImageUrl($url) { $this->profileImageUrl = $url; }
}
?>