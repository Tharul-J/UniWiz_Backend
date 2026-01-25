// FILE: src/components/ProfileSetup.js (FIXED - User ID is required error)
// ===============================================
// This component displays the form to complete user profile after registration.
// Modifications: Company name is auto-filled and a welcome tour-like experience has been added.
// FIXED: Added defensive checks for user prop and ensured user.id is always passed.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // Import Framer Motion for animations

// --- BackButton: Navigates back to sign up ---
const BackButton = ({ onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center text-gray-500 hover:text-gray-700 font-medium mb-6 transition-colors duration-200"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Sign Up
    </button>
);

// --- Main ProfileSetup component ---
function ProfileSetup({ user, onSetupComplete, onBackClick }) { // ADDED: onBackClick prop
    // --- State Management for Form Fields ---
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    // Only show company name field if the user is a publisher
    const [companyName, setCompanyName] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Initialize form data when the component mounts or user prop changes ---
    useEffect(() => {
        // FIXED: Only proceed if user object and user.id exist
        if (user && user.id) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            // Auto-fill company name if the user is a publisher
            if (user.role === 'publisher') {
                setCompanyName(user.company_name || '');
            }
        } else {
            // If user or user.id is missing, set an error or handle gracefully
            setError("User data is missing. Please log in again.");
            setIsLoading(false); // Ensure loading is off if there's an error
        }
    }, [user]); // Re-run this effect when the user prop changes

    // --- Form Submission Handler ---
    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        // FIXED: Ensure user and user.id are available before proceeding with submission
        if (!user || !user.id) {
            setError("User ID is missing. Please refresh the page or log in again.");
            setIsLoading(false);
            return;
        }

        // --- UPDATED: Use FormData instead of JSON.stringify ---
        const submissionData = new FormData();
        submissionData.append('user_id', user.id);
        submissionData.append('first_name', firstName);
        submissionData.append('last_name', lastName);

        if (user.role === 'publisher') {
            if (!companyName.trim()) {
                setError("Company Name is required for publishers.");
                setIsLoading(false);
                return;
            }
            submissionData.append('company_name', companyName);
        }
        // If you have other fields in ProfileSetup.js, append them here as well
        // e.g., submissionData.append('some_other_field', someOtherState);

        try {
            const apiUrl = 'http://uniwiz-backend.test/api/update_profile.php';
            const response = await fetch(apiUrl, {
                method: 'POST',
                // headers: { 'Content-Type': 'application/json' }, // REMOVED: FormData handles this
                body: submissionData, // Send FormData object directly
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update profile.');
            }

            // If update is successful, call the function passed from App.js
            // This will update the user in App.js state and redirect to the main page.
            onSetupComplete(result.user);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Show a loading state or error if user data is not yet available ---
    if (!user || !user.id) {
        return (
            <div className="min-h-screen bg-bg-student-dashboard flex justify-center items-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg text-center">
                    {error ? (
                        <p className="text-red-500 text-lg">{error}</p>
                    ) : (
                        <p className="text-gray-600 text-lg">Loading user data...</p>
                    )}
                </div>
            </div>
        );
    }

    // --- Main Render: Profile setup form layout ---
    return (
        <div className="min-h-screen bg-bg-student-dashboard flex justify-center items-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg"
            >
                {/* ADDED: Back Button */}
                {onBackClick && <BackButton onClick={onBackClick} />}

                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-primary-dark mb-2">
                        <motion.span
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                        >
                            Complete Your Profile!
                        </motion.span>
                    </h2>
                    <p className="text-center text-gray-600 mb-4">
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            Welcome to UniWiz! Let's get your profile set up.
                        </motion.span>
                    </p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-sm text-gray-500 italic"
                    >
                        This little bit of information will make you more visible to other users.
                    </motion.p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="first-name">First Name</label>
                            <input id="first-name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700" required />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="last-name">Last Name</label>
                            <input id="last-name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700" required />
                        </div>
                    </div>

                    {/* Conditional field for publishers */}
                    {user.role === 'publisher' && (
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="company-name">Company Name</label>
                            {/* Made required conditionally based on role */}
                            <input id="company-name" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700" required={user.role === 'publisher'} />
                        </div>
                    )}

                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    
                    <div className="flex items-center justify-center mt-6">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="bg-primary-main hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline w-full md:w-auto transition duration-300 disabled:bg-gray-400"
                        >
                            {isLoading ? 'Saving...' : 'Save and Continue'}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default ProfileSetup;
    