<?php
/**
 * FILE: uniwiz-backend/classes/users/Student.php
 * ==============================================================================
 * Student class extends RegisteredUser and represents student users
 * with specific functionality for job applications, wishlists, and academic info
 */

require_once __DIR__ . '/RegisteredUser.php';

class Student extends RegisteredUser {
    protected $universityName;
    protected $fieldOfStudy;
    protected $yearOfStudy;
    protected $languagesSpoken;
    protected $preferredCategories;
    protected $skills;
    protected $cvUrl;
    
    /**
     * Constructor
     * @param array $data User data from database
     */
    public function __construct($data = []) {
        parent::__construct($data);
        $this->loadStudentProfile();
    }
    
    /**
     * Load student profile data
     */
    protected function loadStudentProfile() {
        if ($this->id) {
            $sql = "SELECT * FROM student_profiles WHERE user_id = :user_id";
            $profile = $this->db->selectOne($sql, ['user_id' => $this->id]);
            
            if ($profile) {
                $this->universityName = $profile['university_name'];
                $this->fieldOfStudy = $profile['field_of_study'];
                $this->yearOfStudy = $profile['year_of_study'];
                $this->languagesSpoken = $profile['languages_spoken'];
                $this->preferredCategories = $profile['preferred_categories'];
                $this->skills = $profile['skills'];
                $this->cvUrl = $profile['cv_url'];
            }
        }
    }
    
    /**
     * Get student-specific permissions
     * @return array
     */
    public function getPermissions() {
        $basePermissions = parent::getPermissions();
        $studentPermissions = [
            'apply_to_jobs',
            'view_job_details',
            'search_jobs',
            'manage_wishlist',
            'upload_cv',
            'view_application_history',
            'create_reviews',
            'view_recommendations'
        ];
        
        return array_merge($basePermissions, $studentPermissions);
    }
    
    /**
     * Get student profile data
     * @return array
     */
    public function getProfileData() {
        return [
            'university_name' => $this->universityName,
            'field_of_study' => $this->fieldOfStudy,
            'year_of_study' => $this->yearOfStudy,
            'languages_spoken' => $this->languagesSpoken,
            'preferred_categories' => $this->preferredCategories,
            'skills' => $this->skills,
            'cv_url' => $this->cvUrl
        ];
    }
    
