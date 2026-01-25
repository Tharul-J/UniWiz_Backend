// FILE: src/components/StudentProfilePage.js (UPDATED - Verified Badge)
// =====================================================================

import React, { useState, useEffect, useCallback } from 'react';

// --- LoadingSpinner: Shows a loading animation while fetching data ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
    </div>
);

// --- ProfileSection: Reusable section container for profile info ---
const ProfileSection = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

// --- InfoItem: Displays a label and value pair ---
const InfoItem = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-800 mt-1">{value || 'Not specified'}</p>
    </div>
);

// --- SkillBadge: Displays a single skill as a badge ---
const SkillBadge = ({ skill }) => (
    <span className="bg-blue-50 text-blue-600 font-medium px-3 py-1 rounded-full text-sm hover:bg-blue-100 transition-colors duration-200">
        {skill}
    </span>
);

// --- StudentProfilePage: Shows a student's profile with all details ---
function StudentProfilePage({ studentId, onBackClick, currentUser }) {
    // --- State hooks for student data, loading, and error ---
    const [student, setStudent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch student profile from backend ---
    const fetchStudentProfile = useCallback(async () => {
        if (!studentId) {
            setError("No student selected.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`http://uniwiz-backend.test/api/get_student_profile.php?student_id=${studentId}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch student profile.");
            }
            setStudent(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [studentId]);

    // --- Fetch profile on mount or when studentId changes ---
    useEffect(() => {
        fetchStudentProfile();
    }, [fetchStudentProfile]);

    if (isLoading) return <LoadingSpinner />;
    if (error) return (
        <div className="p-8 text-center bg-red-50 rounded-lg border border-red-100 text-red-600 max-w-4xl mx-auto">
            Error: {error}
        </div>
    );
    if (!student) return (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 text-gray-500 max-w-4xl mx-auto">
            Student profile not found.
        </div>
    );

    const skills = student.skills ? student.skills.split(',').map(s => s.trim()) : [];

    return (
        <div 
            className="p-6 md:p-8 min-h-screen"
            style={{
                background: 'linear-gradient(to bottom right, #BFDDFF, #ffffff)'
            }}
        >
            <div className="max-w-4xl mx-auto">
                {/* --- Back Button --- */}
                <button 
                    onClick={onBackClick} 
                    className="flex items-center text-blue-500 hover:text-blue-600 font-medium mb-6 transition-colors duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Applicants
                </button>

                {/* --- Profile Header --- */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row items-center gap-6">
                    <img
                        src={student.profile_image_url ? `http://uniwiz-backend.test/api/${student.profile_image_url}` : `https://placehold.co/128x128/E8EAF6/211C84?text=${student.first_name.charAt(0)}`}
                        alt="Profile"
                        className="h-28 w-28 md:h-32 md:w-32 rounded-full object-cover border-4 border-blue-100 shadow-sm"
                    />
                    <div className="text-center md:text-left">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{student.first_name} {student.last_name}</h1>
                        <p className="text-gray-600 mt-1">{student.field_of_study || 'Student'}</p>
                        {/* --- Verified/Unverified Badge --- */}
                        {student.is_verified ? (
                            <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 mt-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verified Account
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800 mt-2">
                                Unverified Account
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* --- Left Column: Education & Skills --- */}
                    <div className="lg:col-span-2 space-y-6">
                        <ProfileSection title="Educational Background">
                            <InfoItem label="University / Institution" value={student.university_name} />
                            <InfoItem label="Field of Study" value={student.field_of_study} />
                            <InfoItem label="Year of Study" value={student.year_of_study} />
                        </ProfileSection>

                        <ProfileSection title="Skills">
                            {skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill, index) => (
                                        <SkillBadge key={index} skill={skill} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No skills specified.</p>
                            )}
                        </ProfileSection>
                    </div>

                    {/* --- Right Column: Additional Info & CV --- */}
                    <div className="space-y-6">
                        <ProfileSection title="Additional Information">
                            <InfoItem label="Languages Spoken" value={student.languages_spoken} />
                        </ProfileSection>

                        <ProfileSection title="Resume / CV">
                            {student.cv_url ? (
                                <a 
                                    href={`http://uniwiz-backend.test/api/${student.cv_url}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center bg-blue-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                >
                                    Download CV
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </a>
                            ) : (
                                <p className="text-gray-500">CV has not been uploaded.</p>
                            )}
                        </ProfileSection>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentProfilePage;