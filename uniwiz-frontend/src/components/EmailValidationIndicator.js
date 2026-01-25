// FILE: src/components/EmailValidationIndicator.js
// =====================================================
// Email validation indicator component

import React from 'react';
import { validateUniversityEmail, validateBasicEmail } from '../utils/emailValidator';

function EmailValidationIndicator({ email, className = "", show = true, role = "student" }) {
    if (!show) {
        return null;
    }
    
    // For students, validate university email; for publishers, just basic email format
    const validation = role === 'student' ? validateUniversityEmail(email) : validateBasicEmail(email);

    if (!email) {
        return (
            <div className={`mt-2 ${className}`}>
                <div className="text-sm text-gray-600 mb-1">
                    {role === 'student' ? 'University Email Required' : 'Business Email Required'}
                </div>
            </div>
        );
    }

    if (validation.valid === null) {
        return null;
    }

    return (
        <div className={`mt-2 ${className}`}>
            {validation.valid ? (
                <div className="flex items-center text-green-700 text-sm">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    ✅ Valid email
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center text-red-700 text-sm">
                        <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {validation.error}
                    </div>
                </div>
            )}
        </div>
    );
}

export default EmailValidationIndicator;