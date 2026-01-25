// FILE: src/components/ResetPasswordPage.js 
// =============================================
// Reset password page for users who clicked the reset link

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { validatePasswordStrength } from '../utils/passwordValidator';
import PasswordStrengthMeter from './PasswordStrengthMeter';

function ResetPasswordPage({ setPage }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link. Please request a new password reset.');
        }
    }, [token]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }
        
        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            setError('Password does not meet security requirements. Please check the requirements below.');
            setIsLoading(false);
            return;
        }        try {
            const response = await fetch('http://uniwiz-backend.test/api/reset_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    token: token,
                    password: password 
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle specific password validation errors from backend
                if (result.password_errors && result.password_errors.length > 0) {
                    setError(`Password validation failed: ${result.password_errors.join(', ')}`);
                } else {
                    throw new Error(result.error || result.message || 'Failed to reset password.');
                }
                return;
            }
            
            setSuccess(true);
            setPassword('');
            setConfirmPassword('');

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        setPage('login');
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full space-y-8"
                >
                    <div className="text-center">
                        <img 
                            src="/logo.png" 
                            alt="UniWiz Logo" 
                            className="h-16 mx-auto mb-4" 
                        />
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
                        <p className="text-gray-600 mb-6">The password reset link is invalid or has expired.</p>
                        <button 
                            onClick={handleBackToLogin}
                            className="w-full bg-gradient-to-r from-primary-main to-primary-dark hover:from-primary-dark hover:to-primary-main text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300"
                        >
                            Back to Login
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full space-y-8"
                >
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Password Reset Successfully!</h2>
                        <p className="text-gray-600 mb-6">Your password has been updated. You can now sign in with your new password.</p>
                        <button 
                            onClick={handleBackToLogin}
                            className="w-full bg-gradient-to-r from-primary-main to-primary-dark hover:from-primary-dark hover:to-primary-main text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300"
                        >
                            Sign In
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white overflow-hidden">
            {/* Left Section - Branding */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary-dark to-primary-darker p-8"
            >
                <motion.div 
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="text-white text-center"
                >
                    <img 
                        src="/logo.png" 
                        alt="UniWiz Logo" 
                        className="h-24 mx-auto mb-8 hover:scale-105 transition-transform duration-300" 
                    />
                    <motion.h1 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: 0.2 } }}
                        className="text-5xl font-bold leading-tight mb-6"
                    >
                        Reset Your Password
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: 0.4 } }}
                        className="text-xl opacity-90 max-w-lg mx-auto"
                    >
                        Create a new secure password for your UniWiz account.
                    </motion.p>
                </motion.div>
            </motion.div>

            {/* Right Section - Reset Form */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-8 sm:p-12 lg:p-16 overflow-y-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
                >
                    <div className="mb-8 text-center">
                        <img 
                            src="/logo.png" 
                            alt="UniWiz Logo" 
                            className="h-16 mx-auto mb-4 lg:hidden" 
                        />
                        <motion.h2 
                            whileHover={{ scale: 1.02 }}
                            className="text-3xl font-bold text-gray-900 mb-2"
                        >
                            Set New Password
                        </motion.h2>
                        <p className="text-gray-600">
                            Enter your new password below
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start"
                        >
                            <svg className="h-5 w-5 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-1"
                        >
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
                            <div className="relative">
                                <input 
                                    id="password" 
                                    type={showPassword ? 'text' : 'password'} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 text-gray-900 placeholder-gray-400 focus:ring-primary-main focus:border-primary-main focus:outline-none focus:ring-2 pr-10" 
                                    placeholder="Enter new password"
                                    required 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {showPassword ? (
                                            <>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </>
                                        ) : (
                                            <>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                            {/* Password Strength Meter */}
                            <PasswordStrengthMeter 
                                password={password} 
                                showRequirements={true}
                                className="mt-2"
                            />
                        </motion.div>

                        {/* Confirm Password */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-1"
                        >
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                            <div className="relative">
                                <input 
                                    id="confirmPassword" 
                                    type={showConfirmPassword ? 'text' : 'password'} 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 text-gray-900 placeholder-gray-400 focus:ring-primary-main focus:border-primary-main focus:outline-none focus:ring-2 pr-10" 
                                    placeholder="Confirm new password"
                                    required 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {showConfirmPassword ? (
                                            <>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </>
                                        ) : (
                                            <>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-primary-main to-primary-dark hover:from-primary-dark hover:to-primary-main text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Resetting Password...
                                </span>
                            ) : 'Reset Password'}
                        </motion.button>
                    </form>

                    {/* Back to Login */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-8 text-center text-gray-600"
                    >
                        Remember your password?{' '}
                        <button 
                            onClick={handleBackToLogin}
                            className="font-semibold text-primary-main hover:text-primary-dark focus:outline-none"
                        >
                            Back to Sign In
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

export default ResetPasswordPage; 