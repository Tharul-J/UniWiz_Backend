// FILE: src/components/CreateJob.js (ENHANCED with all fields)
// ========================================================================

import React, { useState, useEffect, useRef } from 'react';

// --- InputIcon: Reusable icon wrapper for input fields ---
const InputIcon = ({ children }) => (
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {children}
    </div>
);

// --- Array of Sri Lankan districts ---
const sriLankaDistricts = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
    "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
    "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa",
    "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

// --- CreateJob: Main component for job creation form ---
function CreateJob({ user, onJobPosted }) {
    // --- Form Field States ---
    // (All useState hooks for form fields, payment, modal, etc.)
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [jobType, setJobType] = useState('freelance');
    
    const [paymentType, setPaymentType] = useState('range');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [fixedPrice, setFixedPrice] = useState('');

    const [skills, setSkills] = useState([]);
    const [currentSkill, setCurrentSkill] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSingleDay, setIsSingleDay] = useState(false);

    const [workMode, setWorkMode] = useState('on-site');
    const [location, setLocation] = useState('');
    const [district, setDistrict] = useState('');
    const [applicationDeadline, setApplicationDeadline] = useState('');
    const [vacancies, setVacancies] = useState(1);
    const [workingHours, setWorkingHours] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('any');

    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // --- NEW: Payment States ---
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [transactionDetails, setTransactionDetails] = useState(null);
    
    // Credit Card States
    const [cardNumber, setCardNumber] = useState('');
    const [expiryMonth, setExpiryMonth] = useState('');
    const [expiryYear, setExpiryYear] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardHolder, setCardHolder] = useState(''); // Added for card preview
    
    // Bank Transfer States
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    
    // E-Wallet States
    const [walletType, setWalletType] = useState('ezcash');
    const [walletId, setWalletId] = useState('');

    const [showDeadlineInfo, setShowDeadlineInfo] = useState(false);
    const [calculatedPrice, setCalculatedPrice] = useState('');

    // --- Calculate price based on selected deadline ---
    function getDeadlinePrice(deadline) {
        if (!deadline) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Remove time part
        const d = new Date(deadline);
        d.setHours(0, 0, 0, 0); // Remove time part
        const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) return 0;
        if (diffDays <= 3) return 300;
        if (diffDays <= 7) return 500;
        if (diffDays <= 14) return 750;
        if (diffDays <= 30) return 1000;
        return 0;
    }

    // --- Update payment amount when deadline changes ---
    useEffect(() => {
        const amt = getDeadlinePrice(applicationDeadline);
        setPaymentAmount(amt);
    }, [applicationDeadline]);

    // --- Fetch job categories from backend ---
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://uniwiz-backend.test/api/get_categories.php');
                const data = await response.json();
                if (response.ok) {
                    setCategories(data);
                    if (data.length > 0) setCategoryId(data[0].id);
                }
            } catch (err) { console.error("Failed to fetch categories:", err); }
        };
        fetchCategories();
    }, []);

    // --- Skill input handlers ---
    const handleSkillKeyDown = (event) => {
        if (event.key === 'Enter' && currentSkill.trim() !== '') {
            event.preventDefault();
            if (!skills.includes(currentSkill.trim().toLowerCase())) {
                setSkills([...skills, currentSkill.trim().toLowerCase()]);
            }
            setCurrentSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    // --- Payment Processing Function ---
    const handlePayment = async () => {
        setError(null);
        setCardErrorMsg('');
        setCardFieldErrors({ number: false, holder: false, month: false, year: false, cvv: false });
        if (paymentMethod === 'credit_card') {
            const errors = {
                number: !cardNumber || cardNumber.length < 16,
                holder: !cardHolder,
                month: !expiryMonth || expiryMonth.length < 2,
                year: !expiryYear || expiryYear.length < 2,
                cvv: !cvv || cvv.length < 3
            };
            if (Object.values(errors).some(Boolean)) {
                setCardFieldErrors(errors);
                setCardErrorMsg('Please fill in all card details to proceed.');
                return;
            }
            // --- Simulate payment success ---
            setPaymentProcessing(true);
            setTimeout(async () => {
                // Payment success simulation
                // 1. Prepare jobData from form fields
                let payment_range = '';
                if (paymentType === 'range') {
                    payment_range = `Rs. ${Number(priceMin).toLocaleString()} - Rs. ${Number(priceMax).toLocaleString()}`;
                } else if (paymentType === 'fixed') {
                    payment_range = `Rs. ${Number(fixedPrice).toLocaleString()}`;
                } else {
                    payment_range = 'Negotiable';
                }
                const finalLocation = (workMode === 'on-site' || workMode === 'hybrid') 
                    ? `${location}, ${district}` 
                    : null;
                const jobData = {
                    publisher_id: user.id,
                    category_id: categoryId,
                    title,
                    description,
                    job_type: jobType,
                    payment_range: payment_range,
                    skills_required: skills.join(','),
                    start_date: startDate,
                    end_date: isSingleDay ? startDate : endDate,
                    status: 'active', // or 'draft' if you want admin approval
                    work_mode: workMode,
                    location: finalLocation,
                    application_deadline: applicationDeadline,
                    vacancies: vacancies,
                    working_hours: workingHours,
                    experience_level: experienceLevel
                };
                try {
                    const response = await fetch('http://uniwiz-backend.test/api/create_job.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(jobData),
                    });
                    const result = await response.json();
                    if (response.ok && result.job_id) {
                        setSuccess('Job post successful!');
                        setShowPaymentModal(false);
                        setPaymentSuccess(false);
                        setTransactionDetails(null);
                        if (onJobPosted) onJobPosted();
                    } else {
                        setError(result.message || 'Failed to post job.');
                    }
                } catch (err) {
                    setError('Error posting job.');
                } finally {
                    setPaymentProcessing(false);
                }
            }, 2000);
            return;
        }
        
        setPaymentProcessing(true);
        setError(null);
        
        try {
            const paymentData = {
                job_id: currentJobId,
                payment_method: paymentMethod,
                amount: paymentAmount
            };
            
            // Add method-specific data
            switch (paymentMethod) {
                case 'credit_card':
                    paymentData.card_number = cardNumber;
                    paymentData.expiry_month = expiryMonth;
                    paymentData.expiry_year = expiryYear;
                    paymentData.cvv = cvv;
                    paymentData.card_holder = cardHolder; // Add card holder
                    break;
                case 'bank_transfer':
                    paymentData.bank_name = bankName;
                    paymentData.account_number = accountNumber;
                    break;
                case 'e_wallet':
                    paymentData.wallet_type = walletType;
                    paymentData.wallet_id = walletId;
                    break;
            }
            
            const response = await fetch('http://uniwiz-backend.test/api/process_payment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData),
            });
            
            const result = await response.json();
            
            if (response.ok && result.status === 'completed') {
                setPaymentSuccess(true);
                setTransactionDetails(result);
                setTimeout(() => {
                    setShowPaymentModal(false);
                    setPaymentSuccess(false);
                    setTransactionDetails(null);
                    if (onJobPosted) onJobPosted();
                }, 5000);
            } else {
                throw new Error(result.message || 'Payment failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setPaymentProcessing(false);
        }
    };

    // --- Form field refs for error scrolling ---
    const titleRef = useRef();
    const descriptionRef = useRef();
    const categoryRef = useRef();
    const deadlineRef = useRef();
    const districtRef = useRef();
    const [erroredField, setErroredField] = useState('');

    // --- Form submission handler (validates and posts job) ---
    const validateFields = () => {
        if (!title) {
            setError('Please enter a Job Title.');
            setErroredField('title');
            titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
        if (!description) {
            setError('Please enter a Job Description.');
            setErroredField('description');
            descriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
        if (!categoryId) {
            setError('Please select a Category.');
            setErroredField('category');
            categoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
        if (!applicationDeadline) {
            setError('Please select an Application Deadline.');
            setErroredField('deadline');
            deadlineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
        if ((workMode === 'on-site' || workMode === 'hybrid') && !district) {
            setError('Please select a district for on-site or hybrid jobs.');
            setErroredField('district');
            districtRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
        setErroredField('');
        return true;
    };

    const handleSubmit = async (status) => {
        if (!validateFields()) return;

        if (!title || !description || !categoryId) {
            setError('Please fill in all required fields: Title, Description, and Category.');
            return;
        }

        if (!applicationDeadline) {
            setError('Please select an Application Deadline.');
            return;
        }

        if ((workMode === 'on-site' || workMode === 'hybrid') && !district) {
            setError('Please select a district for on-site or hybrid jobs.');
            return;
        }

        if (paymentType === 'range') {
            if (!priceMin || !priceMax || Number(priceMin) > Number(priceMax) || Number(priceMin) < 0 || Number(priceMax) < 0) {
                setError('Please enter a valid salary range (Min should be less than or equal to Max, both positive numbers).');
                setErroredField('salary');
                return;
            }
        }
        if (paymentType === 'fixed') {
            if (!fixedPrice || Number(fixedPrice) < 0) {
                setError('Please enter a valid fixed salary (positive number).');
                setErroredField('salary');
                return;
            }
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        let payment_range = '';
        if (paymentType === 'range') {
            payment_range = `Rs. ${Number(priceMin).toLocaleString()} - Rs. ${Number(priceMax).toLocaleString()}`;
        } else if (paymentType === 'fixed') {
            payment_range = `Rs. ${Number(fixedPrice).toLocaleString()}`;
        } else {
            payment_range = 'Negotiable';
        }
        
        const finalLocation = (workMode === 'on-site' || workMode === 'hybrid') 
            ? `${location}, ${district}` 
            : null;

        const jobData = {
            publisher_id: user.id,
            category_id: categoryId,
            title,
            description,
            job_type: jobType,
            payment_range: payment_range,
            skills_required: skills.join(','),
            start_date: startDate,
            end_date: isSingleDay ? startDate : endDate,
            status: status,
            work_mode: workMode,
            location: finalLocation,
            application_deadline: applicationDeadline,
            vacancies: vacancies,
            working_hours: workingHours,
            experience_level: experienceLevel
        };

        try {
            const apiUrl = 'http://uniwiz-backend.test/api/create_job.php';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to save job.');

            // --- NEW: Show payment modal if job created successfully ---
            if (result.job_id && result.payment_amount) {
                setCurrentJobId(result.job_id);
                setPaymentAmount(result.payment_amount);
                setShowPaymentModal(true);
            } else {
                setSuccess(result.message + " Redirecting...");
                setTimeout(() => {
                    if (onJobPosted) onJobPosted();
                }, 2000);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Pay button click handler ---
    const handlePayClick = () => {
        if (!validateFields()) return;
        setShowPaymentModal(true);
    };

    // --- Card field error state for payment modal ---
    const [cardFieldErrors, setCardFieldErrors] = useState({ number: false, holder: false, month: false, year: false, cvv: false });
    const [cardErrorMsg, setCardErrorMsg] = useState('');

    const today = new Date().toISOString().split('T')[0];

    // --- Helper to check if application is closed ---
    const isApplicationClosed = applicationDeadline && new Date() > new Date(applicationDeadline + 'T23:59:59');

    // --- Main Render ---
    return (
        <div 
            className="min-h-screen flex justify-center items-start py-12 px-4"
            style={{
                background: 'linear-gradient(to bottom right, #A980FF, #ffffff)'
            }}
        >
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-primary-dark">Create a New Job Posting</h2>
                    <p className="text-gray-500 mt-2">Fill in the details below to find the perfect student.</p>
                </div>
                
                <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                    {/* --- Core Details Section --- */}
                    <div className="p-6 border rounded-xl">
                        <h3 className="text-xl font-semibold text-primary-dark mb-4">Core Details</h3>
                        {/* Job title, description, category, job type */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2" htmlFor="title">Job Title</label>
                                <input id="title" ref={titleRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Part-time Graphic Designer" className={`shadow-sm border rounded w-full py-3 px-4${erroredField==='title' ? ' border-red-500' : ''}`} required />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-2" htmlFor="description">Job Description</label>
                                <textarea id="description" ref={descriptionRef} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the responsibilities, requirements, and any other details..." rows="6" className={`shadow-sm border rounded w-full py-3 px-4${erroredField==='description' ? ' border-red-500' : ''}`} required></textarea>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2" htmlFor="category">Category</label>
                                    <select id="category" ref={categoryRef} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`shadow-sm bg-white border rounded w-full py-3 px-4${erroredField==='category' ? ' border-red-500' : ''}`} required>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2" htmlFor="job-type">Job Type</label>
                                    <select id="job-type" value={jobType} onChange={(e) => setJobType(e.target.value)} className="shadow-sm bg-white border rounded w-full py-3 px-4">
                                        <option value="part-time">Part-time</option>
                                        <option value="freelance">Freelance</option>
                                        <option value="task-based">Task-based</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Job Logistics Section --- */}
                    <div className="p-6 border rounded-xl">
                         <h3 className="text-xl font-semibold text-primary-dark mb-4">Job Logistics</h3>
                         {/* Work mode, district, location, working hours */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2" htmlFor="work-mode">Work Mode</label>
                                <select id="work-mode" value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="shadow-sm bg-white border rounded w-full py-3 px-4">
                                    <option value="on-site">On-site</option>
                                    <option value="remote">Remote</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                            {workMode !== 'remote' && (
                                <>
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2" htmlFor="district">District</label>
                                        <select id="district" ref={districtRef} value={district} onChange={(e) => setDistrict(e.target.value)} className={`shadow-sm bg-white border rounded w-full py-3 px-4${erroredField==='district' ? ' border-red-500' : ''}`} required>
                                            <option value="">Select a District</option>
                                            {sriLankaDistricts.sort().map(dist => <option key={dist} value={dist}>{dist}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-700 font-medium mb-2" htmlFor="location">Specific Location / Address</label>
                                        <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Town Hall, Colombo 07" className="shadow-sm border rounded w-full py-3 px-4" />
                                    </div>
                                </>
                            )}
                             <div>
                                <label className="block text-gray-700 font-medium mb-2" htmlFor="working-hours">Working Hours</label>
                                <input id="working-hours" type="text" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} placeholder="e.g., 20 hours/week" className="shadow-sm border rounded w-full py-3 px-4" />
                            </div>
                         </div>
                    </div>

                    {/* --- Specifics Section --- */}
                    <div className="p-6 border rounded-xl">
                        <h3 className="text-xl font-semibold text-primary-dark mb-4">Specifics</h3>
                        {/* Payment type, salary, skills, vacancies, experience, duration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Payment Type</label>
                                <div className="flex items-center space-x-4">
                                    <label><input type="radio" name="paymentType" value="range" checked={paymentType === 'range'} onChange={(e) => setPaymentType(e.target.value)} /> Range</label>
                                    <label><input type="radio" name="paymentType" value="fixed" checked={paymentType === 'fixed'} onChange={(e) => setPaymentType(e.target.value)} /> Fixed</label>
                                    <label><input type="radio" name="paymentType" value="negotiable" checked={paymentType === 'negotiable'} onChange={(e) => setPaymentType(e.target.value)} /> Negotiable</label>
                                </div>
                            </div>
                            {paymentType === 'range' && (
                                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                    <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Min Price (Rs.)" min="0" className="shadow-sm border rounded py-3 px-4" />
                                    <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Max Price (Rs.)" min={priceMin || 0} className="shadow-sm border rounded py-3 px-4" />
                                </div>
                            )}
                            {paymentType === 'fixed' && (
                                <div className="md:col-span-2">
                                    <input type="number" value={fixedPrice} onChange={e => setFixedPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Fixed Price (Rs.)" min="0" className="shadow-sm border rounded w-full py-3 px-4" />
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <label className="block text-gray-700 font-medium mb-2" htmlFor="skills">Required Skills</label>
                                <div className="flex flex-wrap gap-2 items-center p-2 border rounded-lg">
                                    {skills.map((skill, index) => (
                                        <div key={index} className="flex items-center bg-primary-lighter text-primary-dark px-3 py-1 rounded-full text-sm">
                                            <span>{skill}</span>
                                            <button type="button" onClick={() => removeSkill(skill)} className="ml-2 text-primary-dark hover:text-red-500">&times;</button>
                                        </div>
                                    ))}
                                    <input id="skills" type="text" value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)} onKeyDown={handleSkillKeyDown} placeholder="Type a skill and press Enter" className="flex-grow p-1 outline-none" />
                                </div>
                            </div>
                             <div>
                                <label className="block text-gray-700 font-medium mb-2" htmlFor="vacancies">Number of Vacancies</label>
                                <input id="vacancies" type="number" min="1" value={vacancies} onChange={(e) => setVacancies(e.target.value)} className="shadow-sm border rounded w-full py-3 px-4" />
                            </div>
                             <div>
                                <label className="block text-gray-700 font-medium mb-2" htmlFor="experience">Experience Level</label>
                                <select id="experience" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="shadow-sm bg-white border rounded w-full py-3 px-4">
                                    <option value="any">Any</option>
                                    <option value="entry-level">Entry-level</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>
                             <div className="md:col-span-2">
                                <label className="block text-gray-700 font-medium mb-2">Job Duration</label>
                                <div className="flex items-center space-x-4">
                                    <input type="date" name="start_date" value={startDate} onChange={e => setStartDate(e.target.value)} min={today} className="shadow-sm border rounded py-3 px-4 text-gray-500"/>
                                    {!isSingleDay && <span>to</span>}
                                    {!isSingleDay && <input type="date" name="end_date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || today} className="shadow-sm border rounded py-3 px-4 text-gray-500"/>}
                                    <label><input type="checkbox" checked={isSingleDay} onChange={(e) => setIsSingleDay(e.target.checked)} className="mr-2"/> Single Day Job</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Application Deadline Section --- */}
                    <div className="mt-8">
                        {/* Application deadline input, pricing info modal */}
                        <label className="block text-gray-700 font-medium mb-2 flex items-center" htmlFor="application-deadline">
                            Application Deadline
                            <button type="button" onClick={() => setShowDeadlineInfo(true)} className="ml-2 text-primary-main hover:text-primary-dark focus:outline-none" title="View pricing info">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                                </svg>
                            </button>
                        </label>
                        <input
                            id="application-deadline"
                            ref={deadlineRef}
                            type="date"
                            value={applicationDeadline}
                            onChange={e => setApplicationDeadline(e.target.value)}
                            min={today}
                            max={isSingleDay ? startDate : (endDate || startDate)}
                            className={`shadow-sm border rounded w-full py-3 px-4 text-gray-500${erroredField==='deadline' ? ' border-red-500' : ''}`}
                            required
                        />
                        {/* Show post price below deadline field */}
                        {applicationDeadline && (
                            <div className="mt-1 text-sm text-primary-main font-semibold flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                                {`Post Price: Rs. ${getDeadlinePrice(applicationDeadline).toLocaleString()}`}
                            </div>
                        )}
                        {showDeadlineInfo && (
                            <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
                                <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full relative">
                                    <button onClick={() => setShowDeadlineInfo(false)} className="absolute top-2 right-2 text-gray-400 hover:text-primary-main">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    <h4 className="text-lg font-bold mb-2 text-primary-dark">Job Posting Pricing</h4>
                                    <ul className="text-gray-700 text-sm space-y-1">
                                        <li>Per 1 ad:</li>
                                        <li>24hrs <b>free*</b></li>
                                        <li>3 days - 300/=</li>
                                        <li>7 days - 500/=</li>
                                        <li>14 days - 750/=</li>
                                        <li>30 days - 1000/=</li>
                                    </ul>
                                    <div className="mt-3 text-xs text-gray-500">*First 24 hours are free for each job post.</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- Error and Success Messages --- */}
                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                    {success && <p className="text-green-500 text-center mt-4">{success}</p>}
                    
                    {/* --- Form Action Buttons --- */}
                    <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-4">
                        <button type="button" onClick={() => handleSubmit('draft')} disabled={isLoading} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg transition duration-300 w-full md:w-auto">
                            {isLoading ? 'Saving...' : 'Save as Draft'}
                        </button>
                        <button type="button" onClick={handlePayClick} disabled={isLoading} className="bg-primary-main hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg transition duration-300 w-full md:w-auto">
                            {isLoading ? 'Processing...' : 'Pay'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* --- Payment Modal --- */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-0 md:p-0 max-w-3xl w-full max-h-[95vh] overflow-y-auto flex flex-col md:flex-row shadow-2xl">
                        {/* --- Card Form Section --- */}
                        <div className="flex-1 p-8 flex flex-col justify-center">
                            {/* Card preview, payment forms, error messages, pay button */}
                            <div className="mb-6 text-center">
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Complete Payment</h3>
                                <p className="text-gray-600">Pay Rs. {paymentAmount.toLocaleString()} to post your job</p>
                            </div>
                            {/* Card Preview */}
                            <div className="mb-8 flex justify-center">
                                <div className="relative w-80 h-48 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl shadow-lg p-6 text-white flex flex-col justify-between">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold tracking-widest">{cardNumber ? cardNumber.replace(/(.{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}</span>
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" alt="Card Logo" className="h-8 w-12 object-contain" />
                                    </div>
                                    <div className="flex justify-between items-end mt-6">
                                        <div>
                                            <div className="text-xs uppercase tracking-wide">Card Holder</div>
                                            <div className="font-semibold text-base">{cardHolder || 'Your Name'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wide">Expires</div>
                                            <div className="font-semibold text-base">{expiryMonth && expiryYear ? `${expiryMonth.toString().padStart(2, '0')}/${expiryYear.toString().slice(-2)}` : 'MM/YY'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Show pay amount for all payment methods */}
                            {['credit_card', 'bank_transfer', 'e_wallet'].includes(paymentMethod) && (
                                <div className="mb-2 text-center text-lg font-semibold text-primary-dark">
                                    You have to pay: Rs. {getDeadlinePrice(applicationDeadline).toLocaleString()}
                                </div>
                            )}
                            {/* Card Form */}
                            {paymentMethod === 'credit_card' && (
                                <>
                                    <div className="space-y-4">
                                        <input type="text" placeholder="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, '').slice(0,16))} className={`w-full p-3 border rounded-lg tracking-widest text-lg${cardFieldErrors.number ? ' border-red-500' : ''}`} maxLength="16" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="text" placeholder="Card Holder Name" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} className={`p-3 border rounded-lg col-span-2${cardFieldErrors.holder ? ' border-red-500' : ''}`} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <input type="text" placeholder="MM" value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value.replace(/[^0-9]/g, '').slice(0,2))} className={`p-3 border rounded-lg${cardFieldErrors.month ? ' border-red-500' : ''}`} maxLength="2" />
                                            <input type="text" placeholder="YY" value={expiryYear} onChange={(e) => setExpiryYear(e.target.value.replace(/[^0-9]/g, '').slice(0,2))} className={`p-3 border rounded-lg${cardFieldErrors.year ? ' border-red-500' : ''}`} maxLength="2" />
                                            <input type="text" placeholder="CVV" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, '').slice(0,4))} className={`p-3 border rounded-lg${cardFieldErrors.cvv ? ' border-red-500' : ''}`} maxLength="4" />
                                        </div>
                                    </div>
                                    {cardErrorMsg && <div className="text-red-500 text-sm mt-2 text-center">{cardErrorMsg}</div>}
                                </>
                            )}
                            {/* Bank Transfer Form */}
                            {paymentMethod === 'bank_transfer' && (
                                <div className="space-y-4">
                                    <input type="text" placeholder="Bank Name (e.g., Bank of Ceylon)" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full p-3 border rounded-lg" />
                                    <input type="text" placeholder="Account Number (e.g., 1234567890)" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full p-3 border rounded-lg" />
                                </div>
                            )}
                            {/* E-Wallet Form */}
                            {paymentMethod === 'e_wallet' && (
                                <div className="space-y-4">
                                    <select value={walletType} onChange={(e) => setWalletType(e.target.value)} className="w-full p-3 border rounded-lg">
                                        <option value="ezcash">eZ Cash</option>
                                        <option value="mobitel_money">Mobitel Money</option>
                                    </select>
                                    <input type="text" placeholder="Wallet ID/Phone Number (e.g., 0771234567)" value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full p-3 border rounded-lg" />
                                </div>
                            )}
                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                            <div className="flex gap-3 pt-6">
                                <button onClick={() => setShowPaymentModal(false)} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium">
                                    Cancel
                                </button>
                                <button onClick={handlePayment} disabled={paymentProcessing} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition-all">
                                    {paymentProcessing ? 'Processing...' : `Pay Rs. ${paymentAmount.toLocaleString()}`}
                                </button>
                            </div>
                        </div>
                        {/* --- Order Summary Section --- */}
                        <div className="hidden md:flex flex-col justify-between bg-gray-50 rounded-r-2xl p-8 w-96 border-l">
                            {/* Order summary, help, footer */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <img src="/logo.png" alt="UniWiz Logo" className="h-10" />
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Secure</span>
                                </div>
                                <div className="mb-8">
                                    <h4 className="text-lg font-bold text-gray-800 mb-2">Order Summary</h4>
                                    <div className="text-gray-700 text-sm space-y-1">
                                        <div className="flex justify-between"><span>Job Posting</span><span>Rs. {getDeadlinePrice(applicationDeadline).toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>Service Fee</span><span>Rs. 0</span></div>
                                        <div className="flex justify-between font-semibold"><span>Total</span><span>Rs. {getDeadlinePrice(applicationDeadline).toLocaleString()}</span></div>
                                    </div>
                                </div>
                                <div className="mb-8">
                                    <h4 className="text-lg font-bold text-gray-800 mb-2">Need Help?</h4>
                                    <p className="text-gray-600 text-sm">Contact our support team for any payment issues or questions.</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400 mt-8">
                                <span>&copy; {new Date().getFullYear()} UniWiz</span>
                                <span>Powered by UniWiz</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateJob;