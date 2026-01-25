<?php
/**
 * FILE: uniwiz-backend/classes/business/Application.php
 * ==============================================================================
 * Application class represents job applications with application management functionality
 */

require_once __DIR__ . '/../core/Database.php';

class Application {
    protected $id;
    protected $studentId;
    protected $jobId;
    protected $proposal;
    protected $status;
    protected $appliedAt;
    protected $updatedAt;
    
    protected $db;
    protected $studentData;
    protected $jobData;
    
    /**
     * Constructor
     * @param array $data Application data from database
     */
    public function __construct($data = []) {
        $this->db = Database::getInstance();
        
        if (!empty($data)) {
            $this->loadFromArray($data);
        }
    }
    
    /**
     * Load application data from array
     * @param array $data
     */
    protected function loadFromArray($data) {
        $this->id = $data['id'] ?? null;
        $this->studentId = $data['student_id'] ?? null;
        $this->jobId = $data['job_id'] ?? null;
        $this->proposal = $data['proposal'] ?? null;
        $this->status = $data['status'] ?? 'pending';
        $this->appliedAt = $data['applied_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
    }
    
    /**
     * Find application by ID
     * @param int $id
     * @return Application|null
     */
    public static function findById($id) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM job_applications WHERE id = :id";
        $data = $db->selectOne($sql, ['id' => $id]);
        
        if ($data) {
            return new self($data);
        }
        
        return null;
    }
    
    /**
     * Find application by student and job
     * @param int $studentId
     * @param int $jobId
     * @return Application|null
     */
    public static function findByStudentAndJob($studentId, $jobId) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM job_applications WHERE student_id = :student_id AND job_id = :job_id";
        $data = $db->selectOne($sql, ['student_id' => $studentId, 'job_id' => $jobId]);
        
        if ($data) {
            return new self($data);
        }
        
