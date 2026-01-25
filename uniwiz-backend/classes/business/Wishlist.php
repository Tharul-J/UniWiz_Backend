<?php
/**
 * FILE: uniwiz-backend/classes/business/Wishlist.php
 * ==============================================================================
 * Wishlist class represents saved jobs by students
 */

require_once __DIR__ . '/../core/Database.php';

class Wishlist {
    protected $id;
    protected $studentId;
    protected $jobId;
    protected $createdAt;
    
    protected $db;
    protected $studentData;
    protected $jobData;
    
    /**
     * Constructor
     * @param array $data Wishlist data from database
     */
    public function __construct($data = []) {
        $this->db = Database::getInstance();
        
        if (!empty($data)) {
            $this->loadFromArray($data);
        }
    }
    
    /**
     * Load wishlist data from array
     * @param array $data
     */
    protected function loadFromArray($data) {
        $this->id = $data['id'] ?? null;
        $this->studentId = $data['student_id'] ?? null;
        $this->jobId = $data['job_id'] ?? null;
        $this->createdAt = $data['created_at'] ?? null;
    }
    
    /**
     * Find wishlist item by ID
     * @param int $id
     * @return Wishlist|null
     */
    public static function findById($id) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM wishlist WHERE id = :id";
        $data = $db->selectOne($sql, ['id' => $id]);
        
        if ($data) {
            return new self($data);
        }
        
