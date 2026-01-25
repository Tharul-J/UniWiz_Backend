// FILE: src/utils/passwordValidator.js
// =====================================================
// Password validation utilities for frontend

/**
 * Validates password strength on the frontend
 * @param {string} password The password to validate
 * @returns {object} Validation result with errors and strength info
 */
export function validatePasswordStrength(password) {
    const errors = [];
    let valid = true;

    // Check minimum length (8 characters)
    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
        valid = false;
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter (A-Z)");
        valid = false;
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter (a-z)");
        valid = false;
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number (0-9)");
        valid = false;
    }

    // Check for at least one special character
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)");
        valid = false;
    }

    // Check maximum length
    if (password.length > 128) {
        errors.push("Password must not exceed 128 characters");
        valid = false;
    }

    // Check for weak patterns
    const weakPatterns = [
        /(.)\1{2,}/, // 3 or more consecutive identical characters
        /123456|654321|password|qwerty|admin|letmein/i, // Common weak passwords
        /^[a-z]+$/i, // Only letters
        /^[0-9]+$/, // Only numbers
    ];

    for (const pattern of weakPatterns) {
        if (pattern.test(password)) {
            errors.push("Password contains weak patterns. Please use a stronger combination");
            valid = false;
            break;
        }
    }

    return {
        valid,
        errors,
        strengthScore: calculatePasswordStrength(password)
    };
}

/**
 * Calculate password strength score (0-100)
 * @param {string} password
 * @returns {number} Strength score
 */
export function calculatePasswordStrength(password) {
    let score = 0;
    const length = password.length;

    // Length scoring
    if (length >= 8) score += 20;
    if (length >= 12) score += 10;
    if (length >= 16) score += 10;

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;

    // Bonus for good patterns
    if (/[A-Z].*[0-9]|[0-9].*[A-Z]/.test(password)) score += 5; // Mixed case and numbers
    if (/[^A-Za-z0-9].*[A-Za-z0-9]|[A-Za-z0-9].*[^A-Za-z0-9]/.test(password)) score += 5; // Special chars mixed

    return Math.min(score, 100);
}

/**
 * Get password strength level information
 * @param {number} score
 * @returns {object} Level information
 */
export function getPasswordStrengthLevel(score) {
    if (score < 30) {
        return { level: 'very-weak', text: 'Very Weak', color: '#dc2626', bgColor: '#fee2e2' };
    } else if (score < 50) {
        return { level: 'weak', text: 'Weak', color: '#ea580c', bgColor: '#fed7aa' };
    } else if (score < 70) {
        return { level: 'fair', text: 'Fair', color: '#ca8a04', bgColor: '#fef3c7' };
    } else if (score < 85) {
        return { level: 'good', text: 'Good', color: '#16a34a', bgColor: '#dcfce7' };
    } else {
        return { level: 'strong', text: 'Strong', color: '#059669', bgColor: '#d1fae5' };
    }
}

/**
 * Get password requirements list
 * @returns {array} Array of requirement strings
 */
export function getPasswordRequirements() {
    return [
        'At least 8 characters long',
        'Contains at least one uppercase letter (A-Z)',
        'Contains at least one lowercase letter (a-z)',
        'Contains at least one number (0-9)',
        'Contains at least one special character (!@#$%^&*)',
        'Avoid common patterns like "123456" or "password"'
    ];
}

/**
 * Get requirement validation status for each requirement
 * @param {string} password
 * @returns {object} Object with requirement status
 */
export function getPasswordRequirementStatus(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
        noWeakPatterns: !/(.)\1{2,}|123456|654321|password|qwerty|admin|letmein|^[a-z]+$|^[0-9]+$/i.test(password)
    };
}