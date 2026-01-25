<?php
// FILE: uniwiz-backend/api/email_validator.php
// =====================================================
// Email domain validation utility functions

/**
 * Validates if email domain is allowed for university registration
 * @param string $email The email address to validate
 * @return array Returns array with 'valid' boolean and 'error' message
 */
function validateUniversityEmail($email) {
    $allowedDomain = 'std.uwu.ac.lk';
    
    // Basic email format validation
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return [
            'valid' => false,
            'error' => 'Invalid email format'
        ];
    }
    
    // Extract domain from email
    $emailParts = explode('@', $email);
    if (count($emailParts) !== 2) {
        return [
            'valid' => false,
            'error' => 'Invalid email format'
        ];
    }
    
    $domain = strtolower(trim($emailParts[1]));
    
    // Check if domain matches the required university domain
    if ($domain !== $allowedDomain) {
        return [
            'valid' => false,
            'error' => 'Please use your university email address ending with @std.uwu.ac.lk'
        ];
    }
    
    // Additional validation for the local part (before @)
    $localPart = trim($emailParts[0]);
    if (empty($localPart)) {
        return [
            'valid' => false,
            'error' => 'Email address cannot be empty before @'
        ];
    }
    
    // Check for minimum length of local part (optional - adjust as needed)
    if (strlen($localPart) < 3) {
        return [
            'valid' => false,
            'error' => 'University email ID should be at least 3 characters before @'
        ];
    }
    
    return [
        'valid' => true,
        'error' => null
    ];
}

/**
 * Get the required email domain for display
 * @return string
 */
function getRequiredEmailDomain() {
    return 'std.uwu.ac.lk';
}

/**
 * Get helpful message about email requirements
 * @return string
 */
function getEmailRequirementMessage() {
    return 'Please use your university email address (example: your_id@std.uwu.ac.lk)';
}

/**
 * Check if email is from allowed domain (for existing users)
 * @param string $email
 * @return boolean
 */
function isUniversityEmail($email) {
    $validation = validateUniversityEmail($email);
    return $validation['valid'];
}
?>