    /**
     * Update student profile table
     * @param array $profileData
     * @return bool
     */
    protected function updateProfileTable($profileData) {
        try {
            $updateData = [];
            
            $profileFields = [
                'university_name', 'field_of_study', 'year_of_study',
                'languages_spoken', 'preferred_categories', 'skills', 'cv_url'
            ];
            
            foreach ($profileFields as $field) {
                if (isset($profileData[$field])) {
                    $updateData[$field] = $profileData[$field];
                    $this->$field = $profileData[$field];
                }
            }
            
            if (!empty($updateData)) {
                // Check if profile exists
                if ($this->db->exists('student_profiles', ['user_id' => $this->id])) {
                    $this->db->update('student_profiles', $updateData, ['user_id' => $this->id]);
                } else {
                    $updateData['user_id'] = $this->id;
                    $this->db->insert('student_profiles', $updateData);
                }
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Student profile update error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get dashboard statistics
     * @return array
     */
    public function getDashboardStats() {
        try {
            $stats = [];
            
            // Total applications sent
            $stats['applications_sent'] = $this->db->count('job_applications', ['student_id' => $this->id]);
            
            // Accepted applications
            $stats['applications_accepted'] = $this->db->count('job_applications', [
                'student_id' => $this->id,
                'status' => 'accepted'
            ]);
            
            // Viewed applications
            $stats['applications_viewed'] = $this->db->count('job_applications', [
                'student_id' => $this->id,
                'status' => 'viewed'
            ]);
            
            // Wishlist count
            $stats['wishlist_count'] = $this->db->count('wishlist', ['student_id' => $this->id]);
            
            // Recent applications
            $sql = "SELECT ja.id, ja.status, ja.applied_at, j.title, j.payment_range, 
                           u.company_name, u.first_name, u.last_name
                    FROM job_applications ja
                    JOIN jobs j ON ja.job_id = j.id
                    JOIN users u ON j.publisher_id = u.id
                    WHERE ja.student_id = :student_id
                    ORDER BY ja.applied_at DESC
                    LIMIT 5";
            
            $stats['recent_applications'] = $this->db->select($sql, ['student_id' => $this->id]);
            
            return $stats;
        } catch (Exception $e) {
            error_log("Student dashboard stats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Apply to a job
     * @param int $jobId
     * @param string $proposal
     * @return bool|string
     */
    public function applyToJob($jobId, $proposal = '') {
        try {
            // Check if already applied
            if ($this->db->exists('job_applications', ['student_id' => $this->id, 'job_id' => $jobId])) {
                return "You have already applied to this job.";
            }
            
            // Check if job exists and is active
            $job = $this->db->selectOne("SELECT * FROM jobs WHERE id = :id AND status = 'active'", ['id' => $jobId]);
            if (!$job) {
                return "Job not found or no longer active.";
            }
            
            // Create application
            $applicationData = [
                'student_id' => $this->id,
                'job_id' => $jobId,
                'proposal' => $proposal,
                'status' => 'pending',
                'applied_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->insert('job_applications', $applicationData);
            
            // Create notification for publisher
            $this->createNotificationForPublisher($job['publisher_id'], 
                'new_application', 
                "New application received for " . $job['title'],
                "/applicants"
            );
            
            return true;
        } catch (Exception $e) {
            error_log("Job application error: " . $e->getMessage());
            return "An error occurred while applying to the job.";
        }
    }
    
    /**
     * Add job to wishlist
     * @param int $jobId
     * @return bool|string
     */
    public function addToWishlist($jobId) {
        try {
            // Check if already in wishlist
            if ($this->db->exists('wishlist', ['student_id' => $this->id, 'job_id' => $jobId])) {
                return "Job is already in your wishlist.";
            }
            
            // Check if job exists
            if (!$this->db->exists('jobs', ['id' => $jobId])) {
                return "Job not found.";
            }
            
            $this->db->insert('wishlist', [
                'student_id' => $this->id,
                'job_id' => $jobId,
                'added_at' => date('Y-m-d H:i:s')
            ]);
            
            return true;
        } catch (Exception $e) {
            error_log("Wishlist add error: " . $e->getMessage());
            return "An error occurred while adding to wishlist.";
        }
    }
    
    /**
     * Remove job from wishlist
     * @param int $jobId
     * @return bool
     */
    public function removeFromWishlist($jobId) {
        try {
            $this->db->delete('wishlist', ['student_id' => $this->id, 'job_id' => $jobId]);
            return true;
        } catch (Exception $e) {
            error_log("Wishlist remove error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get wishlist jobs
     * @return array
     */
    public function getWishlistJobs() {
        try {
            $sql = "SELECT j.*, u.company_name, u.first_name, u.last_name, u.profile_image_url,
                           jc.name as category_name, w.added_at
                    FROM wishlist w
                    JOIN jobs j ON w.job_id = j.id
                    JOIN users u ON j.publisher_id = u.id
                    LEFT JOIN job_categories jc ON j.category_id = jc.id
                    WHERE w.student_id = :student_id
                    ORDER BY w.added_at DESC";
            
            return $this->db->select($sql, ['student_id' => $this->id]);
        } catch (Exception $e) {
            error_log("Get wishlist error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get application history
     * @param array $filters
     * @return array
     */
    public function getApplicationHistory($filters = []) {
        try {
            $sql = "SELECT ja.*, j.title, j.payment_range, j.job_type,
                           u.company_name, u.first_name, u.last_name, u.profile_image_url,
                           jc.name as category_name
                    FROM job_applications ja
                    JOIN jobs j ON ja.job_id = j.id
                    JOIN users u ON j.publisher_id = u.id
                    LEFT JOIN job_categories jc ON j.category_id = jc.id
                    WHERE ja.student_id = :student_id";
            
            $params = ['student_id' => $this->id];
            
            if (isset($filters['status'])) {
                $sql .= " AND ja.status = :status";
                $params['status'] = $filters['status'];
            }
            
            $sql .= " ORDER BY ja.applied_at DESC";
            
            if (isset($filters['limit'])) {
                $sql .= " LIMIT :limit";
                $params['limit'] = $filters['limit'];
            }
            
            return $this->db->select($sql, $params);
        } catch (Exception $e) {
            error_log("Get application history error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Create review for a publisher
     * @param int $publisherId
     * @param int $rating
     * @param string $reviewText
     * @return bool|string
     */
    public function createReview($publisherId, $rating, $reviewText) {
        try {
            // Validate rating
            if ($rating < 1 || $rating > 5) {
                return "Rating must be between 1 and 5.";
            }
            
            // Check if publisher exists
            if (!$this->db->exists('users', ['id' => $publisherId, 'role' => 'publisher'])) {
                return "Publisher not found.";
            }
            
            // Check if review already exists
            if ($this->db->exists('company_reviews', ['student_id' => $this->id, 'publisher_id' => $publisherId])) {
                // Update existing review
                $this->db->update('company_reviews', [
                    'rating' => $rating,
                    'review_text' => $reviewText,
                    'created_at' => date('Y-m-d H:i:s')
                ], [
                    'student_id' => $this->id,
                    'publisher_id' => $publisherId
                ]);
            } else {
                // Create new review
                $this->db->insert('company_reviews', [
                    'student_id' => $this->id,
                    'publisher_id' => $publisherId,
                    'rating' => $rating,
                    'review_text' => $reviewText,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
                
                // Create notification for publisher
                $this->createNotificationForPublisher($publisherId,
                    'new_review',
                    $this->getFullName() . " has left a {$rating}-star review for your company.",
                    "/reviews"
                );
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Create review error: " . $e->getMessage());
            return "An error occurred while creating the review.";
        }
    }
    
    /**
     * Upload CV
     * @param array $file
     * @return string|false
     */
    public function uploadCV($file) {
        try {
            // Validate file
            if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
                throw new Exception("Invalid file upload");
            }
            
            $allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!in_array($file['type'], $allowedTypes)) {
                throw new Exception("Invalid file type. Only PDF and Word documents allowed.");
            }
            
            $maxSize = 10 * 1024 * 1024; // 10MB
            if ($file['size'] > $maxSize) {
                throw new Exception("File too large. Maximum size is 10MB.");
            }
            
            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'cv_' . $this->id . '_' . time() . '.' . $extension;
            $uploadPath = __DIR__ . '/../../api/uploads/cvs/' . $filename;
            
            // Create directory if it doesn't exist
            $uploadDir = dirname($uploadPath);
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                $relativePath = 'uploads/cvs/' . $filename;
                
                // Update database
                $this->cvUrl = $relativePath;
                $this->db->update('student_profiles', 
                    ['cv_url' => $relativePath], 
                    ['user_id' => $this->id]
                );
                
                return $relativePath;
            } else {
                throw new Exception("Failed to upload file");
            }
        } catch (Exception $e) {
            error_log("CV upload error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Create notification for publisher
     * @param int $publisherId
     * @param string $type
     * @param string $message
     * @param string $link
     */
    private function createNotificationForPublisher($publisherId, $type, $message, $link = '') {
        try {
            $this->db->insert('notifications', [
                'user_id' => $publisherId,
                'type' => $type,
                'message' => $message,
                'link' => $link,
                'is_read' => 0,
                'created_at' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            error_log("Publisher notification error: " . $e->getMessage());
        }
    }
    
    /**
     * Convert student to array
     * @return array
     */
    public function toArray() {
        $data = parent::toArray();
        $data['profile_data'] = $this->getProfileData();
        return $data;
    }
    
    // Getters
    public function getUniversityName() { return $this->universityName; }
    public function getFieldOfStudy() { return $this->fieldOfStudy; }
    public function getYearOfStudy() { return $this->yearOfStudy; }
    public function getLanguagesSpoken() { return $this->languagesSpoken; }
    public function getPreferredCategories() { return $this->preferredCategories; }
    public function getSkills() { return $this->skills; }
    public function getCvUrl() { return $this->cvUrl; }
    
    // Setters
    public function setUniversityName($universityName) { $this->universityName = $universityName; }
    public function setFieldOfStudy($fieldOfStudy) { $this->fieldOfStudy = $fieldOfStudy; }
    public function setYearOfStudy($yearOfStudy) { $this->yearOfStudy = $yearOfStudy; }
    public function setLanguagesSpoken($languagesSpoken) { $this->languagesSpoken = $languagesSpoken; }
    public function setPreferredCategories($preferredCategories) { $this->preferredCategories = $preferredCategories; }
    public function setSkills($skills) { $this->skills = $skills; }
}
?>