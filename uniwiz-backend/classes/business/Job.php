<?php
/**
 * FILE: uniwiz-backend/classes/business/Job.php
 * ==============================================================================
 * Job class represents job postings with complete job lifecycle management
 */

require_once __DIR__ . '/../core/Database.php';

class Job {
    protected $id;
    protected $publisherId;
    protected $title;
    protected $description;
    protected $categoryId;
    protected $jobType;
    protected $paymentRange;
    protected $location;
    protected $requirements;
    protected $benefits;
    protected $deadline;
    protected $startDate;
    protected $vacancies;
    protected $status;
    protected $createdAt;
    protected $updatedAt;
    
    protected $db;
    protected $data = [];
    
    /**
     * Constructor
     * @param array $data Job data from database
     */
    public function __construct($data = []) {
        $this->db = Database::getInstance();
        
        if (!empty($data)) {
            $this->loadFromArray($data);
        }
    }
    
    /**
     * Load job data from array
     * @param array $data
     */
    protected function loadFromArray($data) {
        $this->data = $data;
        $this->id = $data['id'] ?? null;
        $this->publisherId = $data['publisher_id'] ?? null;
        $this->title = $data['title'] ?? null;
        $this->description = $data['description'] ?? null;
        $this->categoryId = $data['category_id'] ?? null;
        $this->jobType = $data['job_type'] ?? null;
        $this->paymentRange = $data['payment_range'] ?? null;
        $this->location = $data['location'] ?? null;
        $this->requirements = $data['requirements'] ?? null;
        $this->benefits = $data['benefits'] ?? null;
        $this->deadline = $data['deadline'] ?? null;
        $this->startDate = $data['start_date'] ?? null;
        $this->vacancies = $data['vacancies'] ?? 1;
        $this->status = $data['status'] ?? 'active';
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
    }
    
    /**
     * Find job by ID
     * @param int $id
     * @return Job|null
     */
    public static function findById($id) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM jobs WHERE id = :id";
        $data = $db->selectOne($sql, ['id' => $id]);
        
        if ($data) {
            return new self($data);
        }
        
