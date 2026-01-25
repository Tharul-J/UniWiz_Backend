<?php
/**
 * FILE: uniwiz-backend/classes/business/Payment.php
 * ==============================================================================
 * Payment class handles payment transactions and processing
 */

require_once __DIR__ . '/../core/Database.php';

class Payment {
    protected $id;
    protected $publisherId;
    protected $studentId;
    protected $jobId;
    protected $amount;
    protected $currency;
    protected $paymentMethod;
    protected $paymentGateway;
    protected $transactionId;
    protected $status;
    protected $paymentDate;
    protected $description;
    protected $metadata;
    protected $createdAt;
    protected $updatedAt;
    
    protected $db;
    protected $publisherData;
    protected $studentData;
    protected $jobData;
    
    // Payment statuses
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED = 'refunded';
    
    // Payment methods
    const METHOD_CREDIT_CARD = 'credit_card';
    const METHOD_DEBIT_CARD = 'debit_card';
    const METHOD_PAYPAL = 'paypal';
    const METHOD_BANK_TRANSFER = 'bank_transfer';
    const METHOD_STRIPE = 'stripe';
    
    /**
     * Constructor
     * @param array $data Payment data from database
     */
    public function __construct($data = []) {
        $this->db = Database::getInstance();
        
        if (!empty($data)) {
            $this->loadFromArray($data);
        }
    }
    
    /**
     * Load payment data from array
     * @param array $data
     */
    protected function loadFromArray($data) {
        $this->id = $data['id'] ?? null;
        $this->publisherId = $data['publisher_id'] ?? null;
        $this->studentId = $data['student_id'] ?? null;
        $this->jobId = $data['job_id'] ?? null;
        $this->amount = $data['amount'] ?? null;
        $this->currency = $data['currency'] ?? 'USD';
        $this->paymentMethod = $data['payment_method'] ?? null;
        $this->paymentGateway = $data['payment_gateway'] ?? null;
        $this->transactionId = $data['transaction_id'] ?? null;
        $this->status = $data['status'] ?? self::STATUS_PENDING;
        $this->paymentDate = $data['payment_date'] ?? null;
        $this->description = $data['description'] ?? null;
        $this->metadata = $data['metadata'] ?? null;
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
    }
    
    /**
     * Find payment by ID
     * @param int $id
     * @return Payment|null
     */
    public static function findById($id) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM payments WHERE id = :id";
        $data = $db->selectOne($sql, ['id' => $id]);
        
        if ($data) {
            return new self($data);
        }
        