        return null;
    }
    
    /**
     * Find wishlist item by student and job
     * @param int $studentId
     * @param int $jobId
     * @return Wishlist|null
     */
    public static function findByStudentAndJob($studentId, $jobId) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM wishlist WHERE student_id = :student_id AND job_id = :job_id";
        $data = $db->selectOne($sql, ['student_id' => $studentId, 'job_id' => $jobId]);
        
        if ($data) {
            return new self($data);
        }
        
        return null;
    }
    
    /**
     * Check if job is in student's wishlist
     * @param int $studentId
     * @param int $jobId
     * @return bool
     */
    public static function isJobInWishlist($studentId, $jobId) {
        return self::findByStudentAndJob($studentId, $jobId) !== null;
    }
    
    /**
     * Get all wishlist items for a student
     * @param int $studentId
     * @param array $options Additional options (limit, offset, order)
     * @return array
     */
    public static function getByStudent($studentId, $options = []) {
        $db = Database::getInstance();
        
        $sql = "SELECT w.*, 
                       j.title, j.description, j.payment_range, j.location, j.job_type, 
                       j.status as job_status, j.deadline, j.created_at as job_created,
                       u.company_name, u.first_name as pub_first_name, u.last_name as pub_last_name,
                       u.profile_image_url as pub_image,
                       jc.name as category_name
                FROM wishlist w
                JOIN jobs j ON w.job_id = j.id
                JOIN users u ON j.publisher_id = u.id
                LEFT JOIN job_categories jc ON j.category_id = jc.id
                WHERE w.student_id = :student_id";
        
        $params = ['student_id' => $studentId];
        
        // Add ordering
        $orderBy = $options['order'] ?? 'w.created_at DESC';
        $sql .= " ORDER BY " . $orderBy;
        
        // Add limit and offset
        if (isset($options['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = $options['limit'];
            
            if (isset($options['offset'])) {
                $sql .= " OFFSET :offset";
                $params['offset'] = $options['offset'];
            }
        }
        
        $results = $db->select($sql, $params);
        $wishlistItems = [];
        
        foreach ($results as $data) {
            $wishlistItems[] = new self($data);
        }
        
        return $wishlistItems;
    }
    
    /**
     * Get all wishlist items with filters
     * @param array $filters
     * @return array
     */
    public static function getAll($filters = []) {
        $db = Database::getInstance();
        
        $sql = "SELECT w.*, 
                       j.title, j.description, j.payment_range, j.location, j.job_type,
                       j.status as job_status, j.deadline,
                       u.company_name, u.first_name as pub_first_name, u.last_name as pub_last_name,
                       st_u.first_name as student_first_name, st_u.last_name as student_last_name,
                       jc.name as category_name
                FROM wishlist w
                JOIN jobs j ON w.job_id = j.id
                JOIN users u ON j.publisher_id = u.id
                JOIN users st_u ON w.student_id = st_u.id
                LEFT JOIN job_categories jc ON j.category_id = jc.id
                WHERE 1=1";
        
        $params = [];
        
        if (isset($filters['student_id'])) {
            $sql .= " AND w.student_id = :student_id";
            $params['student_id'] = $filters['student_id'];
        }
        
        if (isset($filters['job_id'])) {
            $sql .= " AND w.job_id = :job_id";
            $params['job_id'] = $filters['job_id'];
        }
        
        if (isset($filters['job_status'])) {
            $sql .= " AND j.status = :job_status";
            $params['job_status'] = $filters['job_status'];
        }
        
        if (isset($filters['category_id'])) {
            $sql .= " AND j.category_id = :category_id";
            $params['category_id'] = $filters['category_id'];
        }
        
        $sql .= " ORDER BY w.created_at DESC";
        
        if (isset($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = $filters['limit'];
        }
        
        $results = $db->select($sql, $params);
        $wishlistItems = [];
        
        foreach ($results as $data) {
            $wishlistItems[] = new self($data);
        }
        
        return $wishlistItems;
    }
    
    /**
     * Add job to wishlist
     * @param int $studentId
     * @param int $jobId
     * @return Wishlist|string
     */
    public static function addToWishlist($studentId, $jobId) {
        $db = Database::getInstance();
        
        try {
            // Check if already in wishlist
            if (self::findByStudentAndJob($studentId, $jobId)) {
                return "Job is already in your wishlist";
            }
            
            // Check if job exists and is active
            $job = $db->selectOne("SELECT * FROM jobs WHERE id = :id AND status = 'active'", ['id' => $jobId]);
            if (!$job) {
                return "Job not found or no longer active";
            }
            
            // Check if student exists
            if (!$db->exists('users', ['id' => $studentId, 'role' => 'student'])) {
                return "Student not found";
            }
            
            $wishlistData = [
                'student_id' => $studentId,
                'job_id' => $jobId,
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $wishlistId = $db->insert('wishlist', $wishlistData);
            $wishlistData['id'] = $wishlistId;
            
            return new self($wishlistData);
        } catch (Exception $e) {
            error_log("Wishlist add error: " . $e->getMessage());
            return "An error occurred while adding to wishlist";
        }
    }
    
    /**
     * Remove job from wishlist
     * @param int $studentId
     * @param int $jobId
     * @return bool|string
     */
    public static function removeFromWishlist($studentId, $jobId) {
        $db = Database::getInstance();
        
        try {
            $wishlistItem = self::findByStudentAndJob($studentId, $jobId);
            if (!$wishlistItem) {
                return "Job is not in your wishlist";
            }
            
            return $wishlistItem->delete();
        } catch (Exception $e) {
            error_log("Wishlist remove error: " . $e->getMessage());
            return "An error occurred while removing from wishlist";
        }
    }
    
    /**
     * Toggle job in wishlist
     * @param int $studentId
     * @param int $jobId
     * @return array Result with action and message
     */
    public static function toggleWishlist($studentId, $jobId) {
        if (self::isJobInWishlist($studentId, $jobId)) {
            $result = self::removeFromWishlist($studentId, $jobId);
            return [
                'action' => 'removed',
                'success' => $result === true,
                'message' => $result === true ? 'Removed from wishlist' : $result
            ];
        } else {
            $result = self::addToWishlist($studentId, $jobId);
            return [
                'action' => 'added',
                'success' => is_object($result),
                'message' => is_object($result) ? 'Added to wishlist' : $result
            ];
        }
    }
    
    /**
     * Save wishlist item to database
     * @return bool
     */
    public function save() {
        try {
            $data = [
                'student_id' => $this->studentId,
                'job_id' => $this->jobId,
                'created_at' => $this->createdAt ?? date('Y-m-d H:i:s')
            ];
            
            if ($this->id) {
                // Update existing wishlist item (though updates are rare)
                $this->db->update('wishlist', $data, ['id' => $this->id]);
            } else {
                // Insert new wishlist item
                $this->id = $this->db->insert('wishlist', $data);
                $this->createdAt = $data['created_at'];
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Wishlist save error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete wishlist item
     * @return bool
     */
    public function delete() {
        try {
            if ($this->id) {
                $this->db->delete('wishlist', ['id' => $this->id]);
                return true;
            }
            return false;
        } catch (Exception $e) {
            error_log("Wishlist delete error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get student data
     * @return array|null
     */
    public function getStudent() {
        if (!$this->studentData && $this->studentId) {
            $sql = "SELECT u.*, sp.* FROM users u 
                    LEFT JOIN student_profiles sp ON u.id = sp.user_id
                    WHERE u.id = :student_id";
            $this->studentData = $this->db->selectOne($sql, ['student_id' => $this->studentId]);
        }
        return $this->studentData;
    }
    
    /**
     * Get job data
     * @return array|null
     */
    public function getJob() {
        if (!$this->jobData && $this->jobId) {
            $sql = "SELECT j.*, u.company_name, u.first_name, u.last_name, jc.name as category_name
                    FROM jobs j
                    JOIN users u ON j.publisher_id = u.id
                    LEFT JOIN job_categories jc ON j.category_id = jc.id
                    WHERE j.id = :job_id";
            $this->jobData = $this->db->selectOne($sql, ['job_id' => $this->jobId]);
        }
        return $this->jobData;
    }
    
    /**
     * Get wishlist item details with related data
     * @return array
     */
    public function getFullDetails() {
        $wishlistData = $this->toArray();
        $wishlistData['student'] = $this->getStudent();
        $wishlistData['job'] = $this->getJob();
        
        return $wishlistData;
    }
    
    /**
     * Get wishlist statistics for a student
     * @param int $studentId
     * @return array
     */
    public static function getStudentStats($studentId) {
        $db = Database::getInstance();
        
        try {
            $stats = [];
            
            $stats['total'] = $db->count('wishlist', ['student_id' => $studentId]);
            
            // Count by job status
            $sql = "SELECT j.status, COUNT(w.id) as count
                    FROM wishlist w
                    JOIN jobs j ON w.job_id = j.id
                    WHERE w.student_id = :student_id
                    GROUP BY j.status";
            $results = $db->select($sql, ['student_id' => $studentId]);
            
            $stats['by_status'] = [];
            foreach ($results as $row) {
                $stats['by_status'][$row['status']] = $row['count'];
            }
            
            // Count by category
            $sql = "SELECT jc.name as category, COUNT(w.id) as count
                    FROM wishlist w
                    JOIN jobs j ON w.job_id = j.id
                    LEFT JOIN job_categories jc ON j.category_id = jc.id
                    WHERE w.student_id = :student_id
                    GROUP BY j.category_id, jc.name
                    ORDER BY count DESC
                    LIMIT 5";
            $results = $db->select($sql, ['student_id' => $studentId]);
            
            $stats['by_category'] = $results;
            
            return $stats;
        } catch (Exception $e) {
            error_log("Wishlist stats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get most wishlisted jobs
     * @param int $limit
     * @return array
     */
    public static function getMostWishlistedJobs($limit = 10) {
        $db = Database::getInstance();
        
        try {
            $sql = "SELECT j.*, u.company_name, COUNT(w.id) as wishlist_count
                    FROM jobs j
                    LEFT JOIN wishlist w ON j.id = w.job_id
                    JOIN users u ON j.publisher_id = u.id
                    WHERE j.status = 'active'
                    GROUP BY j.id
                    ORDER BY wishlist_count DESC, j.created_at DESC
                    LIMIT :limit";
            
            return $db->select($sql, ['limit' => $limit]);
        } catch (Exception $e) {
            error_log("Most wishlisted jobs error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Clean up wishlist - remove items for inactive jobs
     * @return int Number of items removed
     */
    public static function cleanup() {
        $db = Database::getInstance();
        
        try {
            // First get the IDs to be deleted
            $sql = "SELECT w.id FROM wishlist w 
                    JOIN jobs j ON w.job_id = j.id 
                    WHERE j.status != 'active'";
            $itemsToDelete = $db->select($sql);
            
            if (empty($itemsToDelete)) {
                return 0;
            }
            
            // Delete the items
            $ids = array_column($itemsToDelete, 'id');
            $placeholders = str_repeat('?,', count($ids) - 1) . '?';
            $deleteSql = "DELETE FROM wishlist WHERE id IN ({$placeholders})";
            
            $stmt = $db->getConnection()->prepare($deleteSql);
            $stmt->execute($ids);
            
            return $stmt->rowCount();
        } catch (Exception $e) {
            error_log("Wishlist cleanup error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Get wishlist items that match student preferences
     * @param int $studentId
     * @return array
     */
    public static function getRecommendedFromWishlist($studentId) {
        $db = Database::getInstance();
        
        try {
            // Get student's wishlist categories and job types
            $sql = "SELECT j.category_id, j.job_type, COUNT(*) as frequency
                    FROM wishlist w
                    JOIN jobs j ON w.job_id = j.id
                    WHERE w.student_id = :student_id
                    GROUP BY j.category_id, j.job_type
                    ORDER BY frequency DESC";
            
            $preferences = $db->select($sql, ['student_id' => $studentId]);
            
            if (empty($preferences)) {
                return [];
            }
            
            // Find similar jobs not in wishlist
            $categoryIds = array_column($preferences, 'category_id');
            $jobTypes = array_column($preferences, 'job_type');
            
            $placeholders = str_repeat('?,', count($categoryIds) - 1) . '?';
            $typePlaceholders = str_repeat('?,', count($jobTypes) - 1) . '?';
            
            $sql = "SELECT DISTINCT j.*, u.company_name
                    FROM jobs j
                    JOIN users u ON j.publisher_id = u.id
                    WHERE j.status = 'active'
                    AND (j.category_id IN ({$placeholders}) OR j.job_type IN ({$typePlaceholders}))
                    AND j.id NOT IN (
                        SELECT job_id FROM wishlist WHERE student_id = ?
                    )
                    ORDER BY j.created_at DESC
                    LIMIT 10";
            
            $params = array_merge($categoryIds, $jobTypes, [$studentId]);
            return $db->select($sql, $params);
        } catch (Exception $e) {
            error_log("Wishlist recommendations error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Validate wishlist data
     * @param array $data
     * @return array Array of validation errors
     */
    public static function validate($data) {
        $errors = [];
        
        if (empty($data['student_id'])) {
            $errors[] = "Student ID is required";
        }
        
        if (empty($data['job_id'])) {
            $errors[] = "Job ID is required";
        }
        
        return $errors;
    }
    
    /**
     * Convert wishlist item to array
     * @return array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'student_id' => $this->studentId,
            'job_id' => $this->jobId,
            'created_at' => $this->createdAt
        ];
    }
    
    // Getters
    public function getId() { return $this->id; }
    public function getStudentId() { return $this->studentId; }
    public function getJobId() { return $this->jobId; }
    public function getCreatedAt() { return $this->createdAt; }
    
    // Setters
    public function setStudentId($studentId) { $this->studentId = $studentId; }
    public function setJobId($jobId) { $this->jobId = $jobId; }
}
?>