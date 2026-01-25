// =======================================================
// JobManagement.js
// -------------------------------------------------------
// This file defines the JobManagement component for the
// UniWiz admin dashboard. It allows admins to view, filter,
// approve, reject, close, reopen, and delete job postings.
// Includes reusable components for notifications, status
// badges, and dropdowns. Integrates with backend APIs.
// -------------------------------------------------------
//
// Key Features:
// - Fetches and displays all jobs with filters and search
// - Allows admin to approve, reject, close, reopen, delete jobs
// - Uses notification toasts and loading spinners
// - Debounced search and filter updates
// =======================================================
// FILE: src/components/admin/JobManagement.js 
// =======================================================
// This page allows administrators to view, filter, and manage job postings,
// including approving, rejecting, closing, reopening, and deleting jobs.

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Reusable Notification Component (Toast)
// Shows a notification message for success/error actions
const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const typeClasses = { success: "bg-green-500", error: "bg-red-500" };
    return (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-xl text-white z-50 transition-all ${typeClasses[type] || 'bg-gray-500'}`}>
            {message}
        </div>
    );
};

// Reusable Loading Spinner
// Shows a spinner while loading data
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
    </div>
);

// Reusable Job Status Badge
// Shows a colored badge for job status (active, draft, closed, expired)
const JobStatusBadge = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full capitalize";
    const statusClasses = {
        active: "bg-green-100 text-green-800",
        draft: "bg-yellow-100 text-yellow-800",
        closed: "bg-red-100 text-red-800",
        expired: "bg-gray-100 text-gray-800", // Added expired status class
    };
    return <span className={`${baseClasses} ${statusClasses[status] || statusClasses.draft}`}>{status}</span>;
};

// Actions Dropdown Component for Job Management
// Shows a dropdown menu for each job with actions (approve, close, delete, etc.)
const ActionsDropdown = ({ job, onAction, onViewDetails }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMenuAction = (actionType) => {
        onAction(job.id, actionType);
        setIsOpen(false);
    };

    const handleViewDetailsClick = () => {
        onViewDetails(job.id);
        setIsOpen(false);
    };

    // Determine effective status for display and actions
    const isExpired = job.application_deadline && new Date(job.application_deadline) < new Date();
    const currentStatus = isExpired ? 'expired' : job.status; // Use 'expired' if deadline passed

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-2 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-primary-main"
                id={`options-menu-${job.id}`}
                aria-haspopup="true"
                aria-expanded="true"
            >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby={`options-menu-${job.id}`}
                >
                    <div className="py-1" role="none">
                        {/* View job details */}
                        <button onClick={handleViewDetailsClick} className="text-primary-main block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left" role="menuitem">View Details</button>
                        <div className="my-1 border-t border-gray-100"></div> {/* Divider */}

                        {/* Approve/Reject/Close/Reopen actions based on job status */}
                        {currentStatus === 'draft' && (
                            <>
                                <button onClick={() => handleMenuAction('active')} className="text-green-600 block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left" role="menuitem">Approve</button>
                                <button onClick={() => handleMenuAction('closed')} className="text-red-600 block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left" role="menuitem">Reject</button>
                            </>
                        )}
                        {currentStatus === 'active' && (
                            <button onClick={() => handleMenuAction('closed')} className="text-red-600 block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left" role="menuitem">Close Job</button>
                        )}
                        {(currentStatus === 'closed' || currentStatus === 'expired') && (
                            <button onClick={() => handleMenuAction('active')} className="text-green-600 block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left" role="menuitem">Reopen Job</button>
                        )}
                        {/* Delete job */}
                        <button onClick={() => handleMenuAction('delete')} className="text-red-600 block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left" role="menuitem">Delete Job</button>
                    </div>
                </div>
            )}
        </div>
    );
};


function JobManagement({ user, setPage, setSelectedJobIdForDetailsPage, initialFilter }) { // NEW: Added initialFilter prop
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'active', 'draft', 'closed', 'expired'
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'
    const [notification, setNotification] = useState({ message: '', type: '', key: 0 });

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, key: Date.now() });
    };

    // FIXED: Apply initialFilter when component mounts or initialFilter changes
    useEffect(() => {
        if (initialFilter && initialFilter.filter) {
            setStatusFilter(initialFilter.filter);
        }
    }, [initialFilter]);


    const fetchAllJobs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                search: searchTerm,
                status: statusFilter, // Send statusFilter directly
                sort_order: sortOrder, // Send sort order
            });
            const response = await fetch(`http://uniwiz-backend.test/api/get_all_jobs_admin.php?${params.toString()}`);
            const data = await response.json();
            if (response.ok) {
                setJobs(data);
            } else {
                throw new Error(data.message || 'Failed to fetch jobs.');
            }
        } catch (err) {
            setError(err.message);
            showNotification(`Error: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter, sortOrder]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchAllJobs();
        }, 300); // Debounce search input
        return () => clearTimeout(delayDebounceFn);
    }, [fetchAllJobs]);

    // Handle job actions (Approve, Reject, Close, Reopen, Delete)
    const handleJobAction = async (jobId, actionType) => {
        if (!user || !user.id) {
            showNotification("Admin user not identified. Cannot perform action.", "error");
            return;
        }

        let apiUrl = '';
        let payload = { job_id: jobId, admin_id: user.id };
        let successMessage = '';
        let errorMessage = '';

        switch (actionType) {
            case 'active': // Approve or Reopen
                apiUrl = 'http://uniwiz-backend.test/api/update_job_status_admin.php';
                payload.status = 'active';
                successMessage = 'Job approved/reopened successfully!';
                errorMessage = 'Failed to approve/reopen job.';
                break;
            case 'closed': // Reject or Close
                apiUrl = 'http://uniwiz-backend.test/api/update_job_status_admin.php';
                payload.status = 'closed';
                successMessage = 'Job rejected/closed successfully!';
                errorMessage = 'Failed to reject/close job.';
                break;
            case 'delete':
                apiUrl = 'http://uniwiz-backend.test/api/manage_job_action_admin.php'; 
                payload.action = 'delete'; 
                successMessage = 'Job deleted successfully!';
                errorMessage = 'Failed to delete job.';
                break;
            default:
                showNotification("Invalid action.", "error");
                return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || errorMessage);
            
            showNotification(successMessage, 'success');
            fetchAllJobs(); // Re-fetch jobs to update the list

        } catch (err) {
            showNotification(`Error: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle viewing job details
    const handleViewJobDetails = (jobId) => {
        setSelectedJobIdForDetailsPage(jobId);
        setPage('view-job-details');
    };

    // Memoized jobs list to include display_status
    const displayedJobs = useMemo(() => {
        return jobs.map(job => {
            const isExpired = job.application_deadline && new Date(job.application_deadline) < new Date();
            return {
                ...job,
                // If the job is active but its deadline has passed, display as 'expired'
                // Otherwise, use its actual status from the database
                display_status: isExpired && job.status === 'active' ? 'expired' : job.status
            };
        });
    }, [jobs]);

    const statusTabs = ['All', 'draft', 'active', 'closed', 'expired'];
    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
    ];

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
            <div 
                className="p-8 min-h-screen"
                style={{
                    background: 'linear-gradient(to bottom right, #E8FFE9, #ffffff)'
                }}
            >
                <h1 className="text-4xl font-bold text-primary-dark mb-8">Job Management & Approval</h1>

                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <input 
                        type="text"
                        placeholder="Search by job title or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="shadow-sm border rounded-lg py-2 px-4 w-full md:w-80"
                    />
                    <div className="bg-white p-1 rounded-lg flex space-x-1 shadow-sm border border-gray-200">
                        {statusTabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`px-3 py-1.5 rounded-md font-semibold text-sm transition-colors capitalize ${
                                    statusFilter === tab ? 'bg-primary-main text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <select 
                        value={sortOrder} 
                        onChange={(e) => setSortOrder(e.target.value)} 
                        className="shadow-sm border rounded-lg py-2 px-4 bg-white"
                    >
                        {sortOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publisher</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr><td colSpan="5" className="text-center py-8"><LoadingSpinner /></td></tr>
                                ) : error ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-red-500">{error}</td></tr>
                                ) : displayedJobs.length > 0 ? ( // Use displayedJobs here
                                    displayedJobs.map(job => (
                                        <tr key={job.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.company_name || `${job.first_name} ${job.last_name}`}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(job.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm"><JobStatusBadge status={job.display_status} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <ActionsDropdown 
                                                    job={job} 
                                                    onAction={handleJobAction} 
                                                    onViewDetails={handleViewJobDetails} 
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">No jobs found matching your criteria.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default JobManagement;