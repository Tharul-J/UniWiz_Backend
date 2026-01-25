<?php
// FILE: uniwiz-backend/api/password_validator.php
// =====================================================
// Password validation utility functions for strong password requirements

/**
 * Validates password strength based on comprehensive criteria
 * @param string $password The password to validate
 * @return array Returns array with 'valid' boolean and 'errors' array
 */
function validatePasswordStrength($password) {
    $errors = [];
    $valid = true;

    // Check minimum length (8 characters)
    if (strlen($password) < 8) {
        $errors[] = "Password must be at least 8 characters long";
        $valid = false;
    }

    // Check for at least one uppercase letter
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = "Password must contain at least one uppercase letter (A-Z)";
        $valid = false;
    }

    // Check for at least one lowercase letter
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = "Password must contain at least one lowercase letter (a-z)";
        $valid = false;
    }

    // Check for at least one number
    if (!preg_match('/[0-9]/', $password)) {
        $errors[] = "Password must contain at least one number (0-9)";
        $valid = false;
    }

    // Check for at least one special character
    if (!preg_match('/[^A-Za-z0-9]/', $password)) {
        $errors[] = "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)";
        $valid = false;
    }

    // Check maximum length (prevent extremely long passwords)
    if (strlen($password) > 128) {
        $errors[] = "Password must not exceed 128 characters";
        $valid = false;
    }

    // Check for common weak patterns
    $weakPatterns = [
        '/(.)\1{2,}/', // 3 or more consecutive identical characters
        '/123456|654321|password|qwerty|admin|letmein/i', // Common weak passwords
        '/^[a-z]+$/i', // Only letters
        '/^[0-9]+$/', // Only numbers
    ];

    foreach ($weakPatterns as $pattern) {
        if (preg_match($pattern, $password)) {
            $errors[] = "Password contains weak patterns. Please use a stronger combination";
            $valid = false;
            break;
        }
    }

    return [
        'valid' => $valid,
        'errors' => $errors,
        'strength_score' => calculatePasswordStrength($password)
    ];
}

/**
 * Calculate password strength score (0-100)
 * @param string $password
 * @return int Strength score
 */
function calculatePasswordStrength($password) {
    $score = 0;
    $length = strlen($password);

    // Length scoring
    if ($length >= 8) $score += 20;
    if ($length >= 12) $score += 10;
    if ($length >= 16) $score += 10;

    // Character variety scoring
    if (preg_match('/[a-z]/', $password)) $score += 15;
    if (preg_match('/[A-Z]/', $password)) $score += 15;
    if (preg_match('/[0-9]/', $password)) $score += 15;
    if (preg_match('/[^A-Za-z0-9]/', $password)) $score += 15;

    // Bonus for good patterns
    if (preg_match('/[A-Z].*[0-9]|[0-9].*[A-Z]/', $password)) $score += 5; // Mixed case and numbers
    if (preg_match('/[^A-Za-z0-9].*[A-Za-z0-9]|[A-Za-z0-9].*[^A-Za-z0-9]/', $password)) $score += 5; // Special chars mixed with alphanumeric

    return min($score, 100);
}

/**
 * Get password strength level text
 * @param int $score
 * @return array
 */
function getPasswordStrengthLevel($score) {
    if ($score < 30) {
        return ['level' => 'very-weak', 'text' => 'Very Weak', 'color' => '#dc2626'];
    } elseif ($score < 50) {
        return ['level' => 'weak', 'text' => 'Weak', 'color' => '#ea580c'];
    } elseif ($score < 70) {
        return ['level' => 'fair', 'text' => 'Fair', 'color' => '#ca8a04'];
    } elseif ($score < 85) {
        return ['level' => 'good', 'text' => 'Good', 'color' => '#16a34a'];
    } else {
        return ['level' => 'strong', 'text' => 'Strong', 'color' => '#059669'];
    }
}

/**
 * Generate password requirements text for user guidance
 * @return array
 */
function getPasswordRequirements() {
    return [
        'At least 8 characters long',
        'Contains at least one uppercase letter (A-Z)',
        'Contains at least one lowercase letter (a-z)',
        'Contains at least one number (0-9)',
        'Contains at least one special character (!@#$%^&*)',
        'Avoid common patterns like "123456" or "password"'
    ];
}
?>