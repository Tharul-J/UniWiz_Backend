// FILE: src/components/EditJob.js

import React, { useState, useEffect } from 'react';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
    </div>
);

const sriLankaDistricts = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
    "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
    "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa",
    "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

function EditJob({ user, jobData, onJobUpdated, onBackClick }) {
    const [formData, setFormData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [currentSkill, setCurrentSkill] = useState('');

    // *** NEW: Check if the job has applications. If so, lock sensitive fields. ***
    const hasApplications = jobData && jobData.application_count > 0;

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://uniwiz-backend.test/api/get_categories.php');
                const data = await response.json();
                if (response.ok) setCategories(data);
            } catch (err) { console.error("Failed to fetch categories:", err); }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (jobData) {
            let payment_type = 'negotiable';
            let price_min = '';
            let price_max = '';
            let fixed_price = '';
            const payment = jobData.payment_range || '';
            if (payment.includes('-')) {
                payment_type = 'range';
                const parts = payment.replace(/Rs.|,/g, '').split('-').map(p => p.trim());
                price_min = parts[0] || '';
                price_max = parts[1] || '';
            } else if (payment.toLowerCase() !== 'negotiable') {
                payment_type = 'fixed';
                fixed_price = payment.replace(/Rs.|,/g, '').trim();
            }

            const locationString = jobData.location || '';
            const locationParts = locationString.split(',');
            let district = '';
            let location = locationString;
            if (locationParts.length > 1 && sriLankaDistricts.includes(locationParts[locationParts.length - 1].trim())) {
                district = locationParts.pop().trim();
                location = locationParts.join(',').trim();
            }
            
            setFormData({
                ...jobData,
                title: jobData.title || '',
                description: jobData.description || '',
                category_id: jobData.category_id || '',
                job_type: jobData.job_type || 'freelance',
                skills_required: jobData.skills_required ? jobData.skills_required.split(',').map(s => s.trim()) : [],
                start_date: jobData.start_date ? new Date(jobData.start_date).toISOString().split('T')[0] : '',
                end_date: jobData.end_date ? new Date(jobData.end_date).toISOString().split('T')[0] : '',
                isSingleDay: jobData.start_date && jobData.start_date === jobData.end_date,
                work_mode: jobData.work_mode || 'on-site',
                location: location,
                district: district,
                application_deadline: jobData.application_deadline ? new Date(jobData.application_deadline).toISOString().split('T')[0] : '',
                vacancies: jobData.vacancies || 1,
                working_hours: jobData.working_hours || '',
                experience_level: jobData.experience_level || 'any',
                payment_type: payment_type,
                price_min: price_min,
                price_max: price_max,
                fixed_price: fixed_price
            });
        }
    }, [jobData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSkillKeyDown = (e) => {
        if (e.key === 'Enter' && currentSkill.trim()) {
            e.preventDefault();
            if (!formData.skills_required.includes(currentSkill.trim())) {
                setFormData(prev => ({ ...prev, skills_required: [...prev.skills_required, currentSkill.trim()] }));
            }
            setCurrentSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setFormData(prev => ({ ...prev, skills_required: prev.skills_required.filter(skill => skill !== skillToRemove) }));
    };

    const handleSubmit = async (status) => {
        if (!formData.title || !formData.description || !formData.category_id) {
            setError('Please fill in all required fields: Title, Description, and Category.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        let payment_range = 'Negotiable';
        if (formData.payment_type === 'range') {
            payment_range = `Rs. ${Number(formData.price_min).toLocaleString()} - Rs. ${Number(formData.price_max).toLocaleString()}`;
        } else if (formData.payment_type === 'fixed') {
            payment_range = `Rs. ${Number(formData.fixed_price).toLocaleString()}`;
        }

        const finalLocation = (formData.work_mode === 'on-site' || formData.work_mode === 'hybrid') ? `${formData.location}, ${formData.district}` : null;
        
        const updatedJobData = {
            ...formData,
            status,
            payment_range,
            location: finalLocation,
            skills_required: formData.skills_required.join(','),
            end_date: formData.isSingleDay ? formData.start_date : formData.end_date
        };

        try {
            const response = await fetch('http://uniwiz-backend.test/api/update_job.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedJobData),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            setSuccess(result.message + " Redirecting...");
            setTimeout(() => onJobUpdated(), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!formData) return <LoadingSpinner />;

    // *** A helper variable for styling disabled inputs ***
    const disabledClass = "bg-gray-100 cursor-not-allowed";

    return (
        <div 
            className="min-h-screen flex justify-center items-start py-12 px-4"
            style={{
                background: 'linear-gradient(to bottom right, #A980FF, #ffffff)'
            }}
        >
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl">
                <button onClick={onBackClick} className="flex items-center text-primary-main font-semibold mb-6 hover:text-primary-dark">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Manage Jobs
                </button>
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-primary-dark">Edit Job Posting</h2>
                    <p className="text-gray-500 mt-2">Update the details for: <span className='font-bold'>{jobData.title}</span></p>
                    {hasApplications && (
                        <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400 text-sm">
                            Since applications have been received for this job, the payment and core details of the job cannot be changed.
                        </div>
                    )}
                </div>
                
                <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                    {/* Core Details */}
                    <div className="p-6 border rounded-xl">
                        <h3 className="text-xl font-semibold text-primary-dark mb-4">Core Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                                <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} className={`shadow-sm border rounded w-full py-3 px-4 ${hasApplications && disabledClass}`} required disabled={hasApplications} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Job Description</label>
                                <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="6" className={`shadow-sm border rounded w-full py-3 px-4 ${hasApplications && disabledClass}`} required disabled={hasApplications}></textarea>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <select id="category_id" name="category_id" value={formData.category_id} onChange={handleChange} className={`shadow-sm bg-white border rounded w-full py-3 px-4 ${hasApplications && disabledClass}`} required disabled={hasApplications}>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Job Type</label>
                                    <select id="job_type" name="job_type" value={formData.job_type} onChange={handleChange} className={`shadow-sm bg-white border rounded w-full py-3 px-4 ${hasApplications && disabledClass}`} disabled={hasApplications}>
                                        <option value="part-time">Part-time</option>
                                        <option value="freelance">Freelance</option>
                                        <option value="task-based">Task-based</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                     {/* Logistics */}
                    <div className="p-6 border rounded-xl">
                         <h3 className="text-xl font-semibold text-primary-dark mb-4">Job Logistics (Editable)</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2" htmlFor="work_mode">Work Mode</label>
                                <select id="work_mode" name="work_mode" value={formData.work_mode} onChange={handleChange} className="shadow-sm bg-white border rounded w-full py-3 px-4">
                                    <option value="on-site">On-site</option>
                                    <option value="remote">Remote</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                            {formData.work_mode !== 'remote' && (
                                <>
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2" htmlFor="district">District</label>
                                        <select id="district" name="district" value={formData.district} onChange={handleChange} className="shadow-sm bg-white border rounded w-full py-3 px-4" required>
                                            <option value="">Select a District</option>
                                            {sriLankaDistricts.sort().map(dist => <option key={dist} value={dist}>{dist}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-700 font-medium mb-2" htmlFor="location">Specific Location / Address</label>
                                        <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} placeholder="e.g., Town Hall, Colombo 07" className="shadow-sm border rounded w-full py-3 px-4" />
                                    </div>
                                </>
                            )}
                             <div>
                                <label className="block text-gray-700 font-medium mb-2" htmlFor="application_deadline">Application Deadline</label>
                                <input id="application_deadline" name="application_deadline" type="date" value={formData.application_deadline} onChange={handleChange} className="shadow-sm border rounded w-full py-3 px-4 text-gray-500 bg-gray-100 cursor-not-allowed" disabled />
                            </div>
                             <div>
                                <label className="block text-gray-700 font-medium mb-2" htmlFor="working_hours">Working Hours</label>
                                <input id="working_hours" name="working_hours" type="text" value={formData.working_hours} onChange={handleChange} placeholder="e.g., 20 hours/week" className="shadow-sm border rounded w-full py-3 px-4" />
                            </div>
                         </div>
                    </div>

                    {/* Specifics */}
                    <div className="p-6 border rounded-xl">
                        <h3 className="text-xl font-semibold text-primary-dark mb-4">Specifics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                                <div className={`flex items-center space-x-4 ${hasApplications && 'opacity-50'}`}>
                                    <label><input type="radio" name="payment_type" value="range" checked={formData.payment_type === 'range'} onChange={handleChange} disabled={hasApplications} /> Range</label>
                                    <label><input type="radio" name="payment_type" value="fixed" checked={formData.payment_type === 'fixed'} onChange={handleChange} disabled={hasApplications} /> Fixed</label>
                                    <label><input type="radio" name="payment_type" value="negotiable" checked={formData.payment_type === 'negotiable'} onChange={handleChange} disabled={hasApplications} /> Negotiable</label>
                                </div>
                            </div>
                            {formData.payment_type === 'range' && (
                                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                    <input type="number" name="price_min" value={formData.price_min} onChange={handleChange} placeholder="Min Price (Rs.)" className={`shadow-sm border rounded py-3 px-4 ${hasApplications && disabledClass}`} disabled={hasApplications} />
                                    <input type="number" name="price_max" value={formData.price_max} onChange={handleChange} placeholder="Max Price (Rs.)" className={`shadow-sm border rounded py-3 px-4 ${hasApplications && disabledClass}`} disabled={hasApplications} />
                                </div>
                            )}
                            {formData.payment_type === 'fixed' && (
                                <div className="md:col-span-2">
                                    <input type="number" name="fixed_price" value={formData.fixed_price} onChange={handleChange} placeholder="Fixed Price (Rs.)" className={`shadow-sm border rounded w-full py-3 px-4 ${hasApplications && disabledClass}`} disabled={hasApplications} />
                                </div>
                            )}
                           <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Required Skills</label>
                                <div className={`flex flex-wrap gap-2 items-center p-2 border rounded-lg ${hasApplications && disabledClass}`}>
                                    {formData.skills_required.map((skill, index) => (
                                        <div key={index} className="flex items-center bg-primary-lighter text-primary-dark px-3 py-1 rounded-full text-sm">
                                            <span>{skill}</span>
                                            {!hasApplications && <button type="button" onClick={() => removeSkill(skill)} className="ml-2 text-primary-dark hover:text-red-500">&times;</button>}
                                        </div>
                                    ))}
                                    <input id="skills_required" type="text" value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)} onKeyDown={handleSkillKeyDown} placeholder="Type a skill and press Enter" className={`flex-grow p-1 outline-none ${hasApplications && 'bg-gray-100'}`} disabled={hasApplications} />
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Number of Vacancies (Editable)</label>
                                <input id="vacancies" name="vacancies" type="number" min="1" value={formData.vacancies} onChange={handleChange} className="shadow-sm border rounded w-full py-3 px-4" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Experience Level</label>
                                <select id="experience_level" name="experience_level" value={formData.experience_level} onChange={handleChange} className={`shadow-sm bg-white border rounded w-full py-3 px-4 ${hasApplications && disabledClass}`} disabled={hasApplications}>
                                    <option value="any">Any</option>
                                    <option value="entry-level">Entry-level</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Job Duration (Editable)</label>
                                <div className="flex items-center space-x-4">
                                    <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="shadow-sm border rounded py-3 px-4 text-gray-500"/>
                                    {!formData.isSingleDay && <span>to</span>}
                                    {!formData.isSingleDay && <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="shadow-sm border rounded py-3 px-4 text-gray-500"/>}
                                    <label><input type="checkbox" name="isSingleDay" checked={formData.isSingleDay} onChange={handleChange} className="mr-2"/> Single Day Job</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                    {success && <p className="text-green-500 text-center mt-4">{success}</p>}
                    
                    <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-4">
                        <button type="button" onClick={() => handleSubmit('draft')} disabled={isLoading} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg transition duration-300 w-full md:w-auto">
                            {isLoading ? 'Saving...' : 'Save as Draft'}
                        </button>
                        <button type="button" onClick={() => handleSubmit('active')} disabled={isLoading} className="bg-primary-main hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg transition duration-300 w-full md:w-auto">
                            {isLoading ? 'Updating...' : 'Update Job'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditJob;