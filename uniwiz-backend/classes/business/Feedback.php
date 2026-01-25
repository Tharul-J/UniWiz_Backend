<?php
/**
 * FILE: uniwiz-backend/classes/business/Feedback.php
 * ==============================================================================
 * Feedback class represents reviews and ratings given by students to publishers/companies
 */

require_once __DIR__ . '/../core/Database.php';

class Feedback {
    protected $id;
    protected $studentId;
    protected $publisherId;
    protected $jobId;
    protected $rating;
    protected $review;
    protected $isAnonymous;
    protected $status;
    protected $createdAt;
    protected $updatedAt;
    
    protected $db;
    protected $studentData;
    protected $publisherData;
    protected $jobData;
    
    /**
     * Constructor
     * @param array $data Feedback data from database
     */
    public function __construct($data = []) {
        $this->db = Database::getInstance();
        
        if (!empty($data)) {
            $this->loadFromArray($data);
        }
    }
    
    /**
     * Load feedback data from array
     * @param array $data
     */
    protected function loadFromArray($data) {
        $this->id = $data['id'] ?? null;
        $this->studentId = $data['student_id'] ?? null;
        $this->publisherId = $data['publisher_id'] ?? null;
        $this->jobId = $data['job_id'] ?? null;
        $this->rating = $data['rating'] ?? null;
        $this->review = $data['review'] ?? null;
        $this->isAnonymous = $data['is_anonymous'] ?? 0;
        $this->status = $data['status'] ?? 'active';
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
    }
    
    /**
     * Find feedback by ID
     * @param int $id
     * @return Feedback|null
     */
    public static function findById($id) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM company_reviews WHERE id = :id";
        $data = $db->selectOne($sql, ['id' => $id]);
        
        if ($data) {
            return new self($data);
        }
        
