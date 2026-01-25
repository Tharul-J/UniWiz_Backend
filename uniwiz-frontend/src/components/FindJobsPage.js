// FILE: src/components/FindJobsPage.js (UPDATED with Application Status)
// =================================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getCategoryColorClass } from '../utils/categoryColors';

// --- Constants ---
const API_BASE_URL = 'http://uniwiz-backend.test/api';
const MAX_SALARY = 40000;

// --- LoadingSpinner: Shows a loading animation ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
        applied: "bg-blue-50 text-blue-600", // For in-progress applications
        default: "bg-gray-100 text-gray-800"
    };
    return <span className={`${baseClasses} ${statusClasses[status] || statusClasses.default}`}>{status}</span>;
};

// --- JobCard: Displays a single job card in the job list ---
const JobCard = ({ job, currentUser, handleApply, handleViewCompanyProfile, handleViewJobDetails, applyingStatus, addToWishlist, isInWishlist }) => {
    const categoryName = job.category_name || job.category;
    const displayName = job.company_name || job.publisher_name || 'A Reputed Company';
    const categoryColorClass = getCategoryColorClass(categoryName);
    // Get logo URL from profile_image_url field
    const logoUrl = job.profile_image_url;
    // Determine the current application status
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
                        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${categoryColorClass}`}>
                            {categoryName}
                        </span>
                        <span className="text-xs text-gray-500">
                            Posted: {postedDate}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{job.title}</h3>
                    {/* --- Company Logo and Name Section --- */}
                    {logoUrl ? (
                        <div className="flex items-center mb-4">
                            <img
                                src={logoUrl.startsWith('http') ? logoUrl : `${API_BASE_URL}/${logoUrl}`}
                                alt={`${displayName} logo`}
                                className="w-12 h-12 rounded-lg mr-3 object-cover border border-gray-200 bg-gray-100"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                            <div>
                                <p className="text-sm text-gray-600">
                                    By: <button onClick={() => handleViewCompanyProfile(job.publisher_id)} className="font-semibold text-blue-500 hover:text-blue-600 ml-1">{displayName}</button>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600 mb-4">
                            By: <button onClick={() => handleViewCompanyProfile(job.publisher_id)} className="font-semibold text-blue-500 hover:text-blue-600 ml-1">{displayName}</button>
                        </p>
                    )}
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
                {/* --- Logic to show status or Apply button --- */}
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

// --- Main FindJobsPage Component: Shows job search, filters, and job list ---
function FindJobsPage({ currentUser, handleApply, setPage, setPublisherIdForProfile, handleViewJobDetails, applyingStatus, addToWishlist, isInWishlist }) {
    // --- State hooks for jobs, filters, loading, and error ---
    const [allJobs, setAllJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleJobsCount, setVisibleJobsCount] = useState(9);

    // --- Filter States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [jobTypeFilter, setJobTypeFilter] = useState('');
    const [minSalary, setMinSalary] = useState(0);
    const [maxSalary, setMaxSalary] = useState(MAX_SALARY);
    const [postedDateFilter, setPostedDateFilter] = useState('anytime');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [jobDateFrom, setJobDateFrom] = useState('');
    const [jobDateTo, setJobDateTo] = useState('');
    
    const [categories, setCategories] = useState([]);
    const JOBS_PER_LOAD = 9;
    
    const sriLankaDistricts = [
        "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
        "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
        "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa",
        "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
    ];

    // --- Fetch jobs and categories from backend ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const studentIdParam = currentUser ? `student_id=${currentUser.id}` : '';
            const jobsResponse = await fetch(`${API_BASE_URL}/jobs.php?${studentIdParam}`);
            if (!jobsResponse.ok) throw new Error('Failed to fetch jobs.');
            const jobsData = await jobsResponse.json();
            setAllJobs(jobsData);
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/get_categories.php`);
                const data = await response.json();
                if (response.ok) setCategories(data);
            } catch (err) { console.error("Failed to fetch categories:", err); }
        };
        fetchData();
        fetchCategories();
    }, [fetchData]);

    // --- View company profile handler ---
    const handleViewCompanyProfile = (publisherId) => {
        if (setPage && setPublisherIdForProfile) {
            setPublisherIdForProfile(publisherId);
            setPage('company-profile');
        }
    };
    
    // --- Filter jobs based on all filter states ---
    const filteredJobs = allJobs.filter(job => {
        const searchTermMatch = searchTerm === '' || job.title.toLowerCase().includes(searchTerm.toLowerCase()) || (job.company_name && job.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
        const categoryMatch = selectedCategory === '' || String(job.category_id) === String(selectedCategory);
        const jobTypeMatch = jobTypeFilter === '' || job.job_type === jobTypeFilter;
        const paymentValue = parseInt(job.payment_range.replace(/[^0-9]/g, ''), 10) || 0;
        const salaryMatch = paymentValue >= minSalary && paymentValue <= maxSalary;
        const districtMatch = selectedDistrict === '' || (job.location && job.location.toLowerCase().includes(selectedDistrict.toLowerCase()));

        const now = new Date();
        const createdDate = new Date(job.created_at);
        let postedDateMatch = true;
        if (postedDateFilter === '24hours') postedDateMatch = now - createdDate <= 24 * 60 * 60 * 1000;
        else if (postedDateFilter === '7days') postedDateMatch = now - createdDate <= 7 * 24 * 60 * 60 * 1000;
        else if (postedDateFilter === '30days') postedDateMatch = now - createdDate <= 30 * 24 * 60 * 60 * 1000;

        const jobStartDate = job.start_date ? new Date(job.start_date) : null;
        const jobEndDate = job.end_date ? new Date(job.end_date) : jobStartDate;
        const filterFrom = jobDateFrom ? new Date(jobDateFrom) : null;
        const filterTo = jobDateTo ? new Date(jobDateTo) : null;
        let durationMatch = true;
        if (jobStartDate && filterFrom && filterTo) {
            durationMatch = (jobStartDate <= filterTo && jobEndDate >= filterFrom);
        } else if (filterFrom) {
            durationMatch = jobEndDate >= filterFrom;
        } else if (filterTo) {
            durationMatch = jobStartDate <= filterTo;
        }
        
        return searchTermMatch && categoryMatch && jobTypeMatch && salaryMatch && postedDateMatch && districtMatch && durationMatch;
    });
    
    // --- Reset all filters to default ---
    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setJobTypeFilter('');
        setMinSalary(0);
        setMaxSalary(MAX_SALARY);
        setPostedDateFilter('anytime');
        setSelectedDistrict('');
        setJobDateFrom('');
        setJobDateTo('');
    };

    return (
        <div 
            className="p-6 md:p-8 min-h-screen text-gray-800"
            style={{
                background: 'linear-gradient(to bottom right, #BFDDFF, #ffffff)'
            }}
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Find Your Next Job</h1>
                    <p className="text-gray-600 mt-2">Use the filters below to find your perfect match.</p>
                </div>
            </div>

            {/* --- Ultra-Compact Filter Section --- */}
            <div className="mb-6 p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-2 text-sm items-end">
                    {/* --- Row 1 --- */}
                    <div className="lg:col-span-2 md:col-span-4">
                        <label className="block text-gray-600 font-medium mb-1">Search</label>
                        <input type="text" placeholder="Job, company..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-400" />
                    </div>
                    <div className="lg:col-span-2 md:col-span-2">
                        <label className="block text-gray-600 font-medium mb-1">Category</label>
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-2 rounded-lg border bg-white focus:ring-1 focus:ring-blue-400">
                            <option value="">All Categories</option>
                            {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                        </select>
                    </div>
                    <div className="lg:col-span-2 md:col-span-2">
                        <label className="block text-gray-600 font-medium mb-1">Job Type</label>
                        <select value={jobTypeFilter} onChange={(e) => setJobTypeFilter(e.target.value)} className="w-full p-2 rounded-lg border bg-white focus:ring-1 focus:ring-blue-400">
                            <option value="">All Job Types</option>
                            <option value="freelance">Freelance</option><option value="part-time">Part-time</option><option value="internship">Internship</option><option value="task-based">Task-based</option>
                        </select>
                    </div>
                     <div className="lg:col-span-2 md:col-span-4">
                        <label className="block text-gray-600 font-medium mb-1">District</label>
                        <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="w-full p-2 rounded-lg border bg-white focus:ring-1 focus:ring-blue-400">
                            <option value="">All Districts</option>
                            {sriLankaDistricts.sort().map(dist => (<option key={dist} value={dist}>{dist}</option>))}
                        </select>
                    </div>

                    {/* --- Row 2 --- */}
                     <div className="lg:col-span-3 md:col-span-4">
                        <label className="block text-gray-600 font-medium mb-1">Salary Range (LKR)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                max={maxSalary}
                                value={minSalary}
                                onChange={e => {
                                    const val = Number(e.target.value);
                                    setMinSalary(val);
                                    if (val > maxSalary) setMaxSalary(val);
                                }}
                                className="w-24 p-2 rounded-lg border"
                                placeholder="Min"
                            />
                            <span>-</span>
                            <input
                                type="number"
                                min={minSalary}
                                max={MAX_SALARY}
                                value={maxSalary}
                                onChange={e => setMaxSalary(Number(e.target.value))}
                                className="w-24 p-2 rounded-lg border"
                                placeholder="Max"
                            />
                        </div>
                    </div>
                     <div className="lg:col-span-2 md:col-span-2">
                        <label className="block text-gray-600 font-medium mb-1">Date Posted</label>
                        <select value={postedDateFilter} onChange={(e) => setPostedDateFilter(e.target.value)} className="w-full p-2 rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                            <option value="anytime">Anytime</option>
                            <option value="24hours">Last 24h</option>
                            <option value="7days">Last 7d</option>
                            <option value="30days">Last 30d</option>
                        </select>
                    </div>
                     <div className="lg:col-span-2 md:col-span-2">
                        <label className="block text-gray-600 font-medium mb-1">Job Start Date</label>
                        <input type="date" value={jobDateFrom} onChange={(e) => setJobDateFrom(e.target.value)} className="w-full p-2 rounded-lg border bg-white focus:ring-1 focus:ring-blue-400"/>
                     </div>
                    <button onClick={handleResetFilters} className="lg:col-span-1 md:col-span-2 w-full p-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Reset</button>
                </div>
            </div>

            {isLoading ? <LoadingSpinner /> : error ? <div className="text-center text-red-500 py-16 bg-white rounded-xl">{`Failed to load jobs: ${error}`}</div> : (
                <>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Available Jobs ({filteredJobs.length} found)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredJobs.length > 0 ? filteredJobs.slice(0, visibleJobsCount).map(job => (
                            <JobCard 
                                key={job.id} 
                                job={job} 
                                currentUser={currentUser} 
                                handleApply={handleApply} 
                                handleViewCompanyProfile={handleViewCompanyProfile} 
                                handleViewJobDetails={handleViewJobDetails} 
                                applyingStatus={applyingStatus} 
                                addToWishlist={addToWishlist}
                                isInWishlist={isInWishlist}
                            />
                        )) : (
                            <div className="col-span-3 text-center text-gray-500 py-16 bg-white rounded-xl shadow-sm border">No jobs found matching your criteria.</div>
                        )}
                    </div>
                    {visibleJobsCount < filteredJobs.length && (
                        <div className="text-center mt-8">
                            <button onClick={() => setVisibleJobsCount(prev => prev + JOBS_PER_LOAD)} className="bg-blue-500 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-blue-600 shadow-sm">Load More</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default FindJobsPage;