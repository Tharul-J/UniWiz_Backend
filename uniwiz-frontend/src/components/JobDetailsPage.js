// FILE: src/components/JobDetailsPage.js 
// =====================================================================
// This component displays the full details of a single job for the publisher and students.

import React, { useState, useEffect, useCallback } from 'react';

// --- Reusable Loading Spinner ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-main"></div>
    </div>
);

// --- Reusable Info Card ---
const InfoCard = ({ title, children, icon, className = '' }) => (
    <div className={`bg-white p-6 rounded-xl shadow-md border border-gray-100 ${className}`}>
        <div className="flex items-center mb-4">
            <div className="text-primary-main mr-3">{icon}</div>
            <h3 className="text-xl font-bold text-primary-dark">{title}</h3>
        </div>
        <div className="space-y-4">{children}</div>
    </div>
);

// --- Reusable Detail Item ---
const DetailItem = ({ label, value, children }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        {children ? children : <p className="font-semibold text-gray-800 capitalize">{value || 'Not specified'}</p>}
    </div>
);

// --- Reusable Skill Badge ---
const SkillBadge = ({ skill }) => (
    <span className="bg-primary-lighter text-primary-dark font-medium px-3 py-1 rounded-full text-sm capitalize">
        {skill}
    </span>
);

function JobDetailsPage({ jobId, onBackClick, onDeleteClick, onCompanyClick }) {
    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchJobDetails = useCallback(async () => {
        if (!jobId) {
            setError("No job selected.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`http://uniwiz-backend.test/api/get_job_details.php?job_id=${jobId}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch job details.");
            }
            setJob(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchJobDetails();
    }, [fetchJobDetails]);

    if (isLoading) return <LoadingSpinner />;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!job) return <div className="p-8 text-center text-gray-500">Job details not found.</div>;

    const skills = job.skills_required ? job.skills_required.split(',').map(s => s.trim()) : [];

    // Icons
    const DescriptionIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
    const DetailsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    const SkillsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;

    return (
        <div className="p-8 bg-bg-publisher-dashboard min-h-screen relative">
            {/* Close button */}
            <button onClick={onBackClick} className="absolute top-6 right-8 text-gray-400 hover:text-gray-700 text-3xl font-bold z-10">&times;</button>
            <div className="max-w-5xl mx-auto">
                {/* --- Job Header --- */}
                <div className="bg-white p-8 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-primary-dark">{job.title}</h1>
                        {onCompanyClick ? (
                            <button onClick={() => onCompanyClick(job.publisher_id)} className="text-lg text-blue-600 hover:text-blue-700 hover:underline text-left mt-1">{job.company_name || 'A Reputed Company'}</button>
                        ) : (
                            <p className="text-lg text-gray-600 mt-1">{job.company_name || 'A Reputed Company'}</p>
                        )}
                    </div>
                </div>
                {/* --- Main Content Area --- */}
                <div className="space-y-8">
                    {/* --- Job Description (Full Width) --- */}
                    <InfoCard title="Job Description" icon={DescriptionIcon}>
                        <p className="whitespace-pre-wrap text-base leading-relaxed">{job.description}</p>
                    </InfoCard>
                    {/* --- Details & Skills (Two Columns) --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-start">
                        <InfoCard title="Job Details" icon={DetailsIcon}>
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem label="Job Type" value={job.job_type} />
                                <DetailItem label="Work Mode" value={job.work_mode} />
                                {job.location && <DetailItem label="Location" value={job.location} />}
                                <DetailItem label="Working Hours" value={job.working_hours} />
                                <DetailItem label="Payment/Salary" value={job.payment_range} />
                                <DetailItem label="Experience Level" value={job.experience_level} />
                                <DetailItem label="Vacancies">
                                    <p className="font-semibold text-gray-800">
                                        <span className="text-green-600 font-bold">{job.accepted_count || 0}</span> / {job.vacancies}
                                    </p>
                                </DetailItem>
                                <DetailItem label="Application Deadline" value={job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'N/A'} />
                                <DetailItem label="Status" value={job.status} />
                                <DetailItem label="Start Date" value={job.start_date ? new Date(job.start_date).toLocaleDateString() : 'N/A'} />
                                <DetailItem label="End Date" value={job.end_date ? new Date(job.end_date).toLocaleDateString() : 'N/A'} />
                                <DetailItem label="Date Posted" value={new Date(job.created_at).toLocaleString()} />
                            </div>
                        </InfoCard>
                        <InfoCard title="Required Skills" icon={SkillsIcon}>
                            {skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill, index) => <SkillBadge key={index} skill={skill} />)}
                                </div>
                            ) : (
                                <p className="text-gray-500">No specific skills required.</p>
                            )}
                        </InfoCard>
                    </div>
                </div>
                {/* Delete button for admin */}
                {onDeleteClick && (
                    <div className="flex justify-end mt-8">
                        <button onClick={() => onDeleteClick(job.id)} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">
                            Delete Job
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default JobDetailsPage;
