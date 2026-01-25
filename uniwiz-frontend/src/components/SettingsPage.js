// FILE: src/components/SettingsPage.js (ENHANCED with Modern UI/UX and Functionality)
// ===============================================
// This component provides a functional and well-designed interface for application settings,
// including password change and account deletion with confirmation modals.

import React, { useState, useEffect } from 'react';
import { validatePasswordStrength } from '../utils/passwordValidator';
import PasswordStrengthMeter from './PasswordStrengthMeter';

// --- Notification: Shows a temporary message at the top right ---
const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const typeClasses = { success: "bg-green-500", error: "bg-red-500" };
    return (
        <div className={`fixed top-20 right-5 p-4 rounded-lg shadow-xl text-white z-50 transition-all ${typeClasses[type] || 'bg-gray-800'}`}>
            {message}
        </div>
    );
};

// --- ConfirmationModal: Modal for confirming sensitive actions (password, delete) ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, children, confirmText = 'Confirm', confirmColor = 'red', isLoading = false }) => {
    if (!isOpen) return null;

    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700',
        blue: 'bg-primary-main hover:bg-primary-dark',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
                <div className="mt-4">{children}</div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={onConfirm} disabled={isLoading} className={`px-4 py-2 text-white rounded-lg transition-colors disabled:bg-gray-400 ${colorClasses[confirmColor]}`}>
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main SettingsPage component ---
function SettingsPage({ user, onLogout }) {
    // --- State for notifications and modals ---
    const [notification, setNotification] = useState({ message: '', type: '', key: 0 });
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    // --- State for password change form ---
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // --- State for delete confirmation ---
    const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // --- Show notification message ---
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, key: Date.now() });
    };
    
    // --- Handle password update ---
    const handleUpdatePassword = async () => {
        if (!user || !user.id) {
            showNotification("User data is not available. Please try again.", "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification("New passwords do not match.", "error");
            return;
        }
        
        // Validate password strength
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            showNotification("Password does not meet security requirements. Please check the requirements below.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('http://uniwiz-backend.test/api/update_account_settings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_password',
                    user_id: user.id,
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                // Handle specific password validation errors from backend
                if (result.password_errors && result.password_errors.length > 0) {
                    showNotification(`Password validation failed: ${result.password_errors.join(', ')}`, 'error');
                } else {
                    throw new Error(result.message);
                }
                return;
            }
            
            showNotification(result.message, 'success');
            setPasswordModalOpen(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handle account deletion ---
    const handleDeleteAccount = async () => {
        if (!user || !user.id) {
            showNotification("User data is not available. Please try again.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('http://uniwiz-backend.test/api/update_account_settings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_account',
                    user_id: user.id,
                    password: deleteConfirmPassword,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            showNotification(result.message, 'success');
            setDeleteModalOpen(false);
            
            setTimeout(() => {
                if(onLogout) onLogout();
            }, 2000);

        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Show error if user is not loaded ---
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
                <div className="text-center text-red-500">
                    <h2 className="text-xl font-bold">Error</h2>
                    <p>Could not load settings because user data is missing.</p>
                </div>
            </div>
        );
    }

    // --- Main Render: Settings page layout ---
    return (
        <>
            {notification.message && (
                <Notification 
                    key={notification.key}
                    message={notification.message} 
                    type={notification.type}
                    onClose={() => setNotification({ message: '', type: '', key: 0 })}
                />
            )}
            
            <ConfirmationModal
                isOpen={isPasswordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
                onConfirm={handleUpdatePassword}
                title="Change Your Password"
                message="Enter your current and new password below."
                confirmText="Update Password"
                confirmColor="blue"
                isLoading={isLoading}
            >
                <div className="space-y-4">
                    <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full border rounded-md p-2" />
                    <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border rounded-md p-2" />
                    <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full border rounded-md p-2" />
                    {/* Password Strength Meter */}
                    <PasswordStrengthMeter 
                        password={newPassword} 
                        showRequirements={true}
                        className="mt-2"
                    />
                </div>
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Your Account"
                message="This action is irreversible. All your data will be permanently deleted. Please enter your password to confirm."
                confirmText="Delete Account"
                confirmColor="red"
                isLoading={isLoading}
            >
                <input type="password" placeholder="Enter your password to confirm" value={deleteConfirmPassword} onChange={e => setDeleteConfirmPassword(e.target.value)} className="w-full border rounded-md p-2" />
            </ConfirmationModal>

            <div className="min-h-screen bg-gray-50 flex justify-center items-start py-12 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-bold text-primary-dark">Application Settings</h2>
                        <p className="text-gray-500 mt-2">Manage your preferences and application configurations.</p>
                    </div>
                    
                    <div className="space-y-8">
                        <div className="p-6 border rounded-xl">
                            <h3 className="text-xl font-semibold text-primary-dark mb-4 border-b pb-2">Account Security</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">Change Password</label>
                                    <button onClick={() => setPasswordModalOpen(true)} className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition duration-300">
                                        Update Password
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">Delete Account</label>
                                    <button onClick={() => setDeleteModalOpen(true)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 transition duration-300">
                                        Delete My Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SettingsPage;