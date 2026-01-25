<?php
/**
 * FILE: uniwiz-backend/classes/users/Admin.php
 * ==============================================================================
 * Admin class extends User and represents administrator users
 * with system-wide management capabilities
 */

require_once __DIR__ . '/User.php';

class Admin extends User {
    
    /**
     * Get admin-specific permissions
     * @return array
     */
    public function getPermissions() {
        return [
            'manage_users',
            'view_all_users',
            'block_unblock_users',
            'verify_users',
            'delete_users',
            'manage_jobs',
            'view_all_jobs',
            'moderate_jobs',
            'manage_categories',
            'view_reports',
            'manage_site_settings',
            'view_analytics',
            'send_notifications',
            'manage_reviews',
            'export_data',
            'view_system_logs',
            'manage_payments',
            'access_admin_panel'
        ];
    }
    
    /**
     * Check if admin can access resource
     * @param string $resource
     * @return bool
     */
    public function canAccess($resource) {
        // Admins have access to everything unless explicitly blocked
        if ($this->status === 'blocked') {
            return false;
        }
        
        $permissions = $this->getPermissions();
        return in_array($resource, $permissions);
    }
    
    /**
     * Get admin profile data
     * @return array
     */
    public function getProfileData() {
        return [
            'role' => 'admin',
            'permissions' => $this->getPermissions(),
            'last_login' => $this->getLastLogin()
        ];
    }
    
    /**
     * Get dashboard statistics for admin
     * @return array
     */
    public function getDashboardStats() {
        try {
            $stats = [];
            
            // Total users by role
            $stats['total_students'] = $this->db->count('users', ['role' => 'student']);
            $stats['total_publishers'] = $this->db->count('users', ['role' => 'publisher']);
            $stats['total_admins'] = $this->db->count('users', ['role' => 'admin']);
            
            // User status counts
            $stats['active_users'] = $this->db->count('users', ['status' => 'active']);
            $stats['blocked_users'] = $this->db->count('users', ['status' => 'blocked']);
            $stats['unverified_users'] = $this->db->count('users', ['is_verified' => 0]);
            
            // Jobs statistics
            $stats['total_jobs'] = $this->db->count('jobs');
            $stats['active_jobs'] = $this->db->count('jobs', ['status' => 'active']);
            $stats['pending_jobs'] = $this->db->count('jobs', ['status' => 'pending']);
            
            // Applications statistics
            $stats['total_applications'] = $this->db->count('job_applications');
            $stats['pending_applications'] = $this->db->count('job_applications', ['status' => 'pending']);
            $stats['accepted_applications'] = $this->db->count('job_applications', ['status' => 'accepted']);
            
            // Recent activity
            $sql = "SELECT 'user_registration' as type, first_name, last_name, role, created_at as timestamp
                    FROM users 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    UNION ALL
                    SELECT 'job_posted' as type, j.title as first_name, '' as last_name, u.role, j.created_at as timestamp
                    FROM jobs j 
                    JOIN users u ON j.publisher_id = u.id
                    WHERE j.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    ORDER BY timestamp DESC 
                    LIMIT 10";
            $stats['recent_activity'] = $this->db->select($sql);
            
            // Reviews and ratings
            $stats['total_reviews'] = $this->db->count('company_reviews');
            $sql = "SELECT AVG(rating) as average_rating FROM company_reviews";
            $result = $this->db->selectOne($sql);
            $stats['average_rating'] = $result['average_rating'] ? round($result['average_rating'], 1) : 0;
            
            return $stats;
        } catch (Exception $e) {
            error_log("Admin dashboard stats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get all users with advanced filtering
     * @param array $filters
     * @return array
     */
    public function getAllUsers($filters = []) {
        try {
            $sql = "SELECT u.*, sp.university_name, sp.field_of_study, sp.cv_url,
                           pp.industry, pp.required_doc_url
                    FROM users u
                    LEFT JOIN student_profiles sp ON u.id = sp.user_id
                    LEFT JOIN publisher_profiles pp ON u.id = pp.user_id
                    WHERE 1=1";
            
            $params = [];
            
            if (isset($filters['role'])) {
                $sql .= " AND u.role = :role";
                $params['role'] = $filters['role'];
            }
            
            if (isset($filters['status'])) {
                $sql .= " AND u.status = :status";
                $params['status'] = $filters['status'];
            }
            
            if (isset($filters['is_verified'])) {
                $sql .= " AND u.is_verified = :is_verified";
                $params['is_verified'] = $filters['is_verified'];
            }
            
            if (isset($filters['search'])) {
                $sql .= " AND (u.first_name LIKE :search OR u.last_name LIKE :search 
                          OR u.email LIKE :search OR u.company_name LIKE :search)";
                $params['search'] = '%' . $filters['search'] . '%';
            }
            
            $sql .= " ORDER BY u.created_at DESC";
            
            if (isset($filters['limit'])) {
                $sql .= " LIMIT :limit";
                $params['limit'] = $filters['limit'];
            }
            
            return $this->db->select($sql, $params);
        } catch (Exception $e) {
            error_log("Get all users error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Update user status (active/blocked)
     * @param int $userId
     * @param string $status
     * @return bool|string
     */
    public function updateUserStatus($userId, $status) {
        try {
            if (!in_array($status, ['active', 'blocked'])) {
                return "Invalid status";
            }
            
            if ($userId == $this->id) {
                return "Cannot modify your own status";
            }
            
            $this->db->update('users', ['status' => $status], ['id' => $userId]);
            
            // Create notification for user
            $message = $status === 'blocked' 
                ? "Your account has been blocked by an administrator" 
                : "Your account has been unblocked";
                
            $this->createNotificationForUser($userId, 'account_status', $message);
            
            return true;
        } catch (Exception $e) {
            error_log("Update user status error: " . $e->getMessage());
            return "An error occurred while updating user status";
        }
    }
    
    /**
     * Verify/unverify user
     * @param int $userId
     * @param bool $verified
     * @return bool|string
     */
    public function updateUserVerification($userId, $verified) {
        try {
            $this->db->update('users', [
                'is_verified' => $verified ? 1 : 0,
                'email_verified_at' => $verified ? date('Y-m-d H:i:s') : null
            ], ['id' => $userId]);
            
            // Create notification for user
            $message = $verified 
                ? "Your account has been verified by an administrator" 
                : "Your account verification has been revoked";
                
            $this->createNotificationForUser($userId, 'account_verification', $message);
            
            return true;
        } catch (Exception $e) {
            error_log("Update user verification error: " . $e->getMessage());
            return "An error occurred while updating user verification";
        }
    }
    
    /**
     * Delete user account
     * @param int $userId
     * @return bool|string
     */
    public function deleteUser($userId) {
        try {
            if ($userId == $this->id) {
                return "Cannot delete your own account";
            }
            
            $this->db->beginTransaction();
            
            // Delete related data first (foreign key constraints)
            $this->db->delete('job_applications', ['student_id' => $userId]);
            $this->db->delete('company_reviews', ['student_id' => $userId]);
            $this->db->delete('wishlist', ['student_id' => $userId]);
            $this->db->delete('notifications', ['user_id' => $userId]);
            $this->db->delete('jobs', ['publisher_id' => $userId]);
            $this->db->delete('student_profiles', ['user_id' => $userId]);
            $this->db->delete('publisher_profiles', ['user_id' => $userId]);
            
            // Delete user
            $this->db->delete('users', ['id' => $userId]);
            
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Delete user error: " . $e->getMessage());
            return "An error occurred while deleting the user";
        }
    }
    
    /**
     * Get all jobs with admin filters
     * @param array $filters
     * @return array
     */
    public function getAllJobs($filters = []) {
        try {
            $sql = "SELECT j.*, u.company_name, u.first_name, u.last_name, jc.name as category_name,
                           (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as application_count
                    FROM jobs j
                    JOIN users u ON j.publisher_id = u.id
                    LEFT JOIN job_categories jc ON j.category_id = jc.id
                    WHERE 1=1";
            
            $params = [];
            
            if (isset($filters['status'])) {
                $sql .= " AND j.status = :status";
                $params['status'] = $filters['status'];
            }
            
            if (isset($filters['category_id'])) {
                $sql .= " AND j.category_id = :category_id";
                $params['category_id'] = $filters['category_id'];
            }
            
            if (isset($filters['search'])) {
                $sql .= " AND (j.title LIKE :search OR j.description LIKE :search)";
                $params['search'] = '%' . $filters['search'] . '%';
            }
            
            $sql .= " ORDER BY j.created_at DESC";
            
            if (isset($filters['limit'])) {
                $sql .= " LIMIT :limit";
                $params['limit'] = $filters['limit'];
            }
            
            return $this->db->select($sql, $params);
        } catch (Exception $e) {
            error_log("Get all jobs error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Update job status
     * @param int $jobId
     * @param string $status
     * @return bool|string
     */
    public function updateJobStatus($jobId, $status) {
        try {
            $allowedStatuses = ['active', 'inactive', 'pending', 'expired'];
            if (!in_array($status, $allowedStatuses)) {
                return "Invalid job status";
            }
            
            $this->db->update('jobs', ['status' => $status], ['id' => $jobId]);
            
            // Get job and publisher info for notification
            $sql = "SELECT j.title, j.publisher_id FROM jobs j WHERE j.id = :job_id";
            $job = $this->db->selectOne($sql, ['job_id' => $jobId]);
            
            if ($job) {
                $message = "Your job posting '{$job['title']}' status has been changed to {$status}";
                $this->createNotificationForUser($job['publisher_id'], 'job_status_update', $message);
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Update job status error: " . $e->getMessage());
            return "An error occurred while updating job status";
        }
    }
    
    /**
     * Get system reports
     * @param string $reportType
     * @param array $params
     * @return array
     */
    public function getSystemReports($reportType, $params = []) {
        try {
            switch ($reportType) {
                case 'user_activity':
                    return $this->getUserActivityReport($params);
                case 'job_performance':
                    return $this->getJobPerformanceReport($params);
                case 'revenue_analytics':
                    return $this->getRevenueAnalytics($params);
                default:
                    return [];
            }
        } catch (Exception $e) {
            error_log("System reports error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Create notification for specific user
     * @param int $userId
     * @param string $type
     * @param string $message
     * @param string $link
     */
    private function createNotificationForUser($userId, $type, $message, $link = '') {
        try {
            $this->db->insert('notifications', [
                'user_id' => $userId,
                'type' => $type,
                'message' => $message,
                'link' => $link,
                'is_read' => 0,
                'created_at' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            error_log("User notification error: " . $e->getMessage());
        }
    }
    
    /**
     * Get last login time
     * @return string|null
     */
    private function getLastLogin() {
        // This would require implementing login tracking
        return null;
    }
    
    /**
     * Get user activity report
     * @param array $params
     * @return array
     */
    private function getUserActivityReport($params) {
        // Implementation for user activity reporting
        return [];
    }
    
    /**
     * Get job performance report
     * @param array $params
     * @return array
     */
    private function getJobPerformanceReport($params) {
        // Implementation for job performance reporting
        return [];
    }
    
    /**
     * Get revenue analytics
     * @param array $params
     * @return array
     */
    private function getRevenueAnalytics($params) {
        // Implementation for revenue analytics
        return [];
    }
}
?>