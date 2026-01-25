// FILE: src/components/PasswordStrengthMeter.js
// =====================================================
// Password strength meter component with visual feedback

import React from 'react';
import { 
    calculatePasswordStrength, 
    getPasswordStrengthLevel, 
    getPasswordRequirementStatus,
    getPasswordRequirements 
} from '../utils/passwordValidator';

function PasswordStrengthMeter({ password, showRequirements = true, className = "" }) {
    const strengthScore = calculatePasswordStrength(password);
    const strengthLevel = getPasswordStrengthLevel(strengthScore);
    const requirements = getPasswordRequirementStatus(password);
    const requirementsList = getPasswordRequirements();

    const requirementItems = [
        { key: 'length', text: requirementsList[0], met: requirements.length },
        { key: 'uppercase', text: requirementsList[1], met: requirements.uppercase },
        { key: 'lowercase', text: requirementsList[2], met: requirements.lowercase },
        { key: 'number', text: requirementsList[3], met: requirements.number },
        { key: 'special', text: requirementsList[4], met: requirements.special },
        { key: 'noWeakPatterns', text: requirementsList[5], met: requirements.noWeakPatterns }
    ];

    if (!password) {
        return showRequirements ? (
            <div className={`mt-2 ${className}`}>
                <div className="text-sm text-gray-600 mb-2">Password Requirements:</div>
                <ul className="text-xs space-y-1">
                    {requirementsList.map((req, index) => (
                        <li key={index} className="flex items-center text-gray-500">
                            <svg className="w-3 h-3 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {req}
                        </li>
                    ))}
                </ul>
            </div>
        ) : null;
    }

    return (
        <div className={`mt-2 ${className}`}>
            {/* Strength Meter Bar */}
            <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Password Strength</span>
                    <span 
                        className="text-xs font-semibold px-2 py-1 rounded"
                        style={{ 
                            color: strengthLevel.color,
                            backgroundColor: strengthLevel.bgColor
                        }}
                    >
                        {strengthLevel.text}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="h-2 rounded-full transition-all duration-300 ease-in-out"
                        style={{ 
                            width: `${strengthScore}%`,
                            backgroundColor: strengthLevel.color
                        }}
                    />
                </div>
            </div>

            {/* Requirements List */}
            {showRequirements && (
                <div>
                    <div className="text-sm text-gray-600 mb-2">Requirements:</div>
                    <ul className="text-xs space-y-1">
                        {requirementItems.map((item) => (
                            <li key={item.key} className="flex items-center">
                                {item.met ? (
                                    <svg className="w-3 h-3 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-3 h-3 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className={item.met ? 'text-green-700' : 'text-red-500'}>
                                    {item.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default PasswordStrengthMeter;