<?php
// FILE: uniwiz-backend/api/process_payment.php
// ========================================================================
// This endpoint simulates a payment system for job postings (for demo/testing purposes).
// It supports fake credit card, bank transfer, and e-wallet payments.

// --- Headers, DB Connection ---
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
include_once '../config/database.php'; // Include database connection
$database = new Database();
$db = $database->getConnection();
if ($db === null) { 
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

// --- Validate Payment Data ---
if ($data === null || !isset($data->job_id) || !isset($data->payment_method) || !isset($data->amount)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete payment data."]);
    exit();
}

// --- FAKE Payment Processing Functions ---
function validateFakeCreditCard($card_number, $expiry_month, $expiry_year, $cvv) {
    // Basic validation for demo
    if (strlen($card_number) < 13 || strlen($card_number) > 19) {
        return false;
    }
    if ($expiry_month < 1 || $expiry_month > 12) {
        return false;
    }
    $current_year = date('Y');
    if ($expiry_year < $current_year) {
        return false;
    }
    if (strlen($cvv) < 3 || strlen($cvv) > 4) {
        return false;
    }
    // FAKE: Specific card numbers for testing
    $test_cards = [
        '4242424242424242', // Success
        '4000000000000002', // Declined
        '4000000000009995', // Insufficient funds
        '4000000000009987', // Lost card
        '4000000000009979', // Stolen card
    ];
    // If it's a test card, return specific results
    if (in_array($card_number, $test_cards)) {
        switch ($card_number) {
            case '4242424242424242':
                return 'success';
            case '4000000000000002':
                return 'declined';
            case '4000000000009995':
                return 'insufficient_funds';
            case '4000000000009987':
                return 'lost_card';
            case '4000000000009979':
                return 'stolen_card';
        }
    }
    // For other cards, simulate 95% success rate
    return (rand(1, 100) <= 95) ? 'success' : 'declined';
}

function processFakeCreditCardPayment($card_data, $amount) {
    $validation_result = validateFakeCreditCard($card_data['number'], $card_data['expiry_month'], $card_data['expiry_year'], $card_data['cvv']);
    if ($validation_result === 'success') {
        return [
            'success' => true,
            'transaction_id' => 'TXN_' . time() . '_' . rand(1000, 9999),
            'amount' => $amount,
            'method' => 'credit_card',
            'message' => 'Payment processed successfully'
        ];
    } else {
        $error_messages = [
            'declined' => 'Payment declined by bank',
            'insufficient_funds' => 'Insufficient funds in account',
            'lost_card' => 'Card reported as lost',
            'stolen_card' => 'Card reported as stolen'
        ];
        return [
            'success' => false,
            'error' => $error_messages[$validation_result] ?? 'Payment failed'
        ];
    }
}

function processFakeBankTransfer($bank_data, $amount) {
    // Simulate bank transfer processing with 98% success rate
    if (rand(1, 100) <= 98) {
        return [
            'success' => true,
            'transaction_id' => 'BANK_' . time() . '_' . rand(1000, 9999),
            'amount' => $amount,
            'method' => 'bank_transfer',
            'reference' => 'REF_' . time(),
            'message' => 'Bank transfer initiated successfully'
        ];
    } else {
        return [
            'success' => false,
            'error' => 'Bank transfer failed - please try again'
        ];
    }
}

function processFakeEWallet($wallet_data, $amount) {
    // Simulate e-wallet processing with 99% success rate
    if (rand(1, 100) <= 99) {
        return [
            'success' => true,
            'transaction_id' => 'EW_' . time() . '_' . rand(1000, 9999),
            'amount' => $amount,
            'method' => 'e_wallet',
            'wallet_type' => $wallet_data['type'],
            'message' => 'E-wallet payment successful'
        ];
    } else {
        return [
            'success' => false,
            'error' => 'Insufficient wallet balance'
        ];
    }
}

// --- Main Payment Processing Logic ---
try {
    $job_id = (int)$data->job_id;
    $payment_method = htmlspecialchars(strip_tags($data->payment_method));
    $amount = (float)$data->amount;
    
    // Validate job exists and get payment amount
    $stmt_job = $db->prepare("SELECT payment_amount, payment_status FROM jobs WHERE id = :job_id");
    $stmt_job->bindParam(':job_id', $job_id);
    $stmt_job->execute();
    $job = $stmt_job->fetch(PDO::FETCH_ASSOC);
    
    if (!$job) {
        http_response_code(404);
        echo json_encode(["message" => "Job not found."]);
        exit();
    }
    
    if ($job['payment_status'] === 'paid') {
        http_response_code(400);
        echo json_encode(["message" => "Payment already completed for this job."]);
        exit();
    }
    
    // Process payment based on method
    $payment_result = null;
    
    switch ($payment_method) {
        case 'credit_card':
            if (!isset($data->card_number) || !isset($data->expiry_month) || !isset($data->expiry_year) || !isset($data->cvv)) {
                http_response_code(400);
                echo json_encode(["message" => "Credit card details required."]);
                exit();
            }
            
            $card_data = [
                'number' => $data->card_number,
                'expiry_month' => $data->expiry_month,
                'expiry_year' => $data->expiry_year,
                'cvv' => $data->cvv
            ];
            $payment_result = processFakeCreditCardPayment($card_data, $amount);
            break;
        case 'bank_transfer':
            if (!isset($data->bank_name) || !isset($data->account_number)) {
                http_response_code(400);
                echo json_encode(["message" => "Bank details required."]);
                exit();
            }
            
            $bank_data = [
                'bank_name' => $data->bank_name,
                'account_number' => $data->account_number
            ];
            $payment_result = processFakeBankTransfer($bank_data, $amount);
            break;
        case 'e_wallet':
            if (!isset($data->wallet_type) || !isset($data->wallet_id)) {
                http_response_code(400);
                echo json_encode(["message" => "E-wallet details required."]);
                exit();
            }
            
            $wallet_data = [
                'type' => $data->wallet_type,
                'id' => $data->wallet_id
            ];
            $payment_result = processFakeEWallet($wallet_data, $amount);
            break;
        default:
            http_response_code(400);
            echo json_encode(["message" => "Invalid payment method."]);
            exit();
    }
    
    if ($payment_result['success']) {
        // Update job payment status
        $stmt_update = $db->prepare("UPDATE jobs SET payment_status = 'paid', payment_method = :payment_method WHERE id = :job_id");
        $stmt_update->bindParam(':payment_method', $payment_method);
        $stmt_update->bindParam(':job_id', $job_id);
        $stmt_update->execute();
        
        // Create payment record
        $stmt_payment = $db->prepare("
            INSERT INTO payments (job_id, amount, payment_method, transaction_id, status, created_at) 
            VALUES (:job_id, :amount, :payment_method, :transaction_id, 'completed', NOW())
        ");
        $stmt_payment->bindParam(':job_id', $job_id);
        $stmt_payment->bindParam(':amount', $amount);
        $stmt_payment->bindParam(':payment_method', $payment_method);
        $stmt_payment->bindParam(':transaction_id', $payment_result['transaction_id']);
        $stmt_payment->execute();
        
        http_response_code(200);
        echo json_encode([
            "message" => "Payment processed successfully.",
            "transaction_id" => $payment_result['transaction_id'],
            "amount" => $amount,
            "method" => $payment_method,
            "status" => "completed",
            "details" => $payment_result
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            "message" => "Payment failed: " . $payment_result['error'],
            "status" => "failed",
            "details" => $payment_result
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(503);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Payment processing error: " . $e->getMessage()]);
}
?> 