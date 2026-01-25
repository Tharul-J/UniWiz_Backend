<?php
// FILE: uniwiz-backend/api/auth.php
// ======================================================================
// This endpoint handles user authentication and registration, including email verification and admin notifications.

// For debugging purposes ONLY. Remove these lines in a live environment.
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Include Composer's autoloader for PHPMailer ---
require __DIR__ . '/../vendor/autoload.php';
include_once '../config/database.php';
include_once 'password_validator.php';
include_once 'email_validator.php';

// --- Use PHPMailer classes ---
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$database = new Database();
$db = $database->getConnection();

// Check if database connection is successful
if ($db === null) {
    http_response_code(503); 
    echo json_encode(["message" => "Database connection failed. Check your config/database.php credentials."]);
    exit(); 
}

// --- Get Posted Data ---
$data = json_decode(file_get_contents("php://input"));

if ($data === null || !isset($data->action)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid request. Action not specified."]);
    exit();
}

// --- Function to fetch full user profile ---
function getFullUserProfile($db, $user_id) {
    $query = "
        SELECT 
            u.id, u.email, u.first_name, u.last_name, u.role, u.company_name, u.profile_image_url, u.is_verified, u.status,
            sp.university_name, sp.field_of_study, sp.year_of_study, sp.languages_spoken, sp.preferred_categories, sp.skills, sp.cv_url,
            pp.about, pp.industry, pp.website_url, pp.address, pp.phone_number, pp.facebook_url, pp.linkedin_url, pp.instagram_url
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN publisher_profiles pp ON u.id = pp.user_id
        WHERE u.id = :id
    ";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// --- Function to create a notification for all admins ---
function createAdminNotification($db, $type, $message, $link) {
    $stmt_admins = $db->prepare("SELECT id FROM users WHERE role = 'admin'");
    $stmt_admins->execute();
    $admin_ids = $stmt_admins->fetchAll(PDO::FETCH_COLUMN, 0);

    if (empty($admin_ids)) return;

    $query_notif = "INSERT INTO notifications (user_id, type, message, link) VALUES (:user_id, :type, :message, :link)";
    $stmt_notif = $db->prepare($query_notif);

    foreach ($admin_ids as $admin_id) {
        $stmt_notif->bindParam(':user_id', $admin_id, PDO::PARAM_INT);
        $stmt_notif->bindParam(':type', $type);
        $stmt_notif->bindParam(':message', $message);
        $stmt_notif->bindParam(':link', $link);
        $stmt_notif->execute();
    }
}

// --- ACTION ROUTER ---
if ($data->action === 'register') {
    // --- Registration Logic ---
    if (!isset($data->email) || !isset($data->password) || !isset($data->role)) {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data for registration."]);
        exit();
    }

    // Validate university email domain (only for students)
    if ($data->role === 'student') {
        $emailValidation = validateUniversityEmail($data->email);
        if (!$emailValidation['valid']) {
            http_response_code(400);
            echo json_encode([
                "message" => $emailValidation['error'],
                "email_requirement" => getEmailRequirementMessage(),
                "required_domain" => getRequiredEmailDomain()
            ]);
            exit();
        }
    } else {
        // For publishers, just validate basic email format
        if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode([
                "message" => "Please enter a valid email address"
            ]);
            exit();
        }
    }

    // Validate password strength
    $passwordValidation = validatePasswordStrength($data->password);
    if (!$passwordValidation['valid']) {
        http_response_code(400);
        echo json_encode([
            "message" => "Password does not meet security requirements",
            "password_errors" => $passwordValidation['errors'],
            "requirements" => getPasswordRequirements()
        ]);
        exit();
    }

    try {
        // Check if email already exists
        $query = "SELECT id FROM users WHERE email = :email";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $data->email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            http_response_code(400); 
            echo json_encode(["message" => "This email is already registered."]);
        } else {
            $firstName = isset($data->first_name) ? htmlspecialchars(strip_tags($data->first_name)) : '';
            $lastName = isset($data->last_name) ? htmlspecialchars(strip_tags($data->last_name)) : '';
            $companyName = isset($data->company_name) ? htmlspecialchars(strip_tags($data->company_name)) : '';
            $role = htmlspecialchars(strip_tags($data->role));

            if ($role !== 'student' && $role !== 'publisher') {
                http_response_code(400);
                echo json_encode(["message" => "Invalid role specified."]);
                exit();
            }

            // Insert new user
            $query = "INSERT INTO users (email, password, first_name, last_name, company_name, role, email_verification_token) VALUES (:email, :password, :first_name, :last_name, :company_name, :role, :token)";
            $stmt = $db->prepare($query);

            $email = htmlspecialchars(strip_tags($data->email));
            $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
            $verification_token = bin2hex(random_bytes(50));
            
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':password', $password_hash);
            $stmt->bindParam(':first_name', $firstName);
            $stmt->bindParam(':last_name', $lastName);
            $stmt->bindParam(':company_name', $companyName);
            $stmt->bindParam(':role', $role);
            $stmt->bindParam(':token', $verification_token);

            if ($stmt->execute()) {
                $new_user_id = $db->lastInsertId();

                // Create profile for student or publisher
                if ($role === 'student') {
                    $stmt_student_profile = $db->prepare("INSERT INTO student_profiles (user_id) VALUES (:user_id)");
                    $stmt_student_profile->bindParam(':user_id', $new_user_id, PDO::PARAM_INT);
                    $stmt_student_profile->execute();
                } elseif ($role === 'publisher') {
                    $stmt_publisher_profile = $db->prepare("INSERT INTO publisher_profiles (user_id) VALUES (:user_id)");
                    $stmt_publisher_profile->bindParam(':user_id', $new_user_id, PDO::PARAM_INT);
                    $stmt_publisher_profile->execute();
                }

                // Notify all admins about new registration
                $notif_type = 'new_user_registered';
                $notif_message = "A new user has registered: " . ($role === 'student' ? "$firstName $lastName" : $companyName) . " ($role)";
                $notif_link = "/user-management"; // Or relevant admin page
                createAdminNotification($db, $notif_type, $notif_message, $notif_link);

                // Send verification email
                $mail = new PHPMailer(true);
                try {
                    // SMTP Configuration with fallback values
                    $smtp_host = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
                    $smtp_port = $_ENV['SMTP_PORT'] ?? 587;
                    $smtp_user = $_ENV['SMTP_USER'] ?? 'uniwiz22@gmail.com';
                    $smtp_pass = $_ENV['SMTP_PASS'] ?? 'your_app_password_here';
                    
                    if (empty($smtp_pass) || $smtp_pass === 'your_app_password_here') {
                        error_log("SMTP password not configured. Please set SMTP_PASS in .env file.");
                        // Continue with registration even if email fails
                    } else {
                        $mail->isSMTP();
                        $mail->Host       = $smtp_host;
                        $mail->SMTPAuth   = true;
                        $mail->Username   = $smtp_user;
                        $mail->Password   = $smtp_pass;
                        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                        $mail->Port       = $smtp_port;

                        $mail->setFrom('uniwiz22@gmail.com', 'UniWiz');
                        $mail->addAddress($email);
                        $mail->isHTML(true);
                        $mail->Subject = 'Verify Your Email Address for UniWiz';
                        
                        // Verification link
                        $verification_link = 'http://uniwiz-backend.test/api/verify_email.php?token=' . $verification_token;
                        
                        $mail->Body    = "<h2>Welcome to UniWiz!</h2><p>Thank you for registering. Please click the link below to verify your email address:</p><p><a href='{$verification_link}' style='padding: 10px 15px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;'>Verify My Email</a></p><p>If you did not create an account, no further action is required.</p>";
                        $mail->send();
                        error_log("Verification email sent successfully to: " . $email);
                    }
                } catch (Exception $e) {
                    error_log("Mailer Error: {$mail->ErrorInfo}");
                    error_log("Failed to send verification email to: " . $email);
                }

                $new_user = getFullUserProfile($db, $new_user_id);
                http_response_code(201);
                echo json_encode([
                    "message" => "Registration successful! Please check your email to verify your account.",
                    "user" => $new_user 
                ]);
            } else {
                throw new Exception("Failed to execute statement.");
            }
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "An unexpected server error occurred: " . $e->getMessage()]);
    }

} elseif ($data->action === 'magic_login') {
    // --- Magic Link Login (HMAC stateless token) ---
    if (!isset($data->token)) {
        http_response_code(400);
        echo json_encode(["message" => "Token is required for magic login."]);
        exit();
    }

    try {
        $secret = $_ENV['MAGIC_SECRET'] ?? 'change_me_in_env';
        $raw = base64_decode(strtr($data->token, '-_', '+/'));
        if (!$raw) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid token format."]);
            exit();
        }
        $parts = explode('|', $raw);
        if (count($parts) !== 3) {
            http_response_code(400);
            echo json_encode(["message" => "Malformed token."]);
            exit();
        }

        list($user_id, $issued_at, $sig) = $parts;
        $expected = hash_hmac('sha256', $user_id . '|' . $issued_at, $secret);
        if (!hash_equals($expected, $sig)) {
            http_response_code(401);
            echo json_encode(["message" => "Invalid token signature."]);
            exit();
        }

        // Expire after 15 minutes
        if (time() - (int)$issued_at > 900) {
            http_response_code(401);
            echo json_encode(["message" => "Token expired. Please log in manually."]);
            exit();
        }

        // Load user and ensure not blocked and email verified
        $stmt = $db->prepare("SELECT id, role, status, email_verified_at FROM users WHERE id = :id");
        $stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["message" => "User not found."]);
            exit();
        }
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row['status'] === 'blocked') {
            http_response_code(403);
            echo json_encode(["message" => "Your account has been blocked by the administrator."]);
            exit();
        }
        // Email verification not required for magic login

        $full_user_profile = getFullUserProfile($db, $row['id']);
        http_response_code(200);
        echo json_encode(["message" => "Login successful.", "user" => $full_user_profile]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "An unexpected server error occurred: " . $e->getMessage()]);
    }

} elseif ($data->action === 'login') {
    // --- Login Logic ---
    if (!isset($data->email) || !isset($data->password)) {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data for login."]);
        exit();
    }
    try {
        $query = "SELECT id, email, password, role, status, email_verified_at FROM users WHERE email = :email";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $data->email);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Check if account is blocked
            if ($row['status'] === 'blocked') {
                http_response_code(403);
                echo json_encode(["message" => "Your account has been blocked by the administrator."]);
                exit();
            }

            // Email verification not required for normal login

            // Verify password
            if (password_verify($data->password, $row['password'])) {
                $full_user_profile = getFullUserProfile($db, $row['id']);
                http_response_code(200);
                echo json_encode(["message" => "Login successful.", "user" => $full_user_profile]);
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Invalid email or password."]);
            }
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Invalid email or password."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "An unexpected server error occurred: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Invalid action specified."]);
}
?>