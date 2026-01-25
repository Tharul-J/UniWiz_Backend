// FILE: src/components/CompanyProfilePage.js (ENHANCED for Gallery Display)
// ========================================================================
// This component displays a company's profile, jobs, gallery, reviews, and contact info.

import React, { useState, useEffect, useCallback } from 'react';
import CreateReviewModal from './CreateReviewModal';

// --- LoadingSpinner: Shows a loading animation while fetching data ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-main"></div>
    </div>
);

// --- InfoCard: Card layout for grouping company info sections ---
const InfoCard = ({ icon, title, children, className = '' }) => (
    <div className={`bg-white p-6 rounded-xl shadow-md border border-gray-100 ${className}`}>
        <div className="flex items-center mb-4">
            <div className="text-primary-main mr-3">{icon}</div>
            <h3 className="text-lg font-bold text-primary-dark">{title}</h3>
        </div>
        <div>{children}</div>
    </div>
);

// --- StarRating: Shows star rating and review count ---
const StarRating = ({ rating, reviewCount, size = 'w-5 h-5', showText = false }) => {
    const totalStars = 5;
    const numericRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numericRating);
    const emptyStars = totalStars - fullStars;

    return (
        <div className="flex items-center">
            {[...Array(fullStars)].map((_, i) => <svg key={`full_${i}`} className={`${size} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
            {[...Array(emptyStars)].map((_, i) => <svg key={`empty_${i}`} className={`${size} text-gray-300`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
            {showText && reviewCount > 0 && <span className="ml-2 text-sm font-bold text-gray-700">{numericRating.toFixed(1)} out of 5</span>}
            {reviewCount > 0 && !showText && <span className="ml-2 text-sm text-gray-600">({reviewCount} reviews)</span>}
        </div>
    );
};

// --- ReviewCard: Shows a single student review ---
const ReviewCard = ({ review }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center mb-2">
            <img 
                src={review.student_image_url ? `http://uniwiz-backend.test/api/${review.student_image_url}` : `https://placehold.co/40x40/E8EAF6/211C84?text=${(review.first_name || 'S').charAt(0)}`} 
                alt="student profile"
                className="h-10 w-10 rounded-full object-cover mr-3"
            />
            <div>
                <p className="font-bold">{review.first_name} {review.last_name}</p>
                <StarRating rating={review.rating} />
            </div>
        </div>
        <p className="text-gray-700 italic">"{review.review_text}"</p>
        <p className="text-xs text-gray-400 text-right mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
    </div>
);

// --- StatusBadge: Shows application status as a colored badge ---
const StatusBadge = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full capitalize";
    const statusClasses = {
        pending: "bg-yellow-100 text-yellow-800",
        viewed: "bg-blue-100 text-blue-800",
        accepted: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        default: "bg-gray-100 text-gray-800"
    };
    return <span className={`${baseClasses} ${statusClasses[status] || statusClasses.default}`}>{status}</span>;
};

// --- JobCard: Shows a summary of a job with apply/view buttons ---
const JobCard = ({ job, currentUser, handleApply, handleViewJobDetails, applyingStatus, handleApplyClick, addToWishlist, isInWishlist }) => {
    const safeApplyingStatus = applyingStatus || {}; 
    const currentApplicationStatus = safeApplyingStatus[job.id] || job.application_status;
    const categoryName = job.category_name || job.category;
    const displayName = job.company_name || job.publisher_name || 'A Reputed Company';

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-md">
            <div className="p-6 flex flex-col h-full">
                <div className="flex-grow">
                    <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-3 py-1 rounded-full mb-3">
                        {categoryName}
                    </span>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{job.title}</h3>
                    <p className="text-gray-600 mb-4">
                        Posted by: 
                        <span className="font-semibold text-gray-600 ml-1 cursor-default">{displayName}</span>
                    </p>
                    <div className="space-y-2 text-gray-700">
                        <p><strong>Type:</strong> {job.job_type}</p>
                        <p><strong>Payment:</strong> {job.payment_range}</p>
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
                        <button 
                            onClick={() => handleViewJobDetails(job)}
                            className="font-medium py-2 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition duration-300 text-sm"
                        >
                            View
                        </button>
                        {currentUser && currentUser.role === 'student' && !currentApplicationStatus && (
                            <button 
                                onClick={() => handleApplyClick(job)} 
                                className="font-medium py-2 px-4 rounded-lg transition duration-300 bg-blue-500 text-white hover:bg-blue-600 text-sm"
                            >
                                Apply Now
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
function CompanyProfilePage({ publisherId, currentUser, handleApply, handleViewJobDetails, showNotification, appliedJobs, applyingStatus, addToWishlist, isInWishlist }) {
    // --- State for company, jobs, reviews, gallery, loading, error, review modal ---
    const [company, setCompany] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [userReview, setUserReview] = useState(null);
    // --- NEW: State for checking if student can review this publisher ---
    const [canReview, setCanReview] = useState(false);
    const [reviewCheckLoading, setReviewCheckLoading] = useState(false);
    // --- Show verify warning for unverified students (Sinhala + English) ---
    const [showVerifyMsg, setShowVerifyMsg] = useState(false);
    // --- Check if current user is verified ---
    const isVerified = currentUser && (currentUser.is_verified === true || currentUser.is_verified === 1);

    // --- Check if current user can review this publisher ---
    const checkCanReview = useCallback(async () => {
        if (!currentUser || currentUser.role !== 'student' || !publisherId) {
            setCanReview(false);
            return;
        }

        setReviewCheckLoading(true);
        try {
            const response = await fetch(
                `http://uniwiz-backend.test/api/can_review_publisher.php?student_id=${currentUser.id}&publisher_id=${publisherId}`
            );
            const data = await response.json();
            
            if (response.ok) {
                setCanReview(data.can_review);
            } else {
                setCanReview(false);
                console.error('Review check failed:', data.message);
            }
        } catch (err) {
            console.error('Error checking review permissions:', err);
            setCanReview(false);
        } finally {
            setReviewCheckLoading(false);
        }
    }, [currentUser, publisherId]);

    // --- Apply button click handler with verify check ---
    const handleApplyClick = (job) => {
        if (!isVerified) {
            setShowVerifyMsg(true);
            setTimeout(() => setShowVerifyMsg(false), 4000);
            return;
        }
        handleApply(job);
    };

    // --- Fetch company profile, jobs, reviews, gallery from backend ---
    const fetchCompanyData = useCallback(async () => {
        if (!publisherId) {
            setError("No company selected.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`http://uniwiz-backend.test/api/get_company_profile.php?publisher_id=${publisherId}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch company profile.");
            }
            setCompany(data.details);
            setJobs(Array.isArray(data.jobs) ? data.jobs : []);
            const allReviews = Array.isArray(data.reviews) ? data.reviews : [];
            setReviews(allReviews);
            setGalleryImages(Array.isArray(data.gallery_images) ? data.gallery_images : []);
            
            if (currentUser && currentUser.id) {
                // --- For students, fetch application status for each job ---
                const jobsWithApplicationStatus = await Promise.all(
                    data.jobs.map(async (job) => {
                        const appStatusResponse = await fetch(`http://uniwiz-backend.test/api/get_job_details.php?job_id=${job.id}&student_id=${currentUser.id}`);
                        const appStatusData = await appStatusResponse.json();
                        return { ...job, application_status: appStatusData.application_status };
                    })
                );
                setJobs(jobsWithApplicationStatus);
                // --- Find if the current student has already reviewed ---
                const foundReview = allReviews.find(r => r.student_id === currentUser.id);
                setUserReview(foundReview || null);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [publisherId, currentUser]);

    // --- Fetch company data on mount or when publisherId/currentUser changes ---
    useEffect(() => {
        fetchCompanyData();
        checkCanReview(); // Check if student can review this publisher
    }, [fetchCompanyData, checkCanReview]);
    
    // --- Handle review submission success ---
    const handleReviewSubmitSuccess = (message) => {
        if(showNotification) {
            showNotification(message, 'success');
        }
        fetchCompanyData();
    };

    // --- Show loading, error, or not found states ---
    if (isLoading) return <LoadingSpinner />;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!company) return <div className="p-8 text-center text-gray-500">Company profile not found.</div>;

    // --- SVG icons for sections ---
    const AboutIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    const GalleryIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    const JobsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    const ReviewsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
    const ContactIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
    const SocialIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>;
    const hasSocialLinks = company.facebook_url || company.linkedin_url || company.instagram_url;

    // --- Main Render: Company profile layout ---
    return (
        <>
            <div 
                className="p-8 min-h-screen text-gray-800"
                style={{
                    background: 'linear-gradient(to bottom right, #A980FF, #ffffff)'
                }}
            >
                {showVerifyMsg && (
                    <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
                        <div className="mt-1 text-sm">Please verify your account before applying for jobs. You cannot apply for jobs until your account is verified.</div>
                    </div>
                )}
                <div className="max-w-6xl mx-auto">
                    {/* Cover Image */}
                    {company.cover_image_url ? (
                        <div className="h-64 rounded-xl overflow-hidden mb-8 shadow-lg">
                            <img src={`http://uniwiz-backend.test/api/${company.cover_image_url}`} alt={`${company.company_name} cover`} className="w-full h-full object-cover"/>
                        </div>
                    ) : (
                        <div className="h-48 bg-gray-200 rounded-xl mb-8"></div>
                    )}

                    {/* Company Profile Header */}
                    <div className="bg-white p-8 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row items-center text-center md:text-left gap-6 border -mt-24 md:-mt-16 relative">
                        <img 
                            src={company.profile_image_url ? `http://uniwiz-backend.test/api/${company.profile_image_url}` : `https://placehold.co/128x128/E8EAF6/211C84?text=${(company.company_name || 'C').charAt(0)}`} 
                            alt={`${company.company_name || company.first_name}'s Profile`} 
                            className="h-32 w-32 rounded-full object-cover shadow-md border-4 border-white" 
                        />
                        <div>
                            <h1 className="text-4xl font-bold text-primary-dark mb-1">{company.company_name || `${company.first_name} ${company.last_name}`}</h1>
                            <p className="text-gray-600 text-lg font-medium mb-2">{company.industry || 'Industry not specified'}</p>
                            <StarRating rating={company.average_rating} reviewCount={company.review_count} size="w-6 h-6" showText={true} />
                            {company.is_verified ? (
                                <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 mt-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Verified Company
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800 mt-2">
                                    Unverified Company
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <InfoCard title="About Us" icon={AboutIcon}>
                                {company.about ? (
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{company.about}</p>
                                ) : (
                                    <p className="text-gray-500 italic">A description for this company has not been provided yet.</p>
                                )}
                            </InfoCard>
                            
                            {galleryImages.length > 0 && (
                                <InfoCard title="Gallery" icon={GalleryIcon}>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {galleryImages.map(image => (
                                            <div key={image.id} className="rounded-lg overflow-hidden shadow-sm">
                                                <img src={`http://uniwiz-backend.test/api/${image.image_url}`} alt="Company gallery" className="h-32 w-full object-cover hover:scale-105 transition-transform duration-300"/>
                                            </div>
                                        ))}
                                    </div>
                                </InfoCard>
                            )}

                            <InfoCard title="Active Jobs" icon={JobsIcon}>
                                <div className="space-y-4">
                                    {jobs.length > 0 ? jobs.map((job) => (
                                        <JobCard
                                            key={job.id}
                                            job={job}
                                            currentUser={currentUser}
                                            handleApply={handleApply}
                                            handleViewJobDetails={handleViewJobDetails}
                                            applyingStatus={applyingStatus}
                                            handleApplyClick={handleApplyClick}
                                            addToWishlist={addToWishlist}
                                            isInWishlist={isInWishlist}
                                        />
                                    )) : (
                                        <p className="text-center text-gray-500 py-8">No active jobs currently posted.</p> 
                                    )}
                                </div>
                            </InfoCard>
                        </div>

                        {/* Right Column (Sticky) */}
                        <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-8">
                            <InfoCard title="Contact Information" icon={ContactIcon}>
                                <div className="space-y-4 text-gray-700">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Email</p>
                                        <p className="font-semibold break-words">{company.email}</p>
                                    </div>
                                     <div>
                                        <p className="text-sm font-medium text-gray-500">Phone</p>
                                        <p className="font-semibold">{company.phone_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Address</p>
                                        <p className="font-semibold whitespace-pre-wrap">{company.address || 'N/A'}</p>
                                    </div>
                                    {company.website_url && <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="text-primary-main font-bold hover:underline block pt-2">Visit Website</a>}
                                </div>
                            </InfoCard>

                             {hasSocialLinks && (
                                <InfoCard title="Follow Us" icon={SocialIcon}>
                                    <div className="flex space-x-4">
                                        {company.facebook_url && <a href={company.facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600" title="Facebook"><svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg></a>}
                                        {company.linkedin_url && <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700" title="LinkedIn"><svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-4.481 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" /></svg></a>}
                                        {company.instagram_url && <a href={company.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-600" title="Instagram"><svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.012 3.584-.07 4.85c-.148 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.85s.012-3.584.07-4.85c.149-3.225 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z" /></svg></a>}
                                    </div>
                                </InfoCard>
                             )}

                            <InfoCard title="Ratings & Reviews" icon={ReviewsIcon}>
                                {currentUser && currentUser.role === 'student' && canReview && (
                                    <div className="mb-4">
                                        <button
                                            onClick={() => setIsReviewModalOpen(true)}
                                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300"
                                            disabled={reviewCheckLoading}
                                        >
                                            {reviewCheckLoading ? 'Checking...' : (userReview ? 'Edit Your Review' : 'Leave a Review')}
                                        </button>
                                    </div>
                                )}
                                
                                {currentUser && currentUser.role === 'student' && !canReview && !reviewCheckLoading && (
                                    <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
                                        <p className="text-sm text-gray-600 text-center">
                                            💼 You can only review publishers who have accepted your job applications.
                                        </p>
                                    </div>
                                )}
                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {reviews.length > 0 ? (
                                        reviews.map(review => <ReviewCard key={review.review_id} review={review} />)
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-gray-500">No reviews yet.</p>
                                            {currentUser?.role === 'student' && <p className="text-sm text-gray-400 mt-1">Be the first to share your experience!</p>}
                                        </div>
                                    )}
                                </div>
                            </InfoCard>
                        </div>
                    </div>
                </div>
            </div>
            <CreateReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                publisherId={publisherId}
                studentId={currentUser?.id}
                companyName={company?.company_name || company?.first_name}
                onSubmitSuccess={handleReviewSubmitSuccess}
                existingReview={userReview}
            />
        </>
    );
}

export default CompanyProfilePage;
