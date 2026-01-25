<?php
/**
 * FILE: uniwiz-backend/classes/business/JobCategory.php
 * ==============================================================================
 * JobCategory class represents job categories with category management functionality
 */

require_once __DIR__ . '/../core/Database.php';

class JobCategory {
    protected $id;
    protected $name;
    protected $description;
    protected $isActive;
    protected $createdAt;
    protected $updatedAt;
    
    protected $db;
    
    /**
     * Constructor
     * @param array $data Category data from database
     */
    public function __construct($data = []) {
        $this->db = Database::getInstance();
        
        if (!empty($data)) {
            $this->loadFromArray($data);
        }
    }
    
    /**
     * Load category data from array
     * @param array $data
     */
    protected function loadFromArray($data) {
        $this->id = $data['id'] ?? null;
        $this->name = $data['name'] ?? null;
        $this->description = $data['description'] ?? null;
        $this->isActive = $data['is_active'] ?? true;
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
    }
    
    /**
     * Find category by ID
     * @param int $id
     * @return JobCategory|null
     */
    public static function findById($id) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM job_categories WHERE id = :id";
        $data = $db->selectOne($sql, ['id' => $id]);
        
        if ($data) {
            return new self($data);
        }
        
        return null;
    }
    
    /**
     * Find category by name
     * @param string $name
     * @return JobCategory|null
     */
    public static function findByName($name) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM job_categories WHERE name = :name";
        $data = $db->selectOne($sql, ['name' => $name]);
        
        if ($data) {
            return new self($data);
        }
        
        return null;
    }
    
    /**
     * Get all categories
     * @param bool $activeOnly
     * @return array
     */
    public static function getAll($activeOnly = false) {
        $db = Database::getInstance();
        
        $sql = "SELECT jc.*, 
                       (SELECT COUNT(*) FROM jobs j WHERE j.category_id = jc.id) as total_jobs,
                       (SELECT COUNT(*) FROM jobs j WHERE j.category_id = jc.id AND j.status = 'active') as active_jobs
                FROM job_categories jc
                WHERE 1=1";
        
        $params = [];
        
        if ($activeOnly) {
            $sql .= " AND jc.is_active = 1";
        }
        
        $sql .= " ORDER BY jc.name ASC";
        
        $results = $db->select($sql, $params);
        $categories = [];
        
        foreach ($results as $data) {
            $categories[] = new self($data);
        }
        
        return $categories;
    }
    
    /**
     * Get categories with job counts
     * @param bool $activeOnly
     * @return array
     */
    public static function getWithJobCounts($activeOnly = false) {
        $db = Database::getInstance();
        
        $sql = "SELECT jc.*, 
                       COUNT(j.id) as total_jobs,
                       SUM(CASE WHEN j.status = 'active' THEN 1 ELSE 0 END) as active_jobs
                FROM job_categories jc
                LEFT JOIN jobs j ON jc.id = j.category_id
                WHERE 1=1";
        
        if ($activeOnly) {
            $sql .= " AND jc.is_active = 1";
        }
        
        $sql .= " GROUP BY jc.id ORDER BY jc.name ASC";
        
        $results = $db->select($sql);
        $categories = [];
        
        foreach ($results as $data) {
            $category = new self($data);
            $category->totalJobs = $data['total_jobs'];
            $category->activeJobs = $data['active_jobs'];
            $categories[] = $category;
        }
        
        return $categories;
    }
    
    /**
     * Save category to database
     * @return bool
     */
    public function save() {
        try {
            $data = [
                'name' => $this->name,
                'description' => $this->description,
                'is_active' => $this->isActive ? 1 : 0,
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            if ($this->id) {
                // Update existing category
                $this->db->update('job_categories', $data, ['id' => $this->id]);
            } else {
                // Insert new category
                $data['created_at'] = date('Y-m-d H:i:s');
                $this->id = $this->db->insert('job_categories', $data);
                $this->createdAt = $data['created_at'];
            }
            
            return true;
        } catch (Exception $e) {
            error_log("JobCategory save error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete category
     * @return bool|string
     */
    public function delete() {
        try {
            if ($this->id) {
                // Check if category has jobs
                $jobCount = $this->db->count('jobs', ['category_id' => $this->id]);
                
                if ($jobCount > 0) {
                    return "Cannot delete category that has jobs associated with it";
                }
                
                $this->db->delete('job_categories', ['id' => $this->id]);
                return true;
            }
            return false;
        } catch (Exception $e) {
            error_log("JobCategory delete error: " . $e->getMessage());
            return "An error occurred while deleting the category";
        }
    }
    
    /**
     * Activate/Deactivate category
     * @param bool $active
     * @return bool
     */
    public function setActive($active = true) {
        try {
            $this->isActive = $active;
            $this->db->update('job_categories', 
                ['is_active' => $active ? 1 : 0, 'updated_at' => date('Y-m-d H:i:s')], 
                ['id' => $this->id]
            );
            return true;
        } catch (Exception $e) {
            error_log("JobCategory setActive error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get jobs in this category
     * @param array $filters
     * @return array
     */
    public function getJobs($filters = []) {
        $sql = "SELECT j.*, u.company_name, u.first_name, u.last_name, u.profile_image_url,
                       (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as application_count
                FROM jobs j
                JOIN users u ON j.publisher_id = u.id
                WHERE j.category_id = :category_id";
        
        $params = ['category_id' => $this->id];
        
        if (isset($filters['status'])) {
            $sql .= " AND j.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (isset($filters['job_type'])) {
            $sql .= " AND j.job_type = :job_type";
            $params['job_type'] = $filters['job_type'];
        }
        
        $sql .= " ORDER BY j.created_at DESC";
        
        if (isset($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = $filters['limit'];
        }
        
        return $this->db->select($sql, $params);
    }
    
    /**
     * Get total jobs count in this category
     * @return int
     */
    public function getTotalJobsCount() {
        return $this->db->count('jobs', ['category_id' => $this->id]);
    }
    
    /**
     * Get active jobs count in this category
     * @return int
     */
    public function getActiveJobsCount() {
        return $this->db->count('jobs', [
            'category_id' => $this->id,
            'status' => 'active'
        ]);
    }
    
    /**
     * Get category statistics
     * @return array
     */
    public function getStatistics() {
        try {
            $stats = [];
            
            $stats['total_jobs'] = $this->getTotalJobsCount();
            $stats['active_jobs'] = $this->getActiveJobsCount();
            $stats['inactive_jobs'] = $stats['total_jobs'] - $stats['active_jobs'];
            
            // Total applications in this category
            $sql = "SELECT COUNT(ja.id) as count 
                    FROM job_applications ja 
                    JOIN jobs j ON ja.job_id = j.id 
                    WHERE j.category_id = :category_id";
            $result = $this->db->selectOne($sql, ['category_id' => $this->id]);
            $stats['total_applications'] = $result['count'] ?? 0;
            
            // Average payment range (if numeric)
            $sql = "SELECT AVG(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(j.payment_range, '-', 1), ' ', -1) AS UNSIGNED)) as avg_min_payment,
                           AVG(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(j.payment_range, '-', -1), ' ', 1) AS UNSIGNED)) as avg_max_payment
                    FROM jobs j 
                    WHERE j.category_id = :category_id 
                    AND j.payment_range REGEXP '^[0-9]+'";
            $paymentResult = $this->db->selectOne($sql, ['category_id' => $this->id]);
            $stats['avg_min_payment'] = $paymentResult['avg_min_payment'] ?? 0;
            $stats['avg_max_payment'] = $paymentResult['avg_max_payment'] ?? 0;
            
            return $stats;
        } catch (Exception $e) {
            error_log("JobCategory statistics error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Validate category data
     * @param array $data
     * @return array Array of validation errors
     */
    public static function validate($data) {
        $errors = [];
        
        if (empty($data['name'])) {
            $errors[] = "Category name is required";
        } elseif (strlen($data['name']) < 2) {
            $errors[] = "Category name must be at least 2 characters long";
        } elseif (strlen($data['name']) > 100) {
            $errors[] = "Category name must be less than 100 characters";
        }
        
        if (isset($data['description']) && strlen($data['description']) > 500) {
            $errors[] = "Description must be less than 500 characters";
        }
        
        return $errors;
    }
    
    /**
     * Check if category name exists (for creating new categories)
     * @param string $name
     * @param int $excludeId
     * @return bool
     */
    public static function nameExists($name, $excludeId = null) {
        $db = Database::getInstance();
        
        $sql = "SELECT id FROM job_categories WHERE name = :name";
        $params = ['name' => $name];
        
        if ($excludeId) {
            $sql .= " AND id != :exclude_id";
            $params['exclude_id'] = $excludeId;
        }
        
        $result = $db->selectOne($sql, $params);
        return $result !== false;
    }
    
    /**
     * Get popular categories (by job count)
     * @param int $limit
     * @return array
     */
    public static function getPopular($limit = 5) {
        $db = Database::getInstance();
        
        $sql = "SELECT jc.*, COUNT(j.id) as job_count
                FROM job_categories jc
                LEFT JOIN jobs j ON jc.id = j.category_id AND j.status = 'active'
                WHERE jc.is_active = 1
                GROUP BY jc.id
                ORDER BY job_count DESC, jc.name ASC
                LIMIT :limit";
        
        $results = $db->select($sql, ['limit' => $limit]);
        $categories = [];
        
        foreach ($results as $data) {
            $category = new self($data);
            $category->jobCount = $data['job_count'];
            $categories[] = $category;
        }
        
        return $categories;
    }
    
    /**
     * Convert category to array
     * @return array
     */
    public function toArray() {
        $data = [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'is_active' => $this->isActive,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt
        ];
        
        // Add job counts if available
        if (isset($this->totalJobs)) {
            $data['total_jobs'] = $this->totalJobs;
        }
        if (isset($this->activeJobs)) {
            $data['active_jobs'] = $this->activeJobs;
        }
        if (isset($this->jobCount)) {
            $data['job_count'] = $this->jobCount;
        }
        
        return $data;
    }
    
    // Getters
    public function getId() { return $this->id; }
    public function getName() { return $this->name; }
    public function getDescription() { return $this->description; }
    public function getIsActive() { return $this->isActive; }
    public function getCreatedAt() { return $this->createdAt; }
    public function getUpdatedAt() { return $this->updatedAt; }
    
    // Setters
    public function setName($name) { $this->name = $name; }
    public function setDescription($description) { $this->description = $description; }
    public function setIsActive($isActive) { $this->isActive = $isActive; }
}
?>