        return null;
    }
    
    /**
     * Get all applications with filters
     * @param array $filters
     * @return array
     */
    public static function getAll($filters = []) {
        $db = Database::getInstance();
        
        $sql = "SELECT ja.*, 
                       u.first_name, u.last_name, u.email, u.profile_image_url,
                       sp.university_name, sp.field_of_study, sp.year_of_study, sp.cv_url,
                       j.title as job_title, j.payment_range, j.job_type, j.publisher_id,
                       pub.company_name, pub.first_name as pub_first_name, pub.last_name as pub_last_name
                FROM job_applications ja
                JOIN users u ON ja.student_id = u.id
                LEFT JOIN student_profiles sp ON u.id = sp.user_id
                JOIN jobs j ON ja.job_id = j.id
                JOIN users pub ON j.publisher_id = pub.id
                WHERE 1=1";
        
        $params = [];
        
        if (isset($filters['student_id'])) {
            $sql .= " AND ja.student_id = :student_id";
            $params['student_id'] = $filters['student_id'];
        }
        
        if (isset($filters['job_id'])) {
            $sql .= " AND ja.job_id = :job_id";
            $params['job_id'] = $filters['job_id'];
        }
        
        if (isset($filters['publisher_id'])) {
            $sql .= " AND j.publisher_id = :publisher_id";
            $params['publisher_id'] = $filters['publisher_id'];
        }
        
        if (isset($filters['status'])) {
            $sql .= " AND ja.status = :status";
            $params['status'] = $filters['status'];
        }
        
        $sql .= " ORDER BY ja.applied_at DESC";
        
        if (isset($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = $filters['limit'];
        }
        
        $results = $db->select($sql, $params);
        $applications = [];
        
        foreach ($results as $data) {
            $applications[] = new self($data);
        }
        
        return $applications;
    }
    
    /**
     * Create new application
     * @param int $studentId
     * @param int $jobId
     * @param string $proposal
     * @return Application|string
     */
    public static function create($studentId, $jobId, $proposal = '') {
        $db = Database::getInstance();
        
        try {
            // Check if application already exists
            if (self::findByStudentAndJob($studentId, $jobId)) {
                return "You have already applied to this job";
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
            
            $applicationData = [
                'student_id' => $studentId,
                'job_id' => $jobId,
                'proposal' => $proposal,
                'status' => 'pending',
                'applied_at' => date('Y-m-d H:i:s')
            ];
            
            $applicationId = $db->insert('job_applications', $applicationData);
            $applicationData['id'] = $applicationId;
            
            $application = new self($applicationData);
            
            // Create notification for publisher
            $application->createNotificationForPublisher('new_application',
                "New application received for " . $job['title']
            );
            
            return $application;
        } catch (Exception $e) {
            error_log("Application creation error: " . $e->getMessage());
            return "An error occurred while creating the application";
        }
    }
    
    /**
     * Save application to database
     * @return bool
     */
    public function save() {
        try {
            $data = [
                'student_id' => $this->studentId,
                'job_id' => $this->jobId,
                'proposal' => $this->proposal,
                'status' => $this->status,
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            if ($this->id) {
                // Update existing application
                $this->db->update('job_applications', $data, ['id' => $this->id]);
            } else {
                // Insert new application
                $data['applied_at'] = date('Y-m-d H:i:s');
                $this->id = $this->db->insert('job_applications', $data);
                $this->appliedAt = $data['applied_at'];
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Application save error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete application
     * @return bool
     */
    public function delete() {
        try {
            if ($this->id) {
                $this->db->delete('job_applications', ['id' => $this->id]);
                return true;
            }
            return false;
        } catch (Exception $e) {
            error_log("Application delete error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update application status
     * @param string $status
     * @param int $updatedBy Optional user ID who updated the status
     * @return bool|string
     */
    public function updateStatus($status, $updatedBy = null) {
        try {
            $allowedStatuses = ['pending', 'viewed', 'accepted', 'rejected'];
            if (!in_array($status, $allowedStatuses)) {
                return "Invalid status";
            }
            
            $oldStatus = $this->status;
            $this->status = $status;
            
            $this->db->update('job_applications', [
                'status' => $status,
                'updated_at' => date('Y-m-d H:i:s')
            ], ['id' => $this->id]);
            
            // Create notification for student if status changed
            if ($oldStatus !== $status) {
                $this->createNotificationForStudent($status);
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Application status update error: " . $e->getMessage());
            return "An error occurred while updating the application status";
        }
    }
    
    /**
     * Accept application
     * @return bool|string
     */
    public function accept() {
        return $this->updateStatus('accepted');
    }
    
    /**
     * Reject application
     * @return bool|string
     */
    public function reject() {
        return $this->updateStatus('rejected');
    }
    
    /**
     * Mark as viewed
     * @return bool|string
     */
    public function markAsViewed() {
        return $this->updateStatus('viewed');
    }
    
    /**
     * Check if application is pending
     * @return bool
     */
    public function isPending() {
        return $this->status === 'pending';
    }
    
    /**
     * Check if application is accepted
     * @return bool
     */
    public function isAccepted() {
        return $this->status === 'accepted';
    }
    
    /**
     * Check if application is rejected
     * @return bool
     */
    public function isRejected() {
        return $this->status === 'rejected';
    }
    
    /**
     * Check if application has been viewed
     * @return bool
     */
    public function isViewed() {
        return $this->status === 'viewed';
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
     * Get publisher data
     * @return array|null
     */
    public function getPublisher() {
        $job = $this->getJob();
        if ($job && $job['publisher_id']) {
            $sql = "SELECT u.*, pp.* FROM users u 
                    LEFT JOIN publisher_profiles pp ON u.id = pp.user_id
                    WHERE u.id = :publisher_id";
            return $this->db->selectOne($sql, ['publisher_id' => $job['publisher_id']]);
        }
        return null;
    }
    
    /**
     * Get application details with related data
     * @return array
     */
    public function getFullDetails() {
        $applicationData = $this->toArray();
        $applicationData['student'] = $this->getStudent();
        $applicationData['job'] = $this->getJob();
        $applicationData['publisher'] = $this->getPublisher();
        
        return $applicationData;
    }
    
    /**
     * Get applications statistics for a student
     * @param int $studentId
     * @return array
     */
    public static function getStudentStats($studentId) {
        $db = Database::getInstance();
        
        try {
            $stats = [];
            
            $stats['total'] = $db->count('job_applications', ['student_id' => $studentId]);
            $stats['pending'] = $db->count('job_applications', ['student_id' => $studentId, 'status' => 'pending']);
            $stats['viewed'] = $db->count('job_applications', ['student_id' => $studentId, 'status' => 'viewed']);
            $stats['accepted'] = $db->count('job_applications', ['student_id' => $studentId, 'status' => 'accepted']);
            $stats['rejected'] = $db->count('job_applications', ['student_id' => $studentId, 'status' => 'rejected']);
            
            return $stats;
        } catch (Exception $e) {
            error_log("Student application stats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get applications statistics for a publisher
     * @param int $publisherId
     * @return array
     */
    public static function getPublisherStats($publisherId) {
        $db = Database::getInstance();
        
        try {
            $stats = [];
            
            $sql = "SELECT COUNT(ja.id) as count 
                    FROM job_applications ja 
                    JOIN jobs j ON ja.job_id = j.id 
                    WHERE j.publisher_id = :publisher_id";
            $result = $db->selectOne($sql, ['publisher_id' => $publisherId]);
            $stats['total'] = $result['count'] ?? 0;
            
            $sql .= " AND ja.status = :status";
            
            $statuses = ['pending', 'viewed', 'accepted', 'rejected'];
            foreach ($statuses as $status) {
                $result = $db->selectOne($sql, ['publisher_id' => $publisherId, 'status' => $status]);
                $stats[$status] = $result['count'] ?? 0;
            }
            
            return $stats;
        } catch (Exception $e) {
            error_log("Publisher application stats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Create notification for student
     * @param string $status
     */
    private function createNotificationForStudent($status) {
        try {
            $job = $this->getJob();
            if (!$job) return;
            
            $messages = [
                'viewed' => "Your application for {$job['title']} has been viewed",
                'accepted' => "Congratulations! Your application for {$job['title']} has been accepted",
                'rejected' => "Your application for {$job['title']} has been rejected"
            ];
            
            if (isset($messages[$status])) {
                $this->db->insert('notifications', [
                    'user_id' => $this->studentId,
                    'type' => 'application_status_updated',
                    'message' => $messages[$status],
                    'link' => '/applications',
                    'is_read' => 0,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            }
        } catch (Exception $e) {
            error_log("Student notification error: " . $e->getMessage());
        }
    }
    
    /**
     * Create notification for publisher
     * @param string $type
     * @param string $message
     */
    private function createNotificationForPublisher($type, $message) {
        try {
            $job = $this->getJob();
            if (!$job) return;
            
            $this->db->insert('notifications', [
                'user_id' => $job['publisher_id'],
                'type' => $type,
                'message' => $message,
                'link' => '/applicants',
                'is_read' => 0,
                'created_at' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            error_log("Publisher notification error: " . $e->getMessage());
        }
    }
    
    /**
     * Validate application data
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
        
        if (isset($data['proposal']) && strlen($data['proposal']) > 1000) {
            $errors[] = "Proposal must be less than 1000 characters";
        }
        
        return $errors;
    }
    
    /**
     * Convert application to array
     * @return array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'student_id' => $this->studentId,
            'job_id' => $this->jobId,
            'proposal' => $this->proposal,
            'status' => $this->status,
            'applied_at' => $this->appliedAt,
            'updated_at' => $this->updatedAt
        ];
    }
    
    // Getters
    public function getId() { return $this->id; }
    public function getStudentId() { return $this->studentId; }
    public function getJobId() { return $this->jobId; }
    public function getProposal() { return $this->proposal; }
    public function getStatus() { return $this->status; }
    public function getAppliedAt() { return $this->appliedAt; }
    public function getUpdatedAt() { return $this->updatedAt; }
    
    // Setters
    public function setStudentId($studentId) { $this->studentId = $studentId; }
    public function setJobId($jobId) { $this->jobId = $jobId; }
    public function setProposal($proposal) { $this->proposal = $proposal; }
    public function setStatus($status) { $this->status = $status; }
}
?>