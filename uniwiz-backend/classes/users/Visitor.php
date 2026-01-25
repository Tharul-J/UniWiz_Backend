<?php
/**
 * FILE: uniwiz-backend/classes/users/Visitor.php
 * ==============================================================================
 * Visitor class extends User and represents non-registered visitors
 * with limited access to public content
 */

require_once __DIR__ . '/User.php';

class Visitor extends User {
    
    /**
     * Constructor for visitor (usually called with empty data)
     * @param array $data
     */
    public function __construct($data = []) {
        parent::__construct($data);
        $this->role = 'visitor';
        $this->status = 'active';
    }
    
    /**
     * Get visitor permissions (very limited)
     * @return array
     */
    public function getPermissions() {
        return [
            'view_public_jobs',
            'search_jobs',
            'view_company_profiles',
            'register_account',
            'login'
        ];
    }
    
    /**
     * Check if visitor can access resource
     * @param string $resource
     * @return bool
     */
    public function canAccess($resource) {
        $permissions = $this->getPermissions();
        return in_array($resource, $permissions);
    }
    
    /**
     * Get visitor profile data (minimal)
     * @return array
     */
    public function getProfileData() {
        return [
            'role' => 'visitor',
            'permissions' => $this->getPermissions(),
            'session_id' => session_id()
        ];
    }
    