        return null;
    }
    
    /**
     * Find feedback by student, publisher and job
     * @param int $studentId
     * @param int $publisherId
     * @param int $jobId
     * @return Feedback|null
     */
    public static function findByStudentPublisherJob($studentId, $publisherId, $jobId = null) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM company_reviews WHERE student_id = :student_id AND publisher_id = :publisher_id";
        $params = ['student_id' => $studentId, 'publisher_id' => $publisherId];
        
        if ($jobId) {
            $sql .= " AND job_id = :job_id";
            $params['job_id'] = $jobId;
        }
        
        $data = $db->selectOne($sql, $params);
        
        if ($data) {
            return new self($data);
        }
        
        return null;
    }
    
    /**
     * Get all feedback with filters
     * @param array $filters
     * @return array
     */
    public static function getAll($filters = []) {
        $db = Database::getInstance();
        
        $sql = "SELECT cr.*, 
                       s.first_name as student_first_name, s.last_name as student_last_name,
                       s.profile_image_url as student_image,
                       p.company_name, p.first_name as pub_first_name, p.last_name as pub_last_name,
                       p.profile_image_url as pub_image,
                       j.title as job_title
                FROM company_reviews cr
                JOIN users s ON cr.student_id = s.id
                JOIN users p ON cr.publisher_id = p.id
                LEFT JOIN jobs j ON cr.job_id = j.id
                WHERE cr.status = 'active'";
        
        $params = [];
        
        if (isset($filters['student_id'])) {
            $sql .= " AND cr.student_id = :student_id";
            $params['student_id'] = $filters['student_id'];
        }
        
        if (isset($filters['publisher_id'])) {
            $sql .= " AND cr.publisher_id = :publisher_id";
            $params['publisher_id'] = $filters['publisher_id'];
        }
        
        if (isset($filters['job_id'])) {
            $sql .= " AND cr.job_id = :job_id";
            $params['job_id'] = $filters['job_id'];
        }
        
        if (isset($filters['rating'])) {
            $sql .= " AND cr.rating = :rating";
            $params['rating'] = $filters['rating'];
        }
        
        if (isset($filters['min_rating'])) {
            $sql .= " AND cr.rating >= :min_rating";
            $params['min_rating'] = $filters['min_rating'];
        }
        
        $sql .= " ORDER BY cr.created_at DESC";
        
        if (isset($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = $filters['limit'];
        }
        
        $results = $db->select($sql, $params);
        $feedbacks = [];
        
        foreach ($results as $data) {
            $feedbacks[] = new self($data);
        }
        
        return $feedbacks;
    }
    
    /**
     * Get feedback for a publisher
     * @param int $publisherId
     * @param array $options
     * @return array
     */
    public static function getByPublisher($publisherId, $options = []) {
        return self::getAll(array_merge(['publisher_id' => $publisherId], $options));
    }
    
    /**
     * Get feedback by a student
     * @param int $studentId
     * @param array $options
     * @return array
     */
    public static function getByStudent($studentId, $options = []) {
        return self::getAll(array_merge(['student_id' => $studentId], $options));
    }
    
    /**
     * Create new feedback
     * @param int $studentId
     * @param int $publisherId
     * @param int $rating
     * @param string $review
     * @param int $jobId
     * @param bool $isAnonymous
     * @return Feedback|string
     */
    public static function create($studentId, $publisherId, $rating, $review = '', $jobId = null, $isAnonymous = false) {
        $db = Database::getInstance();
        
        try {
            // Validate data
            $errors = self::validate([
                'student_id' => $studentId,
                'publisher_id' => $publisherId,
                'rating' => $rating,
                'review' => $review
            ]);
            
            if (!empty($errors)) {
                return implode(", ", $errors);
            }
            
            // Check if feedback already exists
            if (self::findByStudentPublisherJob($studentId, $publisherId, $jobId)) {
                return "You have already reviewed this company";
            }
            
            // Check if student has worked with this publisher
            if ($jobId) {
                $application = $db->selectOne(
                    "SELECT * FROM job_applications ja 
                     JOIN jobs j ON ja.job_id = j.id 
                     WHERE ja.student_id = :student_id 
                     AND j.publisher_id = :publisher_id 
                     AND ja.job_id = :job_id
                     AND ja.status = 'accepted'",
                    ['student_id' => $studentId, 'publisher_id' => $publisherId, 'job_id' => $jobId]
                );
                
                if (!$application) {
                    return "You can only review companies you have worked with";
                }
            }
            
            $feedbackData = [
                'student_id' => $studentId,
                'publisher_id' => $publisherId,
                'job_id' => $jobId,
                'rating' => $rating,
                'review' => $review,
                'is_anonymous' => $isAnonymous ? 1 : 0,
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $feedbackId = $db->insert('company_reviews', $feedbackData);
            $feedbackData['id'] = $feedbackId;
            
            $feedback = new self($feedbackData);
            
            // Create notification for publisher
            $feedback->createNotificationForPublisher();
            
            return $feedback;
        } catch (Exception $e) {
            error_log("Feedback creation error: " . $e->getMessage());
            return "An error occurred while creating the feedback";
        }
    }
    
    /**
     * Save feedback to database
     * @return bool
     */
    public function save() {
        try {
            $data = [
                'student_id' => $this->studentId,
                'publisher_id' => $this->publisherId,
                'job_id' => $this->jobId,
                'rating' => $this->rating,
                'review' => $this->review,
                'is_anonymous' => $this->isAnonymous,
                'status' => $this->status,
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            if ($this->id) {
                // Update existing feedback
                $this->db->update('company_reviews', $data, ['id' => $this->id]);
            } else {
                // Insert new feedback
                $data['created_at'] = date('Y-m-d H:i:s');
                $this->id = $this->db->insert('company_reviews', $data);
                $this->createdAt = $data['created_at'];
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Feedback save error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete feedback (soft delete by changing status)
     * @return bool
     */
    public function delete() {
        try {
            $this->status = 'deleted';
            return $this->save();
        } catch (Exception $e) {
            error_log("Feedback delete error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update feedback
     * @param int $rating
     * @param string $review
     * @param bool $isAnonymous
     * @return bool|string
     */
    public function update($rating, $review = '', $isAnonymous = false) {
        try {
            $errors = self::validate([
                'rating' => $rating,
                'review' => $review
            ]);
            
            if (!empty($errors)) {
                return implode(", ", $errors);
            }
            
            $this->rating = $rating;
            $this->review = $review;
            $this->isAnonymous = $isAnonymous;
            
            return $this->save();
        } catch (Exception $e) {
            error_log("Feedback update error: " . $e->getMessage());
            return "An error occurred while updating the feedback";
        }
    }
    
    /**
     * Hide/Show feedback
     * @param string $status
     * @return bool
     */
    public function updateStatus($status) {
        try {
            $allowedStatuses = ['active', 'hidden', 'deleted'];
            if (!in_array($status, $allowedStatuses)) {
                return false;
            }
            
            $this->status = $status;
            return $this->save();
        } catch (Exception $e) {
            error_log("Feedback status update error: " . $e->getMessage());
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
     * Get publisher data
     * @return array|null
     */
    public function getPublisher() {
        if (!$this->publisherData && $this->publisherId) {
            $sql = "SELECT u.*, pp.* FROM users u 
                    LEFT JOIN publisher_profiles pp ON u.id = pp.user_id
                    WHERE u.id = :publisher_id";
            $this->publisherData = $this->db->selectOne($sql, ['publisher_id' => $this->publisherId]);
        }
        return $this->publisherData;
    }
    
    /**
     * Get job data
     * @return array|null
     */
    public function getJob() {
        if (!$this->jobData && $this->jobId) {
            $sql = "SELECT j.*, jc.name as category_name
                    FROM jobs j
                    LEFT JOIN job_categories jc ON j.category_id = jc.id
                    WHERE j.id = :job_id";
            $this->jobData = $this->db->selectOne($sql, ['job_id' => $this->jobId]);
        }
        return $this->jobData;
    }
    
    /**
     * Get feedback details with related data
     * @return array
     */
    public function getFullDetails() {
        $feedbackData = $this->toArray();
        
        if (!$this->isAnonymous) {
            $feedbackData['student'] = $this->getStudent();
        }
        
        $feedbackData['publisher'] = $this->getPublisher();
        $feedbackData['job'] = $this->getJob();
        
        return $feedbackData;
    }
    
    /**
     * Get rating statistics for a publisher
     * @param int $publisherId
     * @return array
     */
    public static function getPublisherRatingStats($publisherId) {
        $db = Database::getInstance();
        
        try {
            $stats = [];
            
            // Overall stats
            $sql = "SELECT 
                        COUNT(*) as total_reviews,
                        AVG(rating) as average_rating,
                        MIN(rating) as min_rating,
                        MAX(rating) as max_rating
                    FROM company_reviews 
                    WHERE publisher_id = :publisher_id AND status = 'active'";
            
            $result = $db->selectOne($sql, ['publisher_id' => $publisherId]);
            $stats['total_reviews'] = $result['total_reviews'] ?? 0;
            $stats['average_rating'] = round($result['average_rating'] ?? 0, 2);
            $stats['min_rating'] = $result['min_rating'] ?? 0;
            $stats['max_rating'] = $result['max_rating'] ?? 0;
            
            // Rating distribution
            $sql = "SELECT rating, COUNT(*) as count
                    FROM company_reviews 
                    WHERE publisher_id = :publisher_id AND status = 'active'
                    GROUP BY rating
                    ORDER BY rating DESC";
            
            $results = $db->select($sql, ['publisher_id' => $publisherId]);
            $stats['rating_distribution'] = $results;
            
            return $stats;
        } catch (Exception $e) {
            error_log("Publisher rating stats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get feedback statistics for a student
     * @param int $studentId
     * @return array
     */
    public static function getStudentFeedbackStats($studentId) {
        $db = Database::getInstance();
        
        try {
            $stats = [];
            
            $stats['total_given'] = $db->count('company_reviews', ['student_id' => $studentId, 'status' => 'active']);
            
            // Average rating given
            $sql = "SELECT AVG(rating) as average_rating_given
                    FROM company_reviews 
                    WHERE student_id = :student_id AND status = 'active'";
            $result = $db->selectOne($sql, ['student_id' => $studentId]);
            $stats['average_rating_given'] = round($result['average_rating_given'] ?? 0, 2);
            
            return $stats;
        } catch (Exception $e) {
            error_log("Student feedback stats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get top rated publishers
     * @param int $limit
     * @return array
     */
    public static function getTopRatedPublishers($limit = 10) {
        $db = Database::getInstance();
        
        try {
            $sql = "SELECT 
                        p.id, p.company_name, p.first_name, p.last_name, p.profile_image_url,
                        COUNT(cr.id) as review_count,
                        AVG(cr.rating) as average_rating
                    FROM users p
                    LEFT JOIN company_reviews cr ON p.id = cr.publisher_id AND cr.status = 'active'
                    WHERE p.role = 'publisher'
                    GROUP BY p.id
                    HAVING review_count > 0
                    ORDER BY average_rating DESC, review_count DESC
                    LIMIT :limit";
            
            return $db->select($sql, ['limit' => $limit]);
        } catch (Exception $e) {
            error_log("Top rated publishers error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get recent feedback
     * @param int $limit
     * @return array
     */
    public static function getRecent($limit = 10) {
        return self::getAll(['limit' => $limit]);
    }
    
    /**
     * Create notification for publisher
     */
    private function createNotificationForPublisher() {
        try {
            $student = $this->getStudent();
            $studentName = $this->isAnonymous ? 'Anonymous' : ($student['first_name'] . ' ' . $student['last_name']);
            
            $this->db->insert('notifications', [
                'user_id' => $this->publisherId,
                'type' => 'new_review',
                'message' => "New review received from {$studentName} ({$this->rating} stars)",
                'link' => '/reviews',
                'is_read' => 0,
                'created_at' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            error_log("Publisher notification error: " . $e->getMessage());
        }
    }
    
    /**
     * Validate feedback data
     * @param array $data
     * @return array Array of validation errors
     */
    public static function validate($data) {
        $errors = [];
        
        if (empty($data['student_id'])) {
            $errors[] = "Student ID is required";
        }
        
        if (empty($data['publisher_id'])) {
            $errors[] = "Publisher ID is required";
        }
        
        if (empty($data['rating']) || !is_numeric($data['rating'])) {
            $errors[] = "Rating is required and must be numeric";
        } elseif ($data['rating'] < 1 || $data['rating'] > 5) {
            $errors[] = "Rating must be between 1 and 5";
        }
        
        if (isset($data['review']) && strlen($data['review']) > 1000) {
            $errors[] = "Review must be less than 1000 characters";
        }
        
        return $errors;
    }
    
    /**
     * Convert feedback to array
     * @return array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'student_id' => $this->studentId,
            'publisher_id' => $this->publisherId,
            'job_id' => $this->jobId,
            'rating' => $this->rating,
            'review' => $this->review,
            'is_anonymous' => $this->isAnonymous,
            'status' => $this->status,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt
        ];
    }
    
    // Getters
    public function getId() { return $this->id; }
    public function getStudentId() { return $this->studentId; }
    public function getPublisherId() { return $this->publisherId; }
    public function getJobId() { return $this->jobId; }
    public function getRating() { return $this->rating; }
    public function getReview() { return $this->review; }
    public function getIsAnonymous() { return $this->isAnonymous; }
    public function getStatus() { return $this->status; }
    public function getCreatedAt() { return $this->createdAt; }
    public function getUpdatedAt() { return $this->updatedAt; }
    
    // Setters
    public function setStudentId($studentId) { $this->studentId = $studentId; }
    public function setPublisherId($publisherId) { $this->publisherId = $publisherId; }
    public function setJobId($jobId) { $this->jobId = $jobId; }
    public function setRating($rating) { $this->rating = $rating; }
    public function setReview($review) { $this->review = $review; }
    public function setIsAnonymous($isAnonymous) { $this->isAnonymous = $isAnonymous; }
    public function setStatus($status) { $this->status = $status; }
}
?>