        return null;
    }
    
    /**
     * Get all jobs with filters
     * @param array $filters
     * @return array
     */
    public static function getAll($filters = []) {
        $db = Database::getInstance();
        
        $sql = "SELECT j.*, u.company_name, u.first_name, u.last_name, u.profile_image_url,
                       jc.name as category_name,
                       (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as application_count,
                       (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted') as accepted_count
                FROM jobs j
                JOIN users u ON j.publisher_id = u.id
                LEFT JOIN job_categories jc ON j.category_id = jc.id
                WHERE 1=1";
        
        $params = [];
        
        if (isset($filters['publisher_id'])) {
            $sql .= " AND j.publisher_id = :publisher_id";
            $params['publisher_id'] = $filters['publisher_id'];
        }
        
        if (isset($filters['status'])) {
            $sql .= " AND j.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (isset($filters['category_id'])) {
            $sql .= " AND j.category_id = :category_id";
            $params['category_id'] = $filters['category_id'];
        }
        
        if (isset($filters['job_type'])) {
            $sql .= " AND j.job_type = :job_type";
            $params['job_type'] = $filters['job_type'];
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
        
        $results = $db->select($sql, $params);
        $jobs = [];
        
        foreach ($results as $data) {
            $jobs[] = new self($data);
        }
        
        return $jobs;
    }
    
    /**
     * Save job to database
     * @return bool
     */
    public function save() {
        try {
            $data = [
                'publisher_id' => $this->publisherId,
                'title' => $this->title,
                'description' => $this->description,
                'category_id' => $this->categoryId,
                'job_type' => $this->jobType,
                'payment_range' => $this->paymentRange,
                'location' => $this->location,
                'requirements' => $this->requirements,
                'benefits' => $this->benefits,
                'deadline' => $this->deadline,
                'start_date' => $this->startDate,
                'vacancies' => $this->vacancies,
                'status' => $this->status,
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            if ($this->id) {
                // Update existing job
                $this->db->update('jobs', $data, ['id' => $this->id]);
            } else {
                // Insert new job
                $data['created_at'] = date('Y-m-d H:i:s');
                $this->id = $this->db->insert('jobs', $data);
                $this->createdAt = $data['created_at'];
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Job save error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete job
     * @return bool
     */
    public function delete() {
        try {
            if ($this->id) {
                // Delete related applications first
                $this->db->delete('job_applications', ['job_id' => $this->id]);
                
                // Delete job
                $this->db->delete('jobs', ['id' => $this->id]);
                return true;
            }
            return false;
        } catch (Exception $e) {
            error_log("Job delete error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if job is active
     * @return bool
     */
    public function isActive() {
        return $this->status === 'active';
    }
    
    /**
     * Check if job is expired
     * @return bool
     */
    public function isExpired() {
        if ($this->deadline) {
            return strtotime($this->deadline) < time();
        }
        return false;
    }
    
    /**
     * Check if job has available positions
     * @return bool
     */
    public function hasAvailablePositions() {
        $acceptedCount = $this->getAcceptedApplicationsCount();
        return $acceptedCount < $this->vacancies;
    }
    
    /**
     * Get applications for this job
     * @param array $filters
     * @return array
     */
    public function getApplications($filters = []) {
        $sql = "SELECT ja.*, u.first_name, u.last_name, u.email, u.profile_image_url,
                       sp.university_name, sp.field_of_study, sp.year_of_study, sp.cv_url
                FROM job_applications ja
                JOIN users u ON ja.student_id = u.id
                LEFT JOIN student_profiles sp ON u.id = sp.user_id
                WHERE ja.job_id = :job_id";
        
        $params = ['job_id' => $this->id];
        
        if (isset($filters['status'])) {
            $sql .= " AND ja.status = :status";
            $params['status'] = $filters['status'];
        }
        
        $sql .= " ORDER BY ja.applied_at DESC";
        
        return $this->db->select($sql, $params);
    }
    
    /**
     * Get applications count
     * @return int
     */
    public function getApplicationsCount() {
        return $this->db->count('job_applications', ['job_id' => $this->id]);
    }
    
    /**
     * Get accepted applications count
     * @return int
     */
    public function getAcceptedApplicationsCount() {
        return $this->db->count('job_applications', [
            'job_id' => $this->id,
            'status' => 'accepted'
        ]);
    }
    
    /**
     * Get pending applications count
     * @return int
     */
    public function getPendingApplicationsCount() {
        return $this->db->count('job_applications', [
            'job_id' => $this->id,
            'status' => 'pending'
        ]);
    }
    
    /**
     * Check if student has applied to this job
     * @param int $studentId
     * @return bool
     */
    public function hasStudentApplied($studentId) {
        return $this->db->exists('job_applications', [
            'job_id' => $this->id,
            'student_id' => $studentId
        ]);
    }
    
    /**
     * Get student's application status for this job
     * @param int $studentId
     * @return string|null
     */
    public function getStudentApplicationStatus($studentId) {
        $sql = "SELECT status FROM job_applications WHERE job_id = :job_id AND student_id = :student_id";
        $result = $this->db->selectOne($sql, [
            'job_id' => $this->id,
            'student_id' => $studentId
        ]);
        
        return $result ? $result['status'] : null;
    }
    
    /**
     * Extend job deadline
     * @param string $newDeadline
     * @return bool
     */
    public function extendDeadline($newDeadline) {
        try {
            $this->deadline = $newDeadline;
            $this->db->update('jobs', 
                ['deadline' => $newDeadline, 'updated_at' => date('Y-m-d H:i:s')], 
                ['id' => $this->id]
            );
            return true;
        } catch (Exception $e) {
            error_log("Extend deadline error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update job status
     * @param string $status
     * @return bool
     */
    public function updateStatus($status) {
        try {
            $allowedStatuses = ['active', 'inactive', 'pending', 'expired'];
            if (!in_array($status, $allowedStatuses)) {
                return false;
            }
            
            $this->status = $status;
            $this->db->update('jobs', 
                ['status' => $status, 'updated_at' => date('Y-m-d H:i:s')], 
                ['id' => $this->id]
            );
            return true;
        } catch (Exception $e) {
            error_log("Update job status error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get job publisher
     * @return array|null
     */
    public function getPublisher() {
        if ($this->publisherId) {
            $sql = "SELECT u.*, pp.* FROM users u 
                    LEFT JOIN publisher_profiles pp ON u.id = pp.user_id
                    WHERE u.id = :publisher_id";
            return $this->db->selectOne($sql, ['publisher_id' => $this->publisherId]);
        }
        return null;
    }
    
    /**
     * Get job category
     * @return array|null
     */
    public function getCategory() {
        if ($this->categoryId) {
            $sql = "SELECT * FROM job_categories WHERE id = :category_id";
            return $this->db->selectOne($sql, ['category_id' => $this->categoryId]);
        }
        return null;
    }
    
    /**
     * Validate job data
     * @param array $data
     * @return array Array of validation errors
     */
    public static function validate($data) {
        $errors = [];
        
        if (empty($data['title'])) {
            $errors[] = "Title is required";
        }
        
        if (empty($data['description'])) {
            $errors[] = "Description is required";
        }
        
        if (empty($data['category_id'])) {
            $errors[] = "Category is required";
        }
        
        if (empty($data['job_type'])) {
            $errors[] = "Job type is required";
        }
        
        if (empty($data['payment_range'])) {
            $errors[] = "Payment range is required";
        }
        
        if (isset($data['deadline']) && !empty($data['deadline'])) {
            if (strtotime($data['deadline']) < time()) {
                $errors[] = "Deadline must be in the future";
            }
        }
        
        if (isset($data['vacancies']) && (!is_numeric($data['vacancies']) || $data['vacancies'] < 1)) {
            $errors[] = "Vacancies must be a positive number";
        }
        
        return $errors;
    }
    
    /**
     * Get full job details with related data
     * @return array
     */
    public function getFullDetails() {
        $jobData = $this->toArray();
        $jobData['publisher'] = $this->getPublisher();
        $jobData['category'] = $this->getCategory();
        $jobData['applications_count'] = $this->getApplicationsCount();
        $jobData['accepted_count'] = $this->getAcceptedApplicationsCount();
        $jobData['pending_count'] = $this->getPendingApplicationsCount();
        $jobData['has_available_positions'] = $this->hasAvailablePositions();
        $jobData['is_expired'] = $this->isExpired();
        
        return $jobData;
    }
    
    /**
     * Convert job to array
     * @return array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'publisher_id' => $this->publisherId,
            'title' => $this->title,
            'description' => $this->description,
            'category_id' => $this->categoryId,
            'job_type' => $this->jobType,
            'payment_range' => $this->paymentRange,
            'location' => $this->location,
            'requirements' => $this->requirements,
            'benefits' => $this->benefits,
            'deadline' => $this->deadline,
            'start_date' => $this->startDate,
            'vacancies' => $this->vacancies,
            'status' => $this->status,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt
        ];
    }
    
    // Getters
    public function getId() { return $this->id; }
    public function getPublisherId() { return $this->publisherId; }
    public function getTitle() { return $this->title; }
    public function getDescription() { return $this->description; }
    public function getCategoryId() { return $this->categoryId; }
    public function getJobType() { return $this->jobType; }
    public function getPaymentRange() { return $this->paymentRange; }
    public function getLocation() { return $this->location; }
    public function getRequirements() { return $this->requirements; }
    public function getBenefits() { return $this->benefits; }
    public function getDeadline() { return $this->deadline; }
    public function getStartDate() { return $this->startDate; }
    public function getVacancies() { return $this->vacancies; }
    public function getStatus() { return $this->status; }
    public function getCreatedAt() { return $this->createdAt; }
    public function getUpdatedAt() { return $this->updatedAt; }
    
    // Setters
    public function setPublisherId($publisherId) { $this->publisherId = $publisherId; }
    public function setTitle($title) { $this->title = $title; }
    public function setDescription($description) { $this->description = $description; }
    public function setCategoryId($categoryId) { $this->categoryId = $categoryId; }
    public function setJobType($jobType) { $this->jobType = $jobType; }
    public function setPaymentRange($paymentRange) { $this->paymentRange = $paymentRange; }
    public function setLocation($location) { $this->location = $location; }
    public function setRequirements($requirements) { $this->requirements = $requirements; }
    public function setBenefits($benefits) { $this->benefits = $benefits; }
    public function setDeadline($deadline) { $this->deadline = $deadline; }
    public function setStartDate($startDate) { $this->startDate = $startDate; }
    public function setVacancies($vacancies) { $this->vacancies = $vacancies; }
    public function setStatus($status) { $this->status = $status; }
}
?>