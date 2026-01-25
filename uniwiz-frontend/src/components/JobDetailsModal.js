// FILE: src/components/JobDetailsModal.js
import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://uniwiz-backend.test/api';

// --- Reusable Components ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-main"></div>
    </div>
);
const DetailItem = ({ label, value, children }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        {children ? children : <p className="font-semibold text-gray-800 capitalize">{value || 'Not specified'}</p>}
    </div>
);
const SkillBadge = ({ skill }) => (
    <span className="bg-primary-lighter text-primary-dark font-medium px-3 py-1 rounded-full text-sm capitalize">
        {skill}
    </span>
);
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

function JobDetailsModal({ job, currentUser, isOpen, onClose, handleApply, handleViewCompanyProfile, handleMessagePublisher }) {
    const [jobDetails, setJobDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchJobDetails = useCallback(async () => {
        const jobIdToFetch = job?.job_id || job?.id; 
        if (!jobIdToFetch) {
            setError("No job selected.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            let apiUrl = `${API_BASE_URL}/get_job_details.php?job_id=${jobIdToFetch}`;
            if (currentUser && currentUser.role === 'student') {
                apiUrl += `&student_id=${currentUser.id}`;
            }
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch job details.");
            }
            setJobDetails(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [job, currentUser]);

    useEffect(() => {
        if (isOpen) {
            fetchJobDetails();
        }
    }, [isOpen, fetchJobDetails]);

    if (!isOpen) return null;

    const applicationStatus = jobDetails?.application_status;
    const skills = jobDetails?.skills_required ? jobDetails.skills_required.split(',').map(s => s.trim()) : [];

    const handleCompanyClick = () => {
        if (handleViewCompanyProfile && jobDetails?.publisher_id) {
            handleViewCompanyProfile(jobDetails.publisher_id);
            onClose();
        }
    };

    const onMessageClick = () => {
        if (!handleMessagePublisher || !jobDetails) return;
        const targetInfo = {
            targetUserId: jobDetails.publisher_id,
            targetUserFirstName: '', // Can be fetched if needed
            targetUserLastName: '',
            targetUserCompanyName: jobDetails.company_name,
            jobId: jobDetails.id,
            jobTitle: jobDetails.title
        };
        handleMessagePublisher(targetInfo);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl font-bold z-10">&times;</button>
                
                {isLoading ? <LoadingSpinner /> : error ? <div className="p-8 text-center text-red-500">Error: {error}</div> : !jobDetails ? <div className="p-8 text-center text-gray-500">Job details not found.</div> : (
                    <div className="space-y-6">
                         <div className="flex justify-between items-start">
                             <div>
                                <h1 className="text-3xl font-bold text-primary-dark">{jobDetails.job_title || jobDetails.title}</h1>
                                <button onClick={handleCompanyClick} className="text-lg text-blue-600 hover:text-blue-700 hover:underline text-left mt-1">
                                    {jobDetails.company_name || 'A Reputed Company'}
                                </button>
                            </div>
                            {currentUser && applicationStatus && (
                                <div className="flex-shrink-0 ml-4">
                                    <StatusBadge status={applicationStatus} />
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <h3 className="text-xl font-bold text-primary-dark mb-2 flex items-center"><span className="mr-2">&#9776;</span> Job Description</h3>
                            <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">{jobDetails.description}</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-6 rounded-xl border">
                                <h3 className="text-xl font-bold text-primary-dark mb-4 flex items-center"><span className="mr-2">&#8505;</span> Job Details</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <DetailItem label="Job Type" value={jobDetails.job_type} />
                                    <DetailItem label="Work Mode" value={jobDetails.work_mode} />
                                    <DetailItem label="Location" value={jobDetails.location} />
                                    <DetailItem label="Working Hours" value={jobDetails.working_hours} />
                                    <DetailItem label="Payment/Salary" value={jobDetails.payment_range} />
                                    <DetailItem label="Experience Level" value={jobDetails.experience_level} />
                                    <DetailItem label="Vacancies">
                                        <p className="font-semibold text-gray-800">
                                            <span className="text-green-600 font-bold">{jobDetails.accepted_count || 0}</span> / {jobDetails.vacancies}
                                        </p>
                                    </DetailItem>
                                    <DetailItem label="Application Deadline" value={jobDetails.application_deadline ? new Date(jobDetails.application_deadline).toLocaleDateString() : 'N/A'} />
                                    <DetailItem label="Status" value={jobDetails.status} />
                                    <DetailItem label="Start Date" value={jobDetails.start_date ? new Date(jobDetails.start_date).toLocaleDateString() : 'N/A'} />
                                    <DetailItem label="End Date" value={jobDetails.end_date ? new Date(jobDetails.end_date).toLocaleDateString() : 'N/A'} />
                                    <DetailItem label="Date Posted" value={new Date(jobDetails.created_at).toLocaleString()} />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl border">
                                <h3 className="text-xl font-bold text-primary-dark mb-4 flex items-center"><span className="mr-2">&#10003;</span> Required Skills</h3>
                                {skills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill, index) => <SkillBadge key={index} skill={skill} />)}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No specific skills required.</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-end items-center pt-4 border-t mt-4 space-x-2">
                            {currentUser && currentUser.role === 'student' && (
                                <button 
                                    onClick={onMessageClick}
                                    className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Message
                                </button>
                            )}

                            {currentUser && currentUser.role === 'student' && !applicationStatus && (
                                <button 
                                    onClick={() => {
                                        onClose();
                                        handleApply(jobDetails);
                                    }} 
                                    className="bg-primary-main text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    Apply Now
                                </button>
                            )}
                            {!currentUser && (
                                <button 
                                    onClick={() => { 
                                        onClose();
                                        handleApply(jobDetails); 
                                    }} 
                                    className="bg-gray-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    Sign Up to Apply
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default JobDetailsModal;