    /**
     * Get public jobs that visitors can view
     * @param array $filters
     * @return array
     */
    public function getPublicJobs($filters = []) {
        try {
            $sql = "SELECT j.id, j.title, j.job_type, j.payment_range, j.location, 
                           j.created_at, j.deadline, j.vacancies,
                           u.company_name, u.first_name, u.last_name, u.profile_image_url,
                           jc.name as category_name,
                           (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as application_count
                    FROM jobs j
                    JOIN users u ON j.publisher_id = u.id
                    LEFT JOIN job_categories jc ON j.category_id = jc.id
                    WHERE j.status = 'active'";
            
            $params = [];
            
            if (isset($filters['search'])) {
                $sql .= " AND (j.title LIKE :search OR j.description LIKE :search)";
                $params['search'] = '%' . $filters['search'] . '%';
            }
            
            if (isset($filters['category_id'])) {
                $sql .= " AND j.category_id = :category_id";
                $params['category_id'] = $filters['category_id'];
            }
            
            if (isset($filters['job_type'])) {
                $sql .= " AND j.job_type = :job_type";
                $params['job_type'] = $filters['job_type'];
            }
            
            $sql .= " ORDER BY j.created_at DESC";
            
            if (isset($filters['limit'])) {
                $sql .= " LIMIT :limit";
                $params['limit'] = $filters['limit'];
            } else {
                $sql .= " LIMIT 50"; // Default limit for visitors
            }
            
            return $this->db->select($sql, $params);
        } catch (Exception $e) {
            error_log("Get public jobs error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get public company profiles
     * @param int $publisherId
     * @return array|null
     */
    public function getPublicCompanyProfile($publisherId) {
        try {
            $sql = "SELECT u.id, u.company_name, u.first_name, u.last_name, 
                           u.profile_image_url, u.is_verified,
                           pp.about, pp.industry, pp.website_url, pp.address,
                           pp.facebook_url, pp.linkedin_url, pp.instagram_url, pp.cover_image_url,
                           (SELECT AVG(rating) FROM company_reviews WHERE publisher_id = u.id) as average_rating,
                           (SELECT COUNT(*) FROM company_reviews WHERE publisher_id = u.id) as review_count,
                           (SELECT COUNT(*) FROM jobs WHERE publisher_id = u.id AND status = 'active') as active_jobs_count
                    FROM users u
                    LEFT JOIN publisher_profiles pp ON u.id = pp.user_id
                    WHERE u.id = :publisher_id AND u.role = 'publisher' AND u.status = 'active'";
            
            return $this->db->selectOne($sql, ['publisher_id' => $publisherId]);
        } catch (Exception $e) {
            error_log("Get public company profile error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get public job details
     * @param int $jobId
     * @return array|null
     */
    public function getPublicJobDetails($jobId) {
        try {
            $sql = "SELECT j.*, u.company_name, u.first_name, u.last_name, u.profile_image_url,
                           u.is_verified, jc.name as category_name,
                           pp.about as company_about, pp.industry, pp.website_url,
                           (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as application_count,
                           (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted') as accepted_count,
                           (SELECT AVG(rating) FROM company_reviews WHERE publisher_id = u.id) as company_rating
                    FROM jobs j
                    JOIN users u ON j.publisher_id = u.id
                    LEFT JOIN job_categories jc ON j.category_id = jc.id
                    LEFT JOIN publisher_profiles pp ON u.id = pp.user_id
                    WHERE j.id = :job_id AND j.status = 'active' AND u.status = 'active'";
            
            return $this->db->selectOne($sql, ['job_id' => $jobId]);
        } catch (Exception $e) {
            error_log("Get public job details error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get job categories for public viewing
     * @return array
     */
    public function getJobCategories() {
        try {
            $sql = "SELECT jc.*, 
                           (SELECT COUNT(*) FROM jobs j WHERE j.category_id = jc.id AND j.status = 'active') as active_jobs_count
                    FROM job_categories jc
                    WHERE jc.is_active = 1
                    ORDER BY jc.name ASC";
            
            return $this->db->select($sql);
        } catch (Exception $e) {
            error_log("Get job categories error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get public company reviews
     * @param int $publisherId
     * @param int $limit
     * @return array
     */
    public function getPublicCompanyReviews($publisherId, $limit = 10) {
        try {
            $sql = "SELECT r.rating, r.review_text, r.created_at,
                           u.first_name, u.last_name, u.profile_image_url
                    FROM company_reviews r
                    JOIN users u ON r.student_id = u.id
                    WHERE r.publisher_id = :publisher_id
                    ORDER BY r.created_at DESC
                    LIMIT :limit";
            
            return $this->db->select($sql, [
                'publisher_id' => $publisherId,
                'limit' => $limit
            ]);
        } catch (Exception $e) {
            error_log("Get public company reviews error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Search jobs with public filters
     * @param string $searchTerm
     * @param array $filters
     * @return array
     */
    public function searchJobs($searchTerm, $filters = []) {
        try {
            $sql = "SELECT j.id, j.title, j.job_type, j.payment_range, j.location, 
                           j.created_at, j.deadline, j.vacancies,
                           u.company_name, u.first_name, u.last_name, u.profile_image_url,
                           jc.name as category_name,
                           (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as application_count
                    FROM jobs j
                    JOIN users u ON j.publisher_id = u.id
                    LEFT JOIN job_categories jc ON j.category_id = jc.id
                    WHERE j.status = 'active' AND u.status = 'active'";
            
            $params = [];
            
            if (!empty($searchTerm)) {
                $sql .= " AND (j.title LIKE :search OR j.description LIKE :search 
                          OR u.company_name LIKE :search OR jc.name LIKE :search)";
                $params['search'] = '%' . $searchTerm . '%';
            }
            
            if (isset($filters['category_id']) && $filters['category_id'] !== '') {
                $sql .= " AND j.category_id = :category_id";
                $params['category_id'] = $filters['category_id'];
            }
            
            if (isset($filters['job_type']) && $filters['job_type'] !== '') {
                $sql .= " AND j.job_type = :job_type";
                $params['job_type'] = $filters['job_type'];
            }
            
            if (isset($filters['location']) && $filters['location'] !== '') {
                $sql .= " AND j.location LIKE :location";
                $params['location'] = '%' . $filters['location'] . '%';
            }
            
            $sql .= " ORDER BY j.created_at DESC LIMIT 50";
            
            return $this->db->select($sql, $params);
        } catch (Exception $e) {
            error_log("Search jobs error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get site statistics for public display
     * @return array
     */
    public function getPublicStats() {
        try {
            $stats = [];
            
            $stats['total_jobs'] = $this->db->count('jobs', ['status' => 'active']);
            $stats['total_companies'] = $this->db->count('users', ['role' => 'publisher', 'status' => 'active']);
            $stats['total_students'] = $this->db->count('users', ['role' => 'student', 'status' => 'active']);
            $stats['total_applications'] = $this->db->count('job_applications');
            
            return $stats;
        } catch (Exception $e) {
            error_log("Get public stats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Convert visitor to array
     * @return array
     */
    public function toArray() {
        return [
            'id' => null,
            'email' => null,
            'first_name' => null,
            'last_name' => null,
            'role' => 'visitor',
            'profile_image_url' => null,
            'status' => 'active',
            'is_verified' => false,
            'permissions' => $this->getPermissions(),
            'session_id' => session_id()
        ];
    }
    
    /**
     * Visitors don't have dashboard stats
     * @return array
     */
    public function getDashboardStats() {
        return [];
    }
    
    /**
     * Save method is not applicable for visitors
     * @return bool
     */
    public function save() {
        return false;
    }
    
    /**
     * Delete method is not applicable for visitors
     * @return bool
     */
    public function delete() {
        return false;
    }
}
?>