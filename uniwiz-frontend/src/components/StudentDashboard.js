// FILE: src/components/StudentDashboard.js (UPDATED with Dynamic Colors)
// =================================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { getCategoryColorClass } from '../utils/categoryColors';
const API_BASE_URL = 'http://uniwiz-backend.test/api';

// --- StatCard: Displays a dashboard stat with icon and action ---
// UPDATED: StatCard now accepts color classes
const StatCard = ({ title, value, icon, delay = 0, onLinkClick, description, color }) => (
  <div
    className="stat-card bg-white p-6 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-gray-100"
    style={{ animationDelay: `${delay * 100}ms` }}
  >
    <div className="flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        {/* UPDATED: Icon background and text color are now dynamic */}
        <div className={`p-3 rounded-full ${color.bg} ${color.text}`}>
            {icon}
        </div>
    </div>
    <button onClick={onLinkClick} className={`text-left text-sm font-semibold mt-4 hover:underline flex items-center group ${color.text}`}>
        {description}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    </button>
  </div>
);

// --- ProfileCompletionCard: Shows profile completion progress ---
const ProfileCompletionCard = ({ percentage, setPage }) => (
    <div onClick={() => setPage('profile')} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-gray-100 hover:border-blue-200 cursor-pointer">
        <p className="text-sm font-medium text-gray-600">Profile Completion</p>
        <div className="flex items-center mt-2">
            <p className="text-3xl font-bold text-gray-800 mr-3">{percentage}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-400 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
        <button className="text-sm font-semibold text-blue-500 hover:underline mt-4">
            {percentage < 100 ? 'Complete your profile to stand out!' : 'Your profile is looking great!'}
        </button>
    </div>
);

// --- LoadingSpinner: Shows a loading animation ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
    </div>
);

// --- StatusBadge: Shows a colored badge for application status ---
const StatusBadge = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full capitalize";
    const statusClasses = {
        pending: "bg-yellow-100 text-yellow-800",
        viewed: "bg-blue-100 text-blue-800",
        accepted: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        applied: "bg-blue-50 text-blue-600",
        default: "bg-gray-100 text-gray-800"
    };
    return <span className={`${baseClasses} ${statusClasses[status] || statusClasses.default}`}>{status}</span>;
};

// --- JobCard: Displays a single recommended job card ---
// UPDATED: JobCard uses dynamic category colors
const JobCard = ({ job, currentUser, handleApply, handleViewCompanyProfile, handleViewJobDetails, applyingStatus, addToWishlist, isInWishlist }) => {
    const categoryName = job.category_name || job.category;
    const displayName = job.company_name || job.publisher_name || 'A Reputed Company';
    const categoryColorClass = getCategoryColorClass(categoryName);
    const logoUrl = job.profile_image_url;
    const currentApplicationStatus = applyingStatus[job.id] || job.application_status;
    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-CA');
    };
    const postedDate = formatDate(job.created_at);
    const startDate = formatDate(job.start_date);
    const endDate = formatDate(job.end_date);
    const isSingleDayJob = startDate && (startDate === endDate || !endDate);
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 border border-gray-100 hover:border-blue-300 hover:shadow-md">
            <div className="p-5 flex flex-col h-full">
                <div className="flex-grow">
                    <div className="flex justify-between items-start mb-3">
                        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${categoryColorClass}`}>{categoryName}</span>
                        <span className="text-xs text-gray-500">Posted: {postedDate}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{job.title}</h3>
                    <div className="flex items-center mb-4">
                        <img
                            src={logoUrl ? (logoUrl.startsWith('http') ? logoUrl : `${API_BASE_URL}/${logoUrl}`) : 'https://placehold.co/48x48/E8EAF6/211C84?text=Logo'}
                            alt={`${displayName} logo`}
                            className="w-12 h-12 rounded-lg mr-3 object-cover border border-gray-200 bg-gray-100"
                            onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div>
                            <p className="text-sm text-gray-600">
                                By: <button onClick={() => handleViewCompanyProfile(job.publisher_id)} className="font-semibold text-blue-500 hover:text-blue-600 ml-1">{displayName}</button>
                            </p>
                        </div>
                    </div>
                    <div className="space-y-1 text-gray-700 text-sm">
                        <p><strong>Type:</strong> {job.job_type}</p>
                        <p><strong>Payment:</strong> {job.payment_range}</p>
                        {isSingleDayJob ? (
                            <p><strong>Date:</strong> {startDate}</p>
                        ) : (startDate &&
                            <p><strong>Duration:</strong> {startDate} to {endDate || 'Ongoing'}</p>
                        )}
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div>
                        {currentApplicationStatus && (
                            <StatusBadge status={currentApplicationStatus} />
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* Wishlist button for students */}
                        {currentUser && currentUser.role === 'student' && (
                            <button 
                                onClick={() => addToWishlist(job)}
                                className={`p-2 rounded-lg transition duration-300 ${
                                    isInWishlist(job.id) 
                                        ? 'text-red-500 hover:bg-red-50' 
                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                }`}
                                title={isInWishlist(job.id) ? "In wishlist" : "Add to wishlist"}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isInWishlist(job.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>
                        )}
                        <button onClick={() => handleViewJobDetails(job)} className="font-medium py-2 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition duration-300 text-sm">Details</button>
                        {currentUser && currentUser.role === 'student' && !currentApplicationStatus && (
                            <button onClick={() => handleApply(job)} className="font-medium py-2 px-4 rounded-lg transition duration-300 bg-blue-500 text-white hover:bg-blue-600 text-sm">Apply Now</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- StudentDashboard: Main dashboard for students ---
function StudentDashboard({ currentUser, handleApply, setPage, setPublisherIdForProfile, handleViewJobDetails, setAppliedJobsPageFilter, applyingStatus, addToWishlist, isInWishlist }) {
    // --- State hooks for stats, jobs, loading, error, and verification messages ---
    const [stats, setStats] = useState(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [errorStats, setErrorStats] = useState(null);

    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);
    const [errorJobs, setErrorJobs] = useState(null);

    // Verification no longer blocks applying

    const [showPostVerifyMessage, setShowPostVerifyMessage] = useState(currentUser && currentUser.is_verified);
    useEffect(() => {
        if (currentUser && currentUser.is_verified) {
            setShowPostVerifyMessage(true);
            const timer = setTimeout(() => setShowPostVerifyMessage(false), 60000);
            return () => clearTimeout(timer);
        }
    }, [currentUser]);

    // --- Fetch student stats from backend ---
    useEffect(() => {
        const fetchStats = async () => {
            if (!currentUser || !currentUser.id) return;
            setIsLoadingStats(true);
            try {
                const response = await fetch(`http://uniwiz-backend.test/api/get_student_stats.php?student_id=${currentUser.id}`);
                const data = await response.json();
                if (response.ok) setStats(data);
                else throw new Error(data.message || 'Failed to fetch student stats.');
            } catch (err) { setErrorStats(err.message); } 
            finally { setIsLoadingStats(false); }
        };
        fetchStats();
    }, [currentUser]);

    // --- Fetch recommended jobs from backend ---
    useEffect(() => {
        const fetchRecommendedJobs = async () => {
            if (!currentUser || !currentUser.id) return;
            setIsLoadingJobs(true);
            try {
                const response = await fetch(`http://uniwiz-backend.test/api/get_recommended_jobs.php?student_id=${currentUser.id}`);
                const data = await response.json();
                if (response.ok) setRecommendedJobs(data);
                else throw new Error(data.message || 'Failed to fetch recommended jobs.');
            } catch (err) { setErrorJobs(err.message); } 
            finally { setIsLoadingJobs(false); }
        };
        fetchRecommendedJobs();
    }, [currentUser]);

    // --- View company profile handler ---
    const handleViewCompanyProfile = (publisherId) => {
        if (setPage && setPublisherIdForProfile) {
            setPublisherIdForProfile(publisherId);
            setPage('company-profile');
        }
    };
    
    // --- Stat card link click handler ---
    const handleStatLinkClick = (filter) => {
        setAppliedJobsPageFilter(filter);
        setPage('applied-jobs');
    };

    // --- Handler for apply button (no verify gate) ---
    const handleApplyClick = (job) => {
        handleApply(job);
    };

    // --- Icons and Colors for StatCards ---
    const ApplicationsSentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
    const AcceptedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    const ProfileViewsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;

    const statCardColors = {
        sent: { bg: 'bg-accent-blue-light', text: 'text-accent-blue-dark' },
        accepted: { bg: 'bg-accent-teal-light', text: 'text-accent-teal-dark' },
        views: { bg: 'bg-accent-pink-light', text: 'text-accent-pink-dark' },
    };

    // Only show warning if not verified AND profile not complete
    const showVerificationWarning = currentUser && !currentUser.is_verified && (stats?.profile_completion_percentage ?? 0) < 100;
    return (
        <div 
            className="p-8 min-h-screen text-gray-800"
            style={{
                background: 'linear-gradient(to bottom right, #BFDDFF, #ffffff)'
            }}
        >
            {/* Verification notice removed from blocking apply */}
            <div className="max-w-6xl mx-auto">
                {showVerificationWarning && (
                    <div className="mb-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
                        <strong>Your account is not verified.</strong> Please complete your profile to request verification.
                    </div>
                )}
                {/* --- Header --- */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome, {currentUser?.first_name}!</h1>
                        <p className="text-gray-600 mt-2">Here's a quick overview of your job search.</p>
                    </div>
                </div>

                {/* --- Stats Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {isLoadingStats ? (
                        <><div className="h-24 bg-white rounded-xl animate-pulse"></div><div className="h-24 bg-white rounded-xl animate-pulse"></div><div className="h-24 bg-white rounded-xl animate-pulse"></div><div className="h-24 bg-white rounded-xl animate-pulse"></div></>
                    ) : errorStats ? (
                        <div className="lg:col-span-4 text-center text-red-500 py-8 bg-white rounded-xl shadow-sm border border-gray-100">Error loading stats: {errorStats}</div>
                    ) : (
                        <>
                            <StatCard 
                                title="Applications Sent" 
                                value={stats?.applications_sent ?? 0} 
                                icon={<ApplicationsSentIcon />} 
                                delay={0}
                                description="View all applications"
                                onLinkClick={() => handleStatLinkClick('All')}
                                color={statCardColors.sent} // Pass color prop
                            />
                            <StatCard 
                                title="Applications Accepted" 
                                value={stats?.applications_accepted ?? 0} 
                                icon={<AcceptedIcon />} 
                                delay={1}
                                description="View accepted"
                                onLinkClick={() => handleStatLinkClick('Accepted')}
                                color={statCardColors.accepted} // Pass color prop
                            />
                            <StatCard 
                                title="Profile Views" 
                                value={stats?.profile_views ?? 0} 
                                icon={<ProfileViewsIcon />} 
                                delay={2}
                                description="View who viewed"
                                onLinkClick={() => handleStatLinkClick('Viewed')} 
                                color={statCardColors.views} // Pass color prop
                            />
                            <ProfileCompletionCard percentage={stats?.profile_completion_percentage ?? 0} setPage={setPage} />
                        </>
                    )}
                </div>

                {/* --- Recommended Jobs Section --- */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Recommended For You</h2>
                    <button onClick={() => setPage('find-jobs')} className="font-semibold text-blue-500 hover:underline">
                        View All Jobs
                    </button>
                </div>

                {isLoadingJobs ? <LoadingSpinner /> : errorJobs ? <div className="text-center text-red-500 py-16 bg-white rounded-xl shadow-sm border border-gray-100">{errorJobs}</div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {recommendedJobs.length > 0 ? recommendedJobs.map(job => (
                            <JobCard
                                key={`rec-${job.id}`}
                                job={job}
                                currentUser={currentUser}
                                handleApply={handleApplyClick}
                                handleViewCompanyProfile={handleViewCompanyProfile}
                                handleViewJobDetails={handleViewJobDetails}
                                applyingStatus={applyingStatus}
                                addToWishlist={addToWishlist}
                                isInWishlist={isInWishlist}
                            />
                        )) : (
                            <div className="col-span-3 bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
                                <p className="text-gray-500">No specific recommendations yet. Use "Find Jobs" to explore!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentDashboard;