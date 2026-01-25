// FILE: src/utils/emailValidator.js
// =====================================================
// University email validation utilities

// List of common university email domains
const UNIVERSITY_DOMAINS = [
    // US Universities
    'edu',
    'ac.uk',
    'edu.au',
    'edu.ca',
    'ac.nz',
    'edu.sg',
    'ac.in',
    'edu.my',
    'ac.za',
    'edu.ph',
    'ac.th',
    'edu.tw',
    'ac.jp',
    'edu.cn',
    'ac.kr',
    'edu.hk',
    'ac.id',
    'edu.vn',
    'ac.bd',
    'edu.pk',
    'ac.lk',
    'edu.np',
    'ac.mm',
    'edu.kh',
    'ac.la',
    'edu.bn',
    'ac.mv',
    'edu.bt',
    'ac.af',
    // Additional common university domains
    'student.edu',
    'alumni.edu',
    'mail.edu',
    'university.edu',
    'college.edu',
    'school.edu',
    // Specific university domains (add more as needed)
    'std.uwu.ac.lk' // University of Uva Wellassa
];

// More specific university domain patterns
const UNIVERSITY_PATTERNS = [
    /\.edu$/i,
    /\.ac\.[a-z]{2,3}$/i,
    /\.edu\.[a-z]{2,3}$/i,
    /university\./i,
    /college\./i,
    /school\./i,
    /student\./i,
    /alumni\./i
];

/**
 * Validates if an email is from a university domain
 * @param {string} email - The email to validate
 * @returns {object} - Validation result with valid boolean and error message
 */
export function validateUniversityEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
    }

    const emailLower = email.toLowerCase().trim();
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
        return { 
            valid: false, 
            error: 'Please enter a valid email format' 
        };
    }

    const domain = emailLower.split('@')[1];
    
    // Check against known university domains
    const isUniversityEmail = UNIVERSITY_DOMAINS.some(uniDomain => domain.endsWith(uniDomain)) ||
                             UNIVERSITY_PATTERNS.some(pattern => pattern.test(domain));

    if (!isUniversityEmail) {
        return { 
            valid: false, 
            error: 'Please use a university email address (e.g., .edu, .ac.uk, etc.)' 
        };
    }

    return { valid: true, error: null };
}

/**
 * Validates basic email format (for publishers or general use)
 * @param {string} email - The email to validate
 * @returns {object} - Validation result with valid boolean and error message
 */
export function validateBasicEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valid: null, error: null };
    }

    const emailLower = email.toLowerCase().trim();
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
        return { 
            valid: false, 
            error: 'Please enter a valid email format' 
        };
    }

    return { valid: true, error: null };
}

/**
 * Validates email for UI display with detailed feedback
 * @param {string} email - The email to validate
 * @returns {object} - Validation result with valid boolean and error message
 */
export function validateEmailForUI(email) {
    if (!email || typeof email !== 'string') {
        return { valid: null, error: null };
    }

    const emailLower = email.toLowerCase().trim();
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
        return { 
            valid: false, 
            error: 'Please enter a valid email format (e.g., user@university.edu)' 
        };
    }

    const domain = emailLower.split('@')[1];
    
    // Check if it's a university email
    const isUniversityEmail = UNIVERSITY_DOMAINS.some(uniDomain => domain.endsWith(uniDomain)) ||
                             UNIVERSITY_PATTERNS.some(pattern => pattern.test(domain));

    if (!isUniversityEmail) {
        return { 
            valid: false, 
            error: 'Please use a university email address (e.g., .edu, .ac.uk, etc.)' 
        };
    }

    return { valid: true, error: null };
}

/**
 * Gets an example email for the user's reference
 * @returns {string} - Example university email
 */
export function getExampleEmail() {
    const examples = [
        'john.doe@university.edu',
        'student@college.ac.uk',
        'jane.smith@school.edu.au',
        'user@institute.edu.ca',
        'example@academy.ac.nz'
    ];
    
    return examples[Math.floor(Math.random() * examples.length)];
}

/**
 * Gets the domain from an email address
 * @param {string} email - The email address
 * @returns {string} - The domain part of the email
 */
export function getEmailDomain(email) {
    if (!email || typeof email !== 'string') {
        return '';
    }
    
    const parts = email.toLowerCase().trim().split('@');
    return parts.length === 2 ? parts[1] : '';
}

/**
 * Checks if a domain is a known university domain
 * @param {string} domain - The domain to check
 * @returns {boolean} - True if it's a university domain
 */
export function isUniversityDomain(domain) {
    if (!domain || typeof domain !== 'string') {
        return false;
    }

    const domainLower = domain.toLowerCase().trim();
    
    return UNIVERSITY_DOMAINS.some(uniDomain => domainLower.endsWith(uniDomain)) ||
           UNIVERSITY_PATTERNS.some(pattern => pattern.test(domainLower));
}