        return null;
    }
    
    /**
     * Find payment by transaction ID
     * @param string $transactionId
     * @return Payment|null
     */
    public static function findByTransactionId($transactionId) {
        $db = Database::getInstance();
        $sql = "SELECT * FROM payments WHERE transaction_id = :transaction_id";
        $data = $db->selectOne($sql, ['transaction_id' => $transactionId]);
        
        if ($data) {
            return new self($data);
        }
        
        return null;
    }
    
    /**
     * Get all payments with filters
     * @param array $filters
     * @return array
     */
    public static function getAll($filters = []) {
        $db = Database::getInstance();
        
        $sql = "SELECT p.*, 
                       pub.company_name, pub.first_name as pub_first_name, pub.last_name as pub_last_name,
                       st.first_name as student_first_name, st.last_name as student_last_name,
                       j.title as job_title, j.job_type
                FROM payments p
                LEFT JOIN users pub ON p.publisher_id = pub.id
                LEFT JOIN users st ON p.student_id = st.id
                LEFT JOIN jobs j ON p.job_id = j.id
                WHERE 1=1";
        
        $params = [];
        
        if (isset($filters['publisher_id'])) {
            $sql .= " AND p.publisher_id = :publisher_id";
            $params['publisher_id'] = $filters['publisher_id'];
        }
        
        if (isset($filters['student_id'])) {
            $sql .= " AND p.student_id = :student_id";
            $params['student_id'] = $filters['student_id'];
        }
        
        if (isset($filters['job_id'])) {
            $sql .= " AND p.job_id = :job_id";
            $params['job_id'] = $filters['job_id'];
        }
        
        if (isset($filters['status'])) {
            $sql .= " AND p.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (isset($filters['payment_method'])) {
            $sql .= " AND p.payment_method = :payment_method";
            $params['payment_method'] = $filters['payment_method'];
        }
        
        if (isset($filters['date_from'])) {
            $sql .= " AND p.payment_date >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (isset($filters['date_to'])) {
            $sql .= " AND p.payment_date <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        $sql .= " ORDER BY p.created_at DESC";
        
        if (isset($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = $filters['limit'];
        }
        
        $results = $db->select($sql, $params);
        $payments = [];
        
        foreach ($results as $data) {
            $payments[] = new self($data);
        }
        
        return $payments;
    }
    
    /**
     * Get payments by publisher
     * @param int $publisherId
     * @param array $options
     * @return array
     */
    public static function getByPublisher($publisherId, $options = []) {
        return self::getAll(array_merge(['publisher_id' => $publisherId], $options));
    }
    
    /**
     * Get payments by student
     * @param int $studentId
     * @param array $options
     * @return array
     */
    public static function getByStudent($studentId, $options = []) {
        return self::getAll(array_merge(['student_id' => $studentId], $options));
    }
    
    /**
     * Create new payment
     * @param array $paymentData
     * @return Payment|string
     */
    public static function create($paymentData) {
        $db = Database::getInstance();
        
        try {
            // Validate data
            $errors = self::validate($paymentData);
            if (!empty($errors)) {
                return implode(", ", $errors);
            }
            
            // Check if job exists
            if (isset($paymentData['job_id'])) {
                $job = $db->selectOne("SELECT * FROM jobs WHERE id = :id", ['id' => $paymentData['job_id']]);
                if (!$job) {
                    return "Job not found";
                }
            }
            
            $payment = new self();
            $payment->publisherId = $paymentData['publisher_id'];
            $payment->studentId = $paymentData['student_id'] ?? null;
            $payment->jobId = $paymentData['job_id'] ?? null;
            $payment->amount = $paymentData['amount'];
            $payment->currency = $paymentData['currency'] ?? 'USD';
            $payment->paymentMethod = $paymentData['payment_method'];
            $payment->paymentGateway = $paymentData['payment_gateway'] ?? 'stripe';
            $payment->description = $paymentData['description'] ?? '';
            $payment->metadata = isset($paymentData['metadata']) ? json_encode($paymentData['metadata']) : null;
            
            if ($payment->save()) {
                return $payment;
            } else {
                return "Failed to create payment record";
            }
        } catch (Exception $e) {
            error_log("Payment creation error: " . $e->getMessage());
            return "An error occurred while creating the payment";
        }
    }
    
    /**
     * Process payment (integration point for payment gateways)
     * @param array $paymentDetails
     * @return bool|string
     */
    public function processPayment($paymentDetails = []) {
        try {
            $this->status = self::STATUS_PROCESSING;
            $this->save();
            
            // Here you would integrate with actual payment gateways
            // For now, we'll simulate the process
            
            switch ($this->paymentGateway) {
                case 'stripe':
                    return $this->processStripePayment($paymentDetails);
                case 'paypal':
                    return $this->processPayPalPayment($paymentDetails);
                default:
                    return $this->processMockPayment($paymentDetails);
            }
        } catch (Exception $e) {
            error_log("Payment processing error: " . $e->getMessage());
            $this->status = self::STATUS_FAILED;
            $this->save();
            return "Payment processing failed: " . $e->getMessage();
        }
    }
    
    /**
     * Process Stripe payment (mock implementation)
     * @param array $paymentDetails
     * @return bool|string
     */
    protected function processStripePayment($paymentDetails) {
        try {
            // Mock Stripe integration
            // In real implementation, you would use Stripe SDK
            
            $this->transactionId = 'stripe_' . uniqid();
            $this->status = self::STATUS_COMPLETED;
            $this->paymentDate = date('Y-m-d H:i:s');
            
            if ($this->save()) {
                $this->createPaymentNotifications();
                return true;
            }
            
            return "Failed to update payment status";
        } catch (Exception $e) {
            error_log("Stripe payment error: " . $e->getMessage());
            return "Stripe payment failed: " . $e->getMessage();
        }
    }
    
    /**
     * Process PayPal payment (mock implementation)
     * @param array $paymentDetails
     * @return bool|string
     */
    protected function processPayPalPayment($paymentDetails) {
        try {
            // Mock PayPal integration
            // In real implementation, you would use PayPal SDK
            
            $this->transactionId = 'paypal_' . uniqid();
            $this->status = self::STATUS_COMPLETED;
            $this->paymentDate = date('Y-m-d H:i:s');
            
            if ($this->save()) {
                $this->createPaymentNotifications();
                return true;
            }
            
            return "Failed to update payment status";
        } catch (Exception $e) {
            error_log("PayPal payment error: " . $e->getMessage());
            return "PayPal payment failed: " . $e->getMessage();
        }
    }
    
    /**
     * Process mock payment for testing
     * @param array $paymentDetails
     * @return bool|string
     */
    protected function processMockPayment($paymentDetails) {
        try {
            // Simulate payment success/failure for testing
            $success = rand(1, 10) > 2; // 80% success rate
            
            if ($success) {
                $this->transactionId = 'mock_' . uniqid();
                $this->status = self::STATUS_COMPLETED;
                $this->paymentDate = date('Y-m-d H:i:s');
            } else {
                $this->status = self::STATUS_FAILED;
            }
            
            if ($this->save()) {
                if ($success) {
                    $this->createPaymentNotifications();
                }
                return $success ? true : "Mock payment failed (simulated failure)";
            }
            
            return "Failed to update payment status";
        } catch (Exception $e) {
            error_log("Mock payment error: " . $e->getMessage());
            return "Mock payment failed: " . $e->getMessage();
        }
    }
    
    /**
     * Save payment to database
     * @return bool
     */
    public function save() {
        try {
            $data = [
                'publisher_id' => $this->publisherId,
                'student_id' => $this->studentId,
                'job_id' => $this->jobId,
                'amount' => $this->amount,
                'currency' => $this->currency,
                'payment_method' => $this->paymentMethod,
                'payment_gateway' => $this->paymentGateway,
                'transaction_id' => $this->transactionId,
                'status' => $this->status,
                'payment_date' => $this->paymentDate,
                'description' => $this->description,
                'metadata' => $this->metadata,
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            if ($this->id) {
                // Update existing payment
                $this->db->update('payments', $data, ['id' => $this->id]);
            } else {
                // Insert new payment
                $data['created_at'] = date('Y-m-d H:i:s');
                $this->id = $this->db->insert('payments', $data);
                $this->createdAt = $data['created_at'];
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Payment save error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Cancel payment
     * @return bool|string
     */
    public function cancel() {
        try {
            if ($this->status === self::STATUS_COMPLETED) {
                return "Cannot cancel completed payment";
            }
            
            $this->status = self::STATUS_CANCELLED;
            return $this->save();
        } catch (Exception $e) {
            error_log("Payment cancel error: " . $e->getMessage());
            return "Failed to cancel payment";
        }
    }
    
    /**
     * Refund payment
     * @param float $refundAmount Optional partial refund amount
     * @return bool|string
     */
    public function refund($refundAmount = null) {
        try {
            if ($this->status !== self::STATUS_COMPLETED) {
                return "Can only refund completed payments";
            }
            
            $refundAmount = $refundAmount ?? $this->amount;
            
            if ($refundAmount > $this->amount) {
                return "Refund amount cannot exceed payment amount";
            }
            
            // Here you would integrate with payment gateway refund API
            // For now, we'll just update the status
            
            $this->status = self::STATUS_REFUNDED;
            
            // Store refund information in metadata
            $metadata = $this->metadata ? json_decode($this->metadata, true) : [];
            $metadata['refund_amount'] = $refundAmount;
            $metadata['refund_date'] = date('Y-m-d H:i:s');
            $this->metadata = json_encode($metadata);
            
            if ($this->save()) {
                $this->createRefundNotifications($refundAmount);
                return true;
            }
            
            return "Failed to process refund";
        } catch (Exception $e) {
            error_log("Payment refund error: " . $e->getMessage());
            return "Failed to process refund: " . $e->getMessage();
        }
    }
    
    /**
     * Get payment statistics for publisher
     * @param int $publisherId
     * @return array
     */
    public static function getPublisherStats($publisherId) {
        $db = Database::getInstance();
        
        try {
            $stats = [];
            
            // Total payments
            $stats['total_payments'] = $db->count('payments', ['publisher_id' => $publisherId]);
            
            // Total amount
            $sql = "SELECT SUM(amount) as total_amount FROM payments WHERE publisher_id = :publisher_id AND status = 'completed'";
            $result = $db->selectOne($sql, ['publisher_id' => $publisherId]);
            $stats['total_amount'] = $result['total_amount'] ?? 0;
            
            // Status breakdown
            $sql = "SELECT status, COUNT(*) as count FROM payments WHERE publisher_id = :publisher_id GROUP BY status";
            $results = $db->select($sql, ['publisher_id' => $publisherId]);
            $stats['by_status'] = [];
            foreach ($results as $row) {
                $stats['by_status'][$row['status']] = $row['count'];
            }
            
            // Monthly stats (current year)
            $sql = "SELECT 
                        DATE_FORMAT(payment_date, '%Y-%m') as month,
                        COUNT(*) as payment_count,
                        SUM(amount) as total_amount
                    FROM payments 
                    WHERE publisher_id = :publisher_id 
                    AND status = 'completed'
                    AND YEAR(payment_date) = YEAR(NOW())
                    GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
                    ORDER BY month";
            $stats['monthly'] = $db->select($sql, ['publisher_id' => $publisherId]);
            
            return $stats;
        } catch (Exception $e) {
            error_log("Publisher payment stats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get payment statistics for student
     * @param int $studentId
     * @return array
     */
    public static function getStudentStats($studentId) {
        $db = Database::getInstance();
        
        try {
            $stats = [];
            
            // Total received
            $sql = "SELECT SUM(amount) as total_earned FROM payments WHERE student_id = :student_id AND status = 'completed'";
            $result = $db->selectOne($sql, ['student_id' => $studentId]);
            $stats['total_earned'] = $result['total_earned'] ?? 0;
            
            // Payment count
            $stats['payment_count'] = $db->count('payments', ['student_id' => $studentId, 'status' => 'completed']);
            
            return $stats;
        } catch (Exception $e) {
            error_log("Student payment stats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get system payment statistics
     * @return array
     */
    public static function getSystemStats() {
        $db = Database::getInstance();
        
        try {
            $stats = [];
            
            // Total transactions
            $stats['total_transactions'] = $db->count('payments');
            
            // Total revenue
            $sql = "SELECT SUM(amount) as total_revenue FROM payments WHERE status = 'completed'";
            $result = $db->selectOne($sql);
            $stats['total_revenue'] = $result['total_revenue'] ?? 0;
            
            // Status breakdown
            $sql = "SELECT status, COUNT(*) as count FROM payments GROUP BY status";
            $results = $db->select($sql);
            $stats['by_status'] = [];
            foreach ($results as $row) {
                $stats['by_status'][$row['status']] = $row['count'];
            }
            
            // Payment method breakdown
            $sql = "SELECT payment_method, COUNT(*) as count FROM payments GROUP BY payment_method";
            $results = $db->select($sql);
            $stats['by_method'] = [];
            foreach ($results as $row) {
                $stats['by_method'][$row['payment_method']] = $row['count'];
            }
            
            return $stats;
        } catch (Exception $e) {
            error_log("System payment stats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Create payment-related notifications
     */
    protected function createPaymentNotifications() {
        try {
            // Notify publisher
            if ($this->publisherId) {
                $this->db->insert('notifications', [
                    'user_id' => $this->publisherId,
                    'type' => 'payment_completed',
                    'message' => "Payment of {$this->currency} {$this->amount} has been processed successfully",
                    'link' => '/payments',
                    'is_read' => 0,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            }
            
            // Notify student if applicable
            if ($this->studentId) {
                $this->db->insert('notifications', [
                    'user_id' => $this->studentId,
                    'type' => 'payment_received',
                    'message' => "You have received a payment of {$this->currency} {$this->amount}",
                    'link' => '/payments',
                    'is_read' => 0,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            }
        } catch (Exception $e) {
            error_log("Payment notification error: " . $e->getMessage());
        }
    }
    
    /**
     * Create refund notifications
     * @param float $refundAmount
     */
    protected function createRefundNotifications($refundAmount) {
        try {
            // Notify publisher
            if ($this->publisherId) {
                $this->db->insert('notifications', [
                    'user_id' => $this->publisherId,
                    'type' => 'payment_refunded',
                    'message' => "Refund of {$this->currency} {$refundAmount} has been processed",
                    'link' => '/payments',
                    'is_read' => 0,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            }
            
            // Notify student if applicable
            if ($this->studentId) {
                $this->db->insert('notifications', [
                    'user_id' => $this->studentId,
                    'type' => 'payment_refunded',
                    'message' => "A refund of {$this->currency} {$refundAmount} has been processed to your account",
                    'link' => '/payments',
                    'is_read' => 0,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            }
        } catch (Exception $e) {
            error_log("Refund notification error: " . $e->getMessage());
        }
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
            $sql = "SELECT j.*, jc.name as category_name
                    FROM jobs j
                    LEFT JOIN job_categories jc ON j.category_id = jc.id
                    WHERE j.id = :job_id";
            $this->jobData = $this->db->selectOne($sql, ['job_id' => $this->jobId]);
        }
        return $this->jobData;
    }
    
    /**
     * Validate payment data
     * @param array $data
     * @return array Array of validation errors
     */
    public static function validate($data) {
        $errors = [];
        
        if (empty($data['publisher_id'])) {
            $errors[] = "Publisher ID is required";
        }
        
        if (empty($data['amount']) || !is_numeric($data['amount'])) {
            $errors[] = "Amount is required and must be numeric";
        } elseif ($data['amount'] <= 0) {
            $errors[] = "Amount must be greater than 0";
        }
        
        if (empty($data['payment_method'])) {
            $errors[] = "Payment method is required";
        }
        
        $allowedMethods = [self::METHOD_CREDIT_CARD, self::METHOD_DEBIT_CARD, self::METHOD_PAYPAL, self::METHOD_BANK_TRANSFER, self::METHOD_STRIPE];
        if (isset($data['payment_method']) && !in_array($data['payment_method'], $allowedMethods)) {
            $errors[] = "Invalid payment method";
        }
        
        return $errors;
    }
    
    /**
     * Convert payment to array
     * @return array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'publisher_id' => $this->publisherId,
            'student_id' => $this->studentId,
            'job_id' => $this->jobId,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'payment_method' => $this->paymentMethod,
            'payment_gateway' => $this->paymentGateway,
            'transaction_id' => $this->transactionId,
            'status' => $this->status,
            'payment_date' => $this->paymentDate,
            'description' => $this->description,
            'metadata' => $this->metadata,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt
        ];
    }
    
    // Getters
    public function getId() { return $this->id; }
    public function getPublisherId() { return $this->publisherId; }
    public function getStudentId() { return $this->studentId; }
    public function getJobId() { return $this->jobId; }
    public function getAmount() { return $this->amount; }
    public function getCurrency() { return $this->currency; }
    public function getPaymentMethod() { return $this->paymentMethod; }
    public function getPaymentGateway() { return $this->paymentGateway; }
    public function getTransactionId() { return $this->transactionId; }
    public function getStatus() { return $this->status; }
    public function getPaymentDate() { return $this->paymentDate; }
    public function getDescription() { return $this->description; }
    public function getMetadata() { return $this->metadata; }
    public function getCreatedAt() { return $this->createdAt; }
    public function getUpdatedAt() { return $this->updatedAt; }
    
    // Setters
    public function setPublisherId($publisherId) { $this->publisherId = $publisherId; }
    public function setStudentId($studentId) { $this->studentId = $studentId; }
    public function setJobId($jobId) { $this->jobId = $jobId; }
    public function setAmount($amount) { $this->amount = $amount; }
    public function setCurrency($currency) { $this->currency = $currency; }
    public function setPaymentMethod($paymentMethod) { $this->paymentMethod = $paymentMethod; }
    public function setPaymentGateway($paymentGateway) { $this->paymentGateway = $paymentGateway; }
    public function setTransactionId($transactionId) { $this->transactionId = $transactionId; }
    public function setStatus($status) { $this->status = $status; }
    public function setPaymentDate($paymentDate) { $this->paymentDate = $paymentDate; }
    public function setDescription($description) { $this->description = $description; }
    public function setMetadata($metadata) { $this->metadata = $metadata; }
}
?>