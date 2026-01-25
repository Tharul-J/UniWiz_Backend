<?php
/**
 * FILE: uniwiz-backend/classes/users/Publisher.php
 * ==============================================================================
 * Publisher class extends RegisteredUser and represents publisher/company users
 * with specific functionality for job posting, applicant management, and company profile
 */

require_once __DIR__ . '/RegisteredUser.php';

class Publisher extends RegisteredUser {
    protected $about;
    protected $industry;
    protected $websiteUrl;
    protected $address;
    protected $phoneNumber;
    protected $facebookUrl;
    protected $linkedinUrl;
    protected $instagramUrl;
    protected $coverImageUrl;
    protected $requiredDocUrl;
    
    /**
     * Constructor
     * @param array $data User data from database
     */
    public function __construct($data = []) {
        parent::__construct($data);
        $this->loadPublisherProfile();
    }
    
    /**
     * Load publisher profile data
     */
    protected function loadPublisherProfile() {
        if ($this->id) {
            $sql = "SELECT * FROM publisher_profiles WHERE user_id = :user_id";
            $profile = $this->db->selectOne($sql, ['user_id' => $this->id]);
            
            if ($profile) {
                $this->about = $profile['about'];
                $this->industry = $profile['industry'];
                $this->websiteUrl = $profile['website_url'];
                $this->address = $profile['address'];
                $this->phoneNumber = $profile['phone_number'];
                $this->facebookUrl = $profile['facebook_url'];
                $this->linkedinUrl = $profile['linkedin_url'];
                $this->instagramUrl = $profile['instagram_url'];
                $this->coverImageUrl = $profile['cover_image_url'];
                $this->requiredDocUrl = $profile['required_doc_url'];
            }
        }
    }
    
    /**
     * Get publisher-specific permissions
     * @return array
     */
    public function getPermissions() {
        $basePermissions = parent::getPermissions();
        $publisherPermissions = [
            'create_jobs',
            'edit_jobs',
            'view_applicants',
            'manage_applications',
            'view_company_analytics',
            'upload_company_documents',
            'manage_company_profile',
            'extend_job_deadlines'
        ];
        
        return array_merge($basePermissions, $publisherPermissions);
    }
    
    /**
     * Get publisher profile data
     * @return array
     */
    public function getProfileData() {
        return [
            'about' => $this->about,
            'industry' => $this->industry,
            'website_url' => $this->websiteUrl,
            'address' => $this->address,
            'phone_number' => $this->phoneNumber,
            'facebook_url' => $this->facebookUrl,
            'linkedin_url' => $this->linkedinUrl,
            'instagram_url' => $this->instagramUrl,
            'cover_image_url' => $this->coverImageUrl,
            'required_doc_url' => $this->requiredDocUrl
        ];
    }
    
