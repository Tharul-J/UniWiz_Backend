// FILE: src/components/WishlistPage.js
// =================================================================================
// Wishlist page component for students to save and manage favorite job listings

import React, { useState, useEffect } from 'react';
import { getCategoryColorClass } from '../utils/categoryColors';

// --- JobCard: Individual job card component ---
const JobCard = ({ job, onRemove, onViewDetails, onApply }) => {
    const categoryName = job.category_name || job.category || 'General';
    const displayName = job.company_name || job.publisher_name || job.company || 'Company';
    const colorClass = getCategoryColorClass(categoryName);
    
    // Handle date formatting with fallbacks
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'N/A';
        }
    };
    
    const addedDate = formatDate(job.added_date || job.created_at);
    const deadlineDate = formatDate(job.deadline || job.end_date);
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                    <img 
                        src={job.company_logo || job.profile_image_url || '/logo.png'} 
                        alt={`${displayName} logo`}
                        className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-100"
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 cursor-pointer"
                            onClick={() => onViewDetails(job)}>
                            {job.title}
                        </h3>
                        <p className="text-sm text-gray-600">{displayName}</p>
                    </div>
                </div>
                
                {/* Remove from wishlist button */}
                <button 
                    onClick={() => onRemove(job.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from wishlist"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                </button>
            </div>

            {/* Job details */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${colorClass.bg} ${colorClass.text}`}>
                        {categoryName}
                    </span>
                    <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12z" />
                        </svg>
                        {job.job_type || job.type || 'Job'}
                    </span>
                    <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.location}
                    </span>
                </div>
                
                <p className="text-sm text-gray-700 font-medium">{job.payment_range || job.salary || 'Salary not specified'}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
                {job.tags && job.tags.length > 0 && job.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        {tag}
                    </span>
                ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                    <p>Added: {addedDate}</p>
                    <p>Deadline: {deadlineDate}</p>
                </div>
                
                <div className="flex space-x-2">
                    <button 
                        onClick={() => onViewDetails(job)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        View Details
                    </button>
                    <button 
                        onClick={() => onApply(job)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                    >
                        Apply Now
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- FilterBar: Filter and search controls ---
const FilterBar = ({ searchTerm, setSearchTerm, categoryFilter, setCategoryFilter, sortBy, setSortBy, categories }) => {
    
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search wishlist jobs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                
                {/* Category Filter */}
                <div className="lg:w-48">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
                
                {/* Sort */}
                <div className="lg:w-48">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="added_date">Recently Added</option>
                        <option value="deadline">Deadline</option>
                        <option value="title">Job Title</option>
                        <option value="company">Company</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

// --- Main WishlistPage component ---
function WishlistPage({ currentUser, wishlistJobs = [], handleApply, handleViewJobDetails, removeFromWishlist }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortBy, setSortBy] = useState('added_date');
    const [isLoading, setIsLoading] = useState(false);

    // --- Generate categories from wishlist jobs ---
    const categories = ['All', ...Array.from(new Set(wishlistJobs.map(job => job.category)))];

    // --- Filter and sort jobs ---
    const filteredJobs = wishlistJobs
        .filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                job.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || job.category === categoryFilter;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'added_date':
                    return new Date(b.added_date) - new Date(a.added_date);
                case 'deadline':
                    return new Date(a.deadline) - new Date(b.deadline);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'company':
                    return a.company.localeCompare(b.company);
                default:
                    return 0;
            }
        });

    // --- Remove job from wishlist ---
    const handleRemoveFromWishlist = (jobId) => {
        if (removeFromWishlist) {
            removeFromWishlist(jobId);
        }
    };

    // --- Handle apply to job ---
    const handleApplyToJob = (job) => {
        if (handleApply) {
            handleApply(job);
        }
    };

    // --- Handle view job details ---
    const handleViewDetails = (job) => {
        if (handleViewJobDetails) {
            handleViewJobDetails(job);
        }
    };

    // --- Clear all wishlist ---
    const handleClearWishlist = () => {
        if (window.confirm('Are you sure you want to clear your entire wishlist? This action cannot be undone.')) {
            // For now, remove each job individually
            wishlistJobs.forEach(job => {
                if (removeFromWishlist) {
                    removeFromWishlist(job.id);
                }
            });
        }
    };

    return (
        <div 
            className="p-6 md:p-8 min-h-screen"
            style={{
                background: 'linear-gradient(to bottom right, #BFDDFF, #ffffff)'
            }}
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Wishlist</h1>
                            <p className="text-gray-600">Jobs you've saved for later consideration</p>
                        </div>
                        
                        {wishlistJobs.length > 0 && (
                            <button
                                onClick={handleClearWishlist}
                                className="mt-4 sm:mt-0 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Clear Wishlist
                            </button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {wishlistJobs.length} saved jobs
                        </span>
                        {filteredJobs.length !== wishlistJobs.length && (
                            <span>({filteredJobs.length} shown)</span>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <FilterBar 
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    categories={categories}
                />

                {/* Loading state */}
                {isLoading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && wishlistJobs.length === 0 && (
                    <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Your wishlist is empty</h3>
                        <p className="text-gray-500 mb-4">Start saving jobs you're interested in to build your wishlist</p>
                        <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                            Browse Jobs
                        </button>
                    </div>
                )}

                {/* No filtered results */}
                {!isLoading && wishlistJobs.length > 0 && filteredJobs.length === 0 && (
                    <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No jobs match your filters</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                    </div>
                )}

                {/* Job Cards */}
                {!isLoading && filteredJobs.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredJobs.map(job => (
                            <JobCard
                                key={job.id}
                                job={job}
                                onRemove={handleRemoveFromWishlist}
                                onViewDetails={handleViewDetails}
                                onApply={handleApplyToJob}
                            />
                        ))}
                    </div>
                )}

                {/* Tips */}
                {!isLoading && wishlistJobs.length > 0 && (
                    <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Wishlist Tips</h3>
                        <ul className="text-blue-700 space-y-2 text-sm">
                            <li>• Check back regularly as application deadlines approach</li>
                            <li>• Use filters to organize your saved jobs by category or deadline</li>
                            <li>• Click "Apply Now" when you're ready to submit your application</li>
                            <li>• Remove jobs that are no longer relevant to keep your list focused</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WishlistPage;