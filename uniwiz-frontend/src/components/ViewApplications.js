// FILE: src/components/ViewApplications.js (FIXED & ENHANCED)
// =================================================================
// This component displays all applications for a specific job, allowing the publisher to view student profiles.

import React, { useState, useEffect } from 'react';

// --- StatusBadge: Shows application status as a colored badge ---
const StatusBadge = ({ status }) => {
    const statusClasses = {
        pending: "bg-yellow-100 text-yellow-800",
        viewed: "bg-blue-100 text-blue-800",
        accepted: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        applied: "bg-gray-100 text-gray-800", // Fallback status
    };
    const appliedStatus = status ? status.toLowerCase() : 'applied';
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${statusClasses[appliedStatus] || statusClasses.applied}`}>
            {status}
        </span>
    );
};

// --- Main ViewApplications component ---
function ViewApplications({ jobId, onBackClick, onViewStudentProfile }) { // Add onViewStudentProfile prop
    // --- State for applications, loading, and error ---
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch applications for the job on mount ---
    useEffect(() => {
        const fetchApplications = async () => {
            if (!jobId) return;
            setIsLoading(true);
            setError(null);
            try {
                // Use the more detailed get_all_publisher_applications endpoint
                // to get student IDs and other potential details.
                const response = await fetch(`http://uniwiz-backend.test/api/get_all_publisher_applications.php?job_id=${jobId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch applications.');
                }
                const data = await response.json();
                setApplications(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchApplications();
    }, [jobId]);

    // --- Main Render: Applications table ---
    return (
        <main className="container mx-auto px-6 py-8">
            <div className="flex items-center mb-8">
                <button onClick={onBackClick} className="text-primary-main hover:text-primary-dark font-semibold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                </button>
            </div>

            <h2 className="text-4xl font-bold text-primary-dark mb-6">Job Applications</h2>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                    {isLoading ? (
                        <p className="text-center text-gray-500 py-8">Loading applications...</p>
                    ) : error ? (
                        <p className="text-center text-red-500 py-8">{error}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {applications.length > 0 ? (
                                        applications.map(app => (
                                            <tr key={app.student_id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {/* Make the name a clickable link */}
                                                    <button 
                                                        onClick={() => onViewStudentProfile(app.student_id)} 
                                                        className="text-primary-main hover:underline"
                                                    >
                                                        {app.first_name} {app.last_name}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(app.applied_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {/* Use the new StatusBadge component */}
                                                    <StatusBadge status={app.status} />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No applications received for this job yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default ViewApplications;
