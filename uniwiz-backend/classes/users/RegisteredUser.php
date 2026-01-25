<?php
/**
 * FILE: uniwiz-backend/classes/users/RegisteredUser.php
 * ==============================================================================
 * RegisteredUser class extends User and represents users who have 
 * registered accounts (Students and Publishers)
 */

require_once __DIR__ . '/User.php';

abstract class RegisteredUser extends User {
    protected $companyName;
    protected $profileData = [];
    
    /**
     * Constructor
     * @param array $data User data from database
     */
    public function __construct($data = []) {
        parent::__construct($data);
        
        if (!empty($data)) {
            $this->companyName = $data['company_name'] ?? null;
        }
    }
    
    /**
     * Get base permissions for registered users
     * @return array
     */
    public function getPermissions() {
        return [
            'view_dashboard',
            'update_profile',
            'upload_profile_image',
            'change_password',
            'view_notifications',
            'mark_notifications_read'
        ];
    }
    
    /**
     * Check if registered user can access resource
     * @param string $resource
     * @return bool
     */
    public function canAccess($resource) {
        $permissions = $this->getPermissions();
        return in_array($resource, $permissions);
    }
    
    /**
     * Update profile information
     * @param array $profileData
     * @return bool
     */
    public function updateProfile($profileData) {
        try {
            $this->db->beginTransaction();
            
            // Update basic user information
            $userData = [];
            if (isset($profileData['first_name'])) {
                $this->firstName = $profileData['first_name'];
                $userData['first_name'] = $this->firstName;
            }
            if (isset($profileData['last_name'])) {
                $this->lastName = $profileData['last_name'];
                $userData['last_name'] = $this->lastName;
            }
            if (isset($profileData['company_name'])) {
                $this->companyName = $profileData['company_name'];
                $userData['company_name'] = $this->companyName;
            }
            if (isset($profileData['profile_image_url'])) {
                $this->profileImageUrl = $profileData['profile_image_url'];
                $userData['profile_image_url'] = $this->profileImageUrl;
            }
            
            if (!empty($userData)) {
                $userData['updated_at'] = date('Y-m-d H:i:s');
                $this->db->update('users', $userData, ['id' => $this->id]);
            }
            
            // Update profile table (implemented in child classes)
            $this->updateProfileTable($profileData);
            
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Profile update error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Create notification for user
     * @param string $type
     * @param string $message
     * @param string $link
     * @return bool
     */
    public function createNotification($type, $message, $link = '') {
        try {
            $data = [
                'user_id' => $this->id,
                'type' => $type,
                'message' => $message,
                'link' => $link,
                'is_read' => 0,
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->insert('notifications', $data);
            return true;
        } catch (Exception $e) {
            error_log("Notification creation error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get user notifications
     * @param int $limit
     * @param bool $unreadOnly
     * @return array
     */
    public function getNotifications($limit = 20, $unreadOnly = false) {
        $sql = "SELECT * FROM notifications WHERE user_id = :user_id";
        $params = ['user_id' => $this->id];
        
        if ($unreadOnly) {
            $sql .= " AND is_read = 0";
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        if ($limit > 0) {
            $sql .= " LIMIT :limit";
            $params['limit'] = $limit;
        }
        
        return $this->db->select($sql, $params);
    }
    
    /**
     * Mark notification as read
     * @param int $notificationId
     * @return bool
     */
    public function markNotificationRead($notificationId) {
        try {
            $this->db->update('notifications', 
                ['is_read' => 1], 
                ['id' => $notificationId, 'user_id' => $this->id]
            );
            return true;
        } catch (Exception $e) {
            error_log("Mark notification read error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Mark all notifications as read
     * @return bool
     */
    public function markAllNotificationsRead() {
        try {
            $this->db->update('notifications', 
                ['is_read' => 1], 
                ['user_id' => $this->id]
            );
            return true;
        } catch (Exception $e) {
            error_log("Mark all notifications read error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get unread notification count
     * @return int
     */
    public function getUnreadNotificationCount() {
        return $this->db->count('notifications', [
            'user_id' => $this->id,
            'is_read' => 0
        ]);
    }
    
    /**
     * Upload profile image
     * @param array $file
     * @return string|false
     */
    public function uploadProfileImage($file) {
        try {
            // Validate file
            if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
                throw new Exception("Invalid file upload");
            }
            
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!in_array($file['type'], $allowedTypes)) {
                throw new Exception("Invalid file type. Only JPEG, PNG, and GIF allowed.");
            }
            
            $maxSize = 5 * 1024 * 1024; // 5MB
            if ($file['size'] > $maxSize) {
                throw new Exception("File too large. Maximum size is 5MB.");
            }
            
            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'user_' . $this->id . '_' . time() . '.' . $extension;
            $uploadPath = __DIR__ . '/../../api/uploads/' . $filename;
            
            // Create directory if it doesn't exist
            $uploadDir = dirname($uploadPath);
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                $relativePath = 'uploads/' . $filename;
                
                // Update database
                $this->profileImageUrl = $relativePath;
                $this->db->update('users', 
                    ['profile_image_url' => $relativePath], 
                    ['id' => $this->id]
                );
                
                return $relativePath;
            } else {
                throw new Exception("Failed to upload file");
            }
        } catch (Exception $e) {
            error_log("Profile image upload error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Convert registered user to array
     * @return array
     */
    public function toArray() {
        $data = parent::toArray();
        $data['company_name'] = $this->companyName;
        $data['profile_data'] = $this->getProfileData();
        $data['unread_notifications'] = $this->getUnreadNotificationCount();
        return $data;
    }
    
    // Abstract methods to be implemented by child classes
    abstract protected function updateProfileTable($profileData);
    abstract public function getDashboardStats();
    
    // Getters
    public function getCompanyName() { return $this->companyName; }
    
    // Setters
    public function setCompanyName($companyName) { $this->companyName = $companyName; }
}
?>