    /**
     * Update publisher profile table
     * @param array $profileData
     * @return bool
     */
    protected function updateProfileTable($profileData) {
        try {
            $updateData = [];
            
            $profileFields = [
                'about', 'industry', 'website_url', 'address', 'phone_number',
                'facebook_url', 'linkedin_url', 'instagram_url', 
                'cover_image_url', 'required_doc_url'
            ];
            
            foreach ($profileFields as $field) {
                if (isset($profileData[$field])) {
                    $updateData[$field] = $profileData[$field];
                    $this->$field = $profileData[$field];
                }
            }
            
            if (!empty($updateData)) {
                // Check if profile exists
                if ($this->db->exists('publisher_profiles', ['user_id' => $this->id])) {
                    $this->db->update('publisher_profiles', $updateData, ['user_id' => $this->id]);
                } else {
                    $updateData['user_id'] = $this->id;
                    $this->db->insert('publisher_profiles', $updateData);
                }
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Publisher profile update error: " . $e->getMessage());
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
            
            // Active jobs count
            $stats['active_jobs'] = $this->db->count('jobs', [
                'publisher_id' => $this->id,
                'status' => 'active'
            ]);
            
            // Total applicants across all jobs
            $sql = "SELECT COUNT(ja.id) as count 
                    FROM job_applications ja 
                    INNER JOIN jobs j ON ja.job_id = j.id 
                    WHERE j.publisher_id = :publisher_id";
            $result = $this->db->selectOne($sql, ['publisher_id' => $this->id]);
            $stats['total_applicants'] = $result['count'] ?? 0;
            
            // Today's applications
            $sql = "SELECT COUNT(ja.id) as count 
                    FROM job_applications ja 
                    INNER JOIN jobs j ON ja.job_id = j.id 
                    WHERE j.publisher_id = :publisher_id 
                    AND DATE(ja.applied_at) = CURDATE()";
            $result = $this->db->selectOne($sql, ['publisher_id' => $this->id]);
            $stats['todays_applications'] = $result['count'] ?? 0;
            
            // Pending applications
            $sql = "SELECT COUNT(ja.id) as count 
                    FROM job_applications ja 
                    INNER JOIN jobs j ON ja.job_id = j.id 
                    WHERE j.publisher_id = :publisher_id 
                    AND ja.status = 'pending'";
            $result = $this->db->selectOne($sql, ['publisher_id' => $this->id]);
            $stats['pending_applications'] = $result['count'] ?? 0;
            
            // Recent applicants
            $sql = "SELECT ja.id as application_id, u.id as student_id, 
                           u.first_name, u.last_name, u.profile_image_url, 
                           j.title as job_title, ja.applied_at, ja.status
                    FROM job_applications ja 
                    JOIN users u ON ja.student_id = u.id 
                    JOIN jobs j ON ja.job_id = j.id 
                    WHERE j.publisher_id = :publisher_id 
                    ORDER BY ja.applied_at DESC 
                    LIMIT 5";
            $stats['recent_applicants'] = $this->db->select($sql, ['publisher_id' => $this->id]);
            
            // Job overview
            $sql = "SELECT j.id, j.title, j.status, j.created_at, j.deadline, j.vacancies,
                           (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as application_count,
                           (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted') as accepted_count
                    FROM jobs j 
                    WHERE j.publisher_id = :publisher_id 
                    ORDER BY j.created_at DESC 
                    LIMIT 5";
            $stats['job_overview'] = $this->db->select($sql, ['publisher_id' => $this->id]);
            
            // Latest reviews
            $sql = "SELECT r.id as review_id, r.rating, r.review_text, r.created_at,
                           s.first_name, s.last_name, s.profile_image_url as student_image_url
                    FROM company_reviews r
                    JOIN users s ON r.student_id = s.id
                    WHERE r.publisher_id = :publisher_id
                    ORDER BY r.created_at DESC
                    LIMIT 3";
            $stats['latest_reviews'] = $this->db->select($sql, ['publisher_id' => $this->id]);
            
            // Average rating and review count
            $sql = "SELECT AVG(rating) as average_rating, COUNT(id) as total_review_count
                    FROM company_reviews
                    WHERE publisher_id = :publisher_id";
            $ratingData = $this->db->selectOne($sql, ['publisher_id' => $this->id]);
            $stats['average_rating'] = $ratingData['average_rating'] ? round($ratingData['average_rating'], 1) : 0;
            $stats['total_review_count'] = $ratingData['total_review_count'] ? (int)$ratingData['total_review_count'] : 0;
            
            return $stats;
        } catch (Exception $e) {
            error_log("Publisher dashboard stats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Create a new job posting
     * @param array $jobData
     * @return int|false Job ID on success, false on failure
     */
    public function createJob($jobData) {
        try {
            // Validate required fields
            $requiredFields = ['title', 'description', 'category_id', 'job_type', 'payment_range'];
            foreach ($requiredFields as $field) {
                if (empty($jobData[$field])) {
                    throw new Exception("Missing required field: {$field}");
                }
            }
            
            $insertData = [
                'publisher_id' => $this->id,
                'title' => $jobData['title'],
                'description' => $jobData['description'],
                'category_id' => $jobData['category_id'],
                'job_type' => $jobData['job_type'],
                'payment_range' => $jobData['payment_range'],
                'location' => $jobData['location'] ?? '',
                'requirements' => $jobData['requirements'] ?? '',
                'benefits' => $jobData['benefits'] ?? '',
                'deadline' => $jobData['deadline'] ?? null,
                'start_date' => $jobData['start_date'] ?? null,
                'vacancies' => $jobData['vacancies'] ?? 1,
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $jobId = $this->db->insert('jobs', $insertData);
            
            // Create notification for all admins
            $this->createAdminNotification('new_job_posted', 
                "New job posted by " . ($this->companyName ?: $this->getFullName()) . ": " . $jobData['title'],
                "/admin/jobs"
            );
            
            return $jobId;
        } catch (Exception $e) {
            error_log("Job creation error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update a job posting
     * @param int $jobId
     * @param array $jobData
     * @return bool
     */
    public function updateJob($jobId, $jobData) {
        try {
            // Verify job ownership
            if (!$this->db->exists('jobs', ['id' => $jobId, 'publisher_id' => $this->id])) {
                throw new Exception("Job not found or access denied");
            }
            
            $updateData = [];
            $allowedFields = [
                'title', 'description', 'category_id', 'job_type', 'payment_range',
                'location', 'requirements', 'benefits', 'deadline', 'start_date', 'vacancies'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($jobData[$field])) {
                    $updateData[$field] = $jobData[$field];
                }
            }
            
            if (!empty($updateData)) {
                $updateData['updated_at'] = date('Y-m-d H:i:s');
                $this->db->update('jobs', $updateData, ['id' => $jobId]);
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Job update error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get publisher's jobs
     * @param array $filters
     * @return array
     */
    public function getJobs($filters = []) {
        try {
            $sql = "SELECT j.*, jc.name as category_name,
                           (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as application_count,
                           (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted') as accepted_count
                    FROM jobs j
                    LEFT JOIN job_categories jc ON j.category_id = jc.id
                    WHERE j.publisher_id = :publisher_id";
            
            $params = ['publisher_id' => $this->id];
            
            if (isset($filters['status'])) {
                $sql .= " AND j.status = :status";
                $params['status'] = $filters['status'];
            }
            
            $sql .= " ORDER BY j.created_at DESC";
            
            if (isset($filters['limit'])) {
                $sql .= " LIMIT :limit";
                $params['limit'] = $filters['limit'];
            }
            
            return $this->db->select($sql, $params);
        } catch (Exception $e) {
            error_log("Get jobs error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get job applicants
     * @param int $jobId
     * @param array $filters
     * @return array
     */
    public function getJobApplicants($jobId, $filters = []) {
        try {
            // Verify job ownership
            if (!$this->db->exists('jobs', ['id' => $jobId, 'publisher_id' => $this->id])) {
                throw new Exception("Job not found or access denied");
            }
            
            $sql = "SELECT ja.*, u.first_name, u.last_name, u.email, u.profile_image_url,
                           sp.university_name, sp.field_of_study, sp.year_of_study, sp.cv_url
                    FROM job_applications ja
                    JOIN users u ON ja.student_id = u.id
                    LEFT JOIN student_profiles sp ON u.id = sp.user_id
                    WHERE ja.job_id = :job_id";
            
            $params = ['job_id' => $jobId];
            
            if (isset($filters['status'])) {
                $sql .= " AND ja.status = :status";
                $params['status'] = $filters['status'];
            }
            
            $sql .= " ORDER BY ja.applied_at DESC";
            
            return $this->db->select($sql, $params);
        } catch (Exception $e) {
            error_log("Get job applicants error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Update application status
     * @param int $applicationId
     * @param string $status
     * @return bool|string
     */
    public function updateApplicationStatus($applicationId, $status) {
        try {
            $allowedStatuses = ['pending', 'viewed', 'accepted', 'rejected'];
            if (!in_array($status, $allowedStatuses)) {
                return "Invalid status";
            }
            
            // Get application details and verify ownership
            $sql = "SELECT ja.*, j.title, j.publisher_id 
                    FROM job_applications ja 
                    JOIN jobs j ON ja.job_id = j.id 
                    WHERE ja.id = :application_id";
            $application = $this->db->selectOne($sql, ['application_id' => $applicationId]);
            
            if (!$application || $application['publisher_id'] != $this->id) {
                return "Application not found or access denied";
            }
            
            // Update status
            $this->db->update('job_applications', 
                ['status' => $status], 
                ['id' => $applicationId]
            );
            
            // Create notification for student
            $this->createNotificationForStudent($application['student_id'],
                'application_status_updated',
                "Your application for " . $application['title'] . " has been " . $status,
                "/applications"
            );
            
            return true;
        } catch (Exception $e) {
            error_log("Update application status error: " . $e->getMessage());
            return "An error occurred while updating the application status";
        }
    }
    
    /**
     * Get company reviews
     * @param int $limit
     * @return array
     */
    public function getReviews($limit = 20) {
        try {
            $sql = "SELECT r.*, u.first_name, u.last_name, u.profile_image_url
                    FROM company_reviews r
                    JOIN users u ON r.student_id = u.id
                    WHERE r.publisher_id = :publisher_id
                    ORDER BY r.created_at DESC";
            
            $params = ['publisher_id' => $this->id];
            
            if ($limit > 0) {
                $sql .= " LIMIT :limit";
                $params['limit'] = $limit;
            }
            
            return $this->db->select($sql, $params);
        } catch (Exception $e) {
            error_log("Get reviews error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Upload required document (BR/NIC)
     * @param array $file
     * @return string|false
     */
    public function uploadRequiredDocument($file) {
        try {
            // Validate file
            if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
                throw new Exception("Invalid file upload");
            }
            
            $allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            if (!in_array($file['type'], $allowedTypes)) {
                throw new Exception("Invalid file type. Only PDF, JPEG, and PNG allowed.");
            }
            
            $maxSize = 5 * 1024 * 1024; // 5MB
            if ($file['size'] > $maxSize) {
                throw new Exception("File too large. Maximum size is 5MB.");
            }
            
            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'doc_' . $this->id . '_' . time() . '.' . $extension;
            $uploadPath = __DIR__ . '/../../api/uploads/required_docs/' . $filename;
            
            // Create directory if it doesn't exist
            $uploadDir = dirname($uploadPath);
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                $relativePath = 'uploads/required_docs/' . $filename;
                
                // Update database
                $this->requiredDocUrl = $relativePath;
                $this->db->update('publisher_profiles', 
                    ['required_doc_url' => $relativePath], 
                    ['user_id' => $this->id]
                );
                
                return $relativePath;
            } else {
                throw new Exception("Failed to upload file");
            }
        } catch (Exception $e) {
            error_log("Required document upload error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Create notification for student
     * @param int $studentId
     * @param string $type
     * @param string $message
     * @param string $link
     */
    private function createNotificationForStudent($studentId, $type, $message, $link = '') {
        try {
            $this->db->insert('notifications', [
                'user_id' => $studentId,
                'type' => $type,
                'message' => $message,
                'link' => $link,
                'is_read' => 0,
                'created_at' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            error_log("Student notification error: " . $e->getMessage());
        }
    }
    
    /**
     * Create notification for all admins
     * @param string $type
     * @param string $message
     * @param string $link
     */
    private function createAdminNotification($type, $message, $link = '') {
        try {
            $admins = $this->db->select("SELECT id FROM users WHERE role = 'admin'");
            
            foreach ($admins as $admin) {
                $this->db->insert('notifications', [
                    'user_id' => $admin['id'],
                    'type' => $type,
                    'message' => $message,
                    'link' => $link,
                    'is_read' => 0,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            }
        } catch (Exception $e) {
            error_log("Admin notification error: " . $e->getMessage());
        }
    }
    
    /**
     * Convert publisher to array
     * @return array
     */
    public function toArray() {
        $data = parent::toArray();
        $data['profile_data'] = $this->getProfileData();
        return $data;
    }
    
    // Getters
    public function getAbout() { return $this->about; }
    public function getIndustry() { return $this->industry; }
    public function getWebsiteUrl() { return $this->websiteUrl; }
    public function getAddress() { return $this->address; }
    public function getPhoneNumber() { return $this->phoneNumber; }
    public function getFacebookUrl() { return $this->facebookUrl; }
    public function getLinkedinUrl() { return $this->linkedinUrl; }
    public function getInstagramUrl() { return $this->instagramUrl; }
    public function getCoverImageUrl() { return $this->coverImageUrl; }
    public function getRequiredDocUrl() { return $this->requiredDocUrl; }
    
    // Setters
    public function setAbout($about) { $this->about = $about; }
    public function setIndustry($industry) { $this->industry = $industry; }
    public function setWebsiteUrl($websiteUrl) { $this->websiteUrl = $websiteUrl; }
    public function setAddress($address) { $this->address = $address; }
    public function setPhoneNumber($phoneNumber) { $this->phoneNumber = $phoneNumber; }
    public function setFacebookUrl($facebookUrl) { $this->facebookUrl = $facebookUrl; }
    public function setLinkedinUrl($linkedinUrl) { $this->linkedinUrl = $linkedinUrl; }
    public function setInstagramUrl($instagramUrl) { $this->instagramUrl = $instagramUrl; }
    public function setCoverImageUrl($coverImageUrl) { $this->coverImageUrl = $coverImageUrl; }
}
?>