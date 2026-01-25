// FILE: src/components/ViewApplicants.js (Final Version)
// =================================================================
// This component shows all applicants for a specific job.
// Displays them in a table format with detailed modal view.

import React, { useState, useEffect, useRef } from 'react';
import StudentReviewsReceived from './StudentReviewsDisplay';

// --- Notification: Shows a temporary message at the top right ---
const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(), 3000);
        return () => clearTimeout(timer);
    }, [onClose]);
    const typeClasses = { success: "bg-green-500", error: "bg-red-500" };
    return (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-xl text-white z-50 transition-all ${typeClasses[type] || 'bg-gray-500'}`}>
            {message}
        </div>
    );
};

// --- LoadingSpinner: Shows a loading animation while fetching data ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
    </div>
);

// --- StatusBadge: Shows application status as a colored badge ---
const StatusBadge = ({ status }) => {
    const statusMap = {
        pending: "bg-yellow-100 text-yellow-800",
        viewed: "bg-blue-100 text-blue-800",
        accepted: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        default: "bg-gray-100 text-gray-800"
    };
    return <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${statusMap[status] || statusMap.default}`}>{status}</span>;
};

// --- ApplicantDetailModal: Shows detailed info about an applicant ---
const ApplicantDetailModal = ({ applicant, onClose, onStatusChange, handleInitiateConversation }) => {
    const [currentStatus, setCurrentStatus] = useState(applicant ? applicant.status : '');
    const modalRef = useRef();

    // --- Mark as viewed if opened and status is pending ---
    useEffect(() => {
        if (applicant && applicant.status === 'pending') {
            onStatusChange(applicant.application_id, 'viewed', false);
            setCurrentStatus('viewed');
        } else if (applicant) {
            setCurrentStatus(applicant.status);
        }
    }, [applicant, onStatusChange]);
    
    // --- Close modal on Escape key ---
    useEffect(() => {
        const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!applicant) return null;

    // --- Handle status change buttons ---
    const handleStatusButtonClick = (newStatus) => {
        onStatusChange(applicant.application_id, newStatus, true);
        setCurrentStatus(newStatus);
    };

    // --- Handle message button click ---
    const onMessageClick = () => {
        const targetInfo = {
            targetUserId: applicant.student_id,
            targetUserFirstName: applicant.first_name,
            targetUserLastName: applicant.last_name,
            targetUserCompanyName: '',
            jobId: applicant.job_id,
            jobTitle: applicant.job_title
        };
        handleInitiateConversation(targetInfo);
        onClose();
    };

    const canTakeAction = currentStatus === 'pending' || currentStatus === 'viewed';
    const skills = applicant.skills ? applicant.skills.split(',').map(s => s.trim()) : [];

    // --- Main Render: Applicant details modal layout ---
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40 p-4" onClick={onClose}>
            <div ref={modalRef} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 text-3xl font-bold z-10">&times;</button>
                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 border-b pb-6 mb-6">
                    <div className="flex items-center gap-6">
                        <img
                            src={applicant.profile_image_url ? `http://uniwiz-backend.test/api/${applicant.profile_image_url}` : `https://placehold.co/100x100/E8EAF6/211C84?text=${applicant.first_name.charAt(0)}`}
                            alt="Profile"
                            className="h-24 w-24 rounded-full object-cover border-4 border-primary-lighter shadow-md"
                        />
                        <div>
                            <h2 className="text-3xl font-bold text-primary-dark">{applicant.first_name} {applicant.last_name}</h2>
                            <p className="text-gray-600">{applicant.field_of_study || 'Student'}</p>
                            <p className="text-sm text-gray-500 mt-1">Email: <span className="font-semibold">{applicant.email}</span></p>
                            <p className="text-sm text-gray-500">Applied for: <span className="font-semibold">{applicant.job_title}</span> on <span className="font-semibold">{new Date(applicant.applied_at).toLocaleDateString()}</span></p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-center md:items-end gap-3">
                        <StatusBadge status={currentStatus} />
                        <div className="flex space-x-2 mt-2">
                             <button onClick={onMessageClick} className="px-4 py-2 bg-primary-main text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors text-sm">Message</button>
                            {canTakeAction && (
                                <>
                                <button onClick={() => handleStatusButtonClick('rejected')} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-sm">Reject</button>
                                <button onClick={() => handleStatusButtonClick('accepted')} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors text-sm">Accept</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Proposal</h3>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border">{applicant.proposal || 'No proposal provided.'}</p>
                        </div>
                        <div>
                             <h3 className="text-lg font-bold text-gray-800 mb-2">Educational Background</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                                <p><strong className="font-medium text-gray-500 block">University:</strong> {applicant.university_name || 'N/A'}</p>
                                <p><strong className="font-medium text-gray-500 block">Field of Study:</strong> {applicant.field_of_study || 'N/A'}</p>
                                <p><strong className="font-medium text-gray-500 block">Year of Study:</strong> {applicant.year_of_study || 'N/A'}</p>
                             </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                         <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {skills.length > 0 ? skills.map((skill, index) => (
                                    <span key={index} className="bg-primary-lighter text-primary-dark font-medium px-3 py-1 rounded-full text-sm">{skill}</span>
                                )) : <p className="text-gray-500 text-sm">No skills specified.</p>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Languages</h3>
                             <p className="text-gray-700">{applicant.languages_spoken || 'Not specified'}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Resume / CV</h3>
                            {applicant.cv_url ? (
                                <a href={`http://uniwiz-backend.test/api/${applicant.cv_url}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-primary-main text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">
                                    Download CV
                                </a>
                            ) : (
                                <p className="text-gray-500 text-sm">CV has not been uploaded.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Student Reviews Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <StudentReviewsReceived 
                        studentId={applicant.student_id} 
                        showInModal={true}
                    />
                </div>
            </div>
        </div>
    );
};

// --- Main ViewApplicants component ---
function ViewApplicants({ job, onBack, handleInitiateConversation }) {
    // --- State for applicants, loading, error, modal, notification ---
    const [applicants, setApplicants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '', key: 0 });

    // --- Show notification message ---
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, key: Date.now() });
    };

    // --- Handle status change for an application ---
    const handleStatusChange = async (applicationId, newStatus, showNotif = true) => {
        try {
            const response = await fetch(`http://uniwiz-backend.test/api/update_application_status.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ application_id: applicationId, status: newStatus }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            if (showNotif) showNotification(result.message, 'success');
            setApplicants(prev => 
                prev.map(app => 
                    app.application_id === applicationId ? { ...app, status: newStatus } : app
                )
            );
        } catch (err) {
            if (showNotif) showNotification(`Error: ${err.message}`, 'error');
        }
    };
    
    // --- Fetch applicants for the job on mount ---
    useEffect(() => {
        const fetchApplicants = async () => {
            if (!job || !job.id) return;
            setIsLoading(true);
            setError(null);
            try {
                const url = `http://uniwiz-backend.test/api/get_all_publisher_applications.php?job_id=${job.id}`;
                const response = await fetch(url);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to fetch applicants.');
                setApplicants(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchApplicants();
    }, [job]);

    // --- Open applicant details modal ---
    const handleViewDetails = (applicant) => {
        setSelectedApplicant(applicant);
        setIsModalOpen(true);
    };
    
    // --- Close applicant details modal ---
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedApplicant(null);
    };
    
    // --- Handle status update from table actions ---
    const handleStatusUpdateInTable = (e, applicationId, newStatus) => {
        e.stopPropagation();
        handleStatusChange(applicationId, newStatus, true);
    };

    // --- Main Render: Applicants table and modal ---
    return (
        <div className="p-8 bg-bg-publisher-dashboard min-h-screen">
            {notification.message && <Notification key={notification.key} message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '', key: 0 })} />}
            {isModalOpen && <ApplicantDetailModal applicant={selectedApplicant} onClose={handleCloseModal} onStatusChange={handleStatusChange} handleInitiateConversation={handleInitiateConversation} />}
            
            <div className="flex justify-between items-center mb-8">
                <div>
                    <button onClick={onBack} className="text-primary-main hover:text-primary-dark font-semibold flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Jobs List
                    </button>
                    <h2 className="text-3xl font-bold text-gray-800">Applicants for: <span className="italic">{job.title}</span></h2>
                </div>
            </div>
            
            {isLoading ? <LoadingSpinner /> : error ? <div className="text-center py-16 text-red-500 bg-white rounded-xl shadow-md">{error}</div> : applicants.length > 0 ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {applicants.map(applicant => (
                                    <tr key={applicant.application_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetails(applicant)}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full object-cover" src={applicant.profile_image_url ? `http://uniwiz-backend.test/api/${applicant.profile_image_url}` : `https://placehold.co/40x40/E8EAF6/211C84?text=${applicant.first_name.charAt(0)}`} alt="" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{applicant.first_name} {applicant.last_name}</div>
                                                    <div className="text-sm text-gray-500">{applicant.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(applicant.applied_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center"><StatusBadge status={applicant.status} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {(applicant.status === 'pending' || applicant.status === 'viewed') && (
                                                <>
                                                    <button onClick={(e) => handleStatusUpdateInTable(e, applicant.application_id, 'accepted')} className="text-green-600 hover:text-green-800 font-semibold">Accept</button>
                                                    <button onClick={(e) => handleStatusUpdateInTable(e, applicant.application_id, 'rejected')} className="text-red-600 hover:text-red-800 font-semibold">Reject</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">No Applicants Found</h3>
                    <p className="text-gray-500 mt-2">There are currently no applications for this job.</p>
                </div>
            )}
        </div>
    );
}

export default ViewApplicants;