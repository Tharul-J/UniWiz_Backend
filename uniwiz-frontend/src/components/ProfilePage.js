// FILE: src/components/ProfilePage.js (ENHANCED for Full Image Management & Suggestions)
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Reusable Notification Component
const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const baseClasses = "fixed top-20 right-5 p-4 rounded-lg shadow-xl text-white z-50 transition-all";
    const typeClasses = {
        success: "bg-green-500",
        error: "bg-red-500",
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type] || 'bg-gray-500'}`}>
            {message}
        </div>
    );
};

// Reusable component for showing suggestions
const Suggestions = ({ title, suggestions, onSelect }) => (
    <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2">
            {suggestions.map((item, index) => (
                <button
                    key={index}
                    type="button"
                    onClick={() => onSelect(item)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-primary-lighter hover:text-primary-dark transition-colors"
                >
                    + {item}
                </button>
            ))}
        </div>
    </div>
);

function ProfilePage({ user, onProfileUpdate }) {
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', company_name: '', about: '', industry: '',
        website_url: '', address: '', phone_number: '', facebook_url: '',
        linkedin_url: '', instagram_url: '', university_name: '', field_of_study: '',
        year_of_study: '', languages_spoken: '', preferred_categories: '', skills: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '', key: 0 });

    // State for profile picture
    const [selectedProfilePicture, setSelectedProfilePicture] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const profilePictureInputRef = useRef();

    // State for cover image
    const [selectedCoverImage, setSelectedCoverImage] = useState(null);
    const [coverImagePreview, setCoverImagePreview] = useState(null);
    const [removeCoverImage, setRemoveCoverImage] = useState(false);
    const coverImageInputRef = useRef();

    // State for gallery images
    const [existingGalleryImages, setExistingGalleryImages] = useState([]);
    const [selectedGalleryImages, setSelectedGalleryImages] = useState([]);
    const [galleryImagePreviews, setGalleryImagePreviews] = useState([]);
    const [imagesToRemove, setImagesToRemove] = useState([]);
    const galleryInputRef = useRef();

    // State for CV
    const [selectedCV, setSelectedCV] = useState(null);
    const cvInputRef = useRef();

    // State for suggestions from the backend
    const [suggestions, setSuggestions] = useState({ skills: [], categories: [] });

    // State for required document (BR/NIC)
    const [selectedRequiredDoc, setSelectedRequiredDoc] = useState(null);
    const requiredDocInputRef = useRef();

    // Add a helper to check if publisher is verified (has required_doc_url)
    const isPublisher = user.role === 'publisher';
    const isVerified = isPublisher ? (!!user.required_doc_url || !!selectedRequiredDoc) : true;

    const fetchPublisherImages = useCallback(async () => {
        if (user && user.role === 'publisher') {
            try {
                const response = await fetch(`http://uniwiz-backend.test/api/get_company_profile.php?publisher_id=${user.id}`);
                const data = await response.json();
                if (response.ok && data.gallery_images) {
                    setExistingGalleryImages(data.gallery_images);
                }
            } catch (err) {
                console.error("Failed to fetch gallery images:", err);
            }
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '', last_name: user.last_name || '',
                company_name: user.company_name || '', about: user.about || '',
                industry: user.industry || '', website_url: user.website_url || '',
                address: user.address || '', phone_number: user.phone_number || '',
                facebook_url: user.facebook_url || '', linkedin_url: user.linkedin_url || '',
                instagram_url: user.instagram_url || '', university_name: user.university_name || '',
                field_of_study: user.field_of_study || '', year_of_study: user.year_of_study || '',
                languages_spoken: user.languages_spoken || '', preferred_categories: user.preferred_categories || '',
                skills: user.skills || '',
            });
            setProfilePicturePreview(user.profile_image_url ? `http://uniwiz-backend.test/api/${user.profile_image_url}` : null);
            setCoverImagePreview(user.cover_image_url ? `http://uniwiz-backend.test/api/${user.cover_image_url}` : null);
            fetchPublisherImages();
        }

        // Fetch suggestions for students
        if (user && user.role === 'student') {
            const fetchSuggestions = async () => {
                try {
                    const response = await fetch('http://uniwiz-backend.test/api/get_suggestions.php');
                    const data = await response.json();
                    if (response.ok) {
                        setSuggestions({
                            skills: data.skills || [],
                            categories: data.categories || []
                        });
                    }
                } catch (err) { console.error("Failed to fetch suggestions:", err); }
            };
            fetchSuggestions();
        }
    }, [user, fetchPublisherImages]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const showNotification = (message, type = 'success') => setNotification({ message, type, key: Date.now() });

    const handleProfilePictureChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2097152) { showNotification("Profile picture must be under 2MB.", "error"); return; }
            setSelectedProfilePicture(file);
            setProfilePicturePreview(URL.createObjectURL(file));
        }
    };
    
    const handleCoverImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 4194304) { showNotification("Cover image must be under 4MB.", "error"); return; }
            setSelectedCoverImage(file);
            setCoverImagePreview(URL.createObjectURL(file));
            setRemoveCoverImage(false);
        }
    };

    const handleGalleryImagesChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedGalleryImages(prev => [...prev, ...files]);
            const previews = files.map(file => URL.createObjectURL(file));
            setGalleryImagePreviews(prev => [...prev, ...previews]);
        }
    };

    const handleRemoveNewGalleryImage = (index) => {
        setSelectedGalleryImages(prev => prev.filter((_, i) => i !== index));
        setGalleryImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleCVChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') { showNotification("Only PDF files are allowed for CV.", "error"); return; }
            if (file.size > 5242880) { showNotification("CV file must be under 5MB.", "error"); return; }
            setSelectedCV(file);
        }
    };

    const handleRequiredDocChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
                showNotification("Only PDF, JPG, or PNG files are allowed for BR/NIC.", "error");
                return;
            }
            if (file.size > 5242880) {
                showNotification("Document must be under 5MB.", "error");
                return;
            }
            setSelectedRequiredDoc(file);
        }
    };

    const handleRemoveCoverImage = () => {
        setCoverImagePreview(null);
        setSelectedCoverImage(null);
        setRemoveCoverImage(true);
    };

    const handleRemoveGalleryImage = (id) => {
        if (window.confirm('Are you sure you want to delete this gallery image? This action cannot be undone.')) {
            setImagesToRemove(prev => [...prev, id]);
            setExistingGalleryImages(prev => prev.filter(img => img.id !== id));
            showNotification('Image will be removed when you save your profile.', 'info');
        }
    };
    
    const handleSuggestionSelect = (fieldName, value) => {
        setFormData(prevData => {
            const currentValues = prevData[fieldName] ? prevData[fieldName].split(',').map(s => s.trim()).filter(Boolean) : [];
            if (!currentValues.some(v => v.toLowerCase() === value.toLowerCase())) {
                const newValues = [...currentValues, value];
                return { ...prevData, [fieldName]: newValues.join(', ') };
            }
            return prevData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const submissionData = new FormData();
        submissionData.append('user_id', user.id);
        for (const key in formData) { submissionData.append(key, formData[key]); }
        if (selectedProfilePicture) submissionData.append('profile_picture', selectedProfilePicture);
        if (user.role === 'publisher' && selectedCoverImage) submissionData.append('cover_image', selectedCoverImage);
        if (user.role === 'publisher' && selectedGalleryImages.length > 0) {
            selectedGalleryImages.forEach(file => submissionData.append('company_images[]', file));
        }
        if (user.role === 'publisher' && removeCoverImage) submissionData.append('remove_cover_image', 'true');
        if (user.role === 'publisher' && imagesToRemove.length > 0) submissionData.append('remove_gallery_images', JSON.stringify(imagesToRemove));
        if (user.role === 'student' && selectedCV) submissionData.append('cv_file', selectedCV);
        // Add required_doc for publisher
        if (user.role === 'publisher' && selectedRequiredDoc) submissionData.append('required_doc', selectedRequiredDoc);

        try {
            const response = await fetch('http://uniwiz-backend.test/api/update_profile.php', { method: 'POST', body: submissionData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'An unknown error occurred.');
            
            onProfileUpdate(result.user);
            showNotification("Profile updated successfully!", 'success');
            
            // Reset states
            setSelectedProfilePicture(null); setSelectedCV(null); setSelectedCoverImage(null);
            setSelectedGalleryImages([]); setGalleryImagePreviews([]); setImagesToRemove([]);
            setRemoveCoverImage(false);

        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return <div className="p-8">Loading profile...</div>;

    return (
        <>
            {notification.message && <Notification key={notification.key} message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '', key: 0 })} />}
            <div className={`p-8 min-h-screen text-gray-800 ${user.role === 'publisher' ? 'bg-bg-publisher-dashboard' : 'bg-gray-50'}`}>
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-4xl font-bold text-primary-dark">My Profile</h2>
                        <p className="text-gray-600 mt-1">Manage your personal and professional information.</p>
                    </div>
                    {/* Show verification required message for publishers if not verified */}
                    {isPublisher && !isVerified && (
                        <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
                            <strong>Account verification required:</strong> Please upload your <b>Business Registration Certificate (BR)</b> or <b>NIC</b> for admin review. Your account will not be verified until a valid document is uploaded. You can still update other profile details.
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-md">
                        <div className="flex items-center space-x-6 mb-8">
                            <img src={profilePicturePreview || `https://placehold.co/100x100/E8EAF6/211C84?text=${user.first_name.charAt(0)}`} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-sm"/>
                            <div>
                                <input type="file" ref={profilePictureInputRef} onChange={handleProfilePictureChange} className="hidden" accept="image/*"/>
                                <button type="button" onClick={() => profilePictureInputRef.current.click()} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                                    {user.role === 'publisher' ? 'Add Company Logo' : 'Change Picture'}
                                </button>
                                <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max size of 2MB.</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {/* Personal Info */}
                            <div className="p-6 border rounded-xl">
                                <h3 className="text-xl font-semibold text-primary-dark mb-4 border-b pb-2">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                                        <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                        <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                        <input type="email" value={user.email} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100" readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Publisher Info */}
                            {user.role === 'publisher' && (
                                <>
                                <div className="p-6 border rounded-xl">
                                    <h3 className="text-xl font-semibold text-primary-dark mb-4 border-b pb-2">Company Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                            <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Industry</label>
                                            <input type="text" name="industry" value={formData.industry} placeholder="e.g., IT, Hospitality" className="mt-1 block w-full border rounded-md p-2" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">About Your Company</label>
                                            <textarea name="about" value={formData.about} rows="4" onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Website URL</label>
                                            <input type="url" name="website_url" value={formData.website_url} placeholder="https://example.com" className="mt-1 block w-full border rounded-md p-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                            <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Address</label>
                                            <input type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
                                        </div>
                                        <h4 className="md:col-span-2 text-lg font-semibold text-gray-700 mt-4">Social Media Links</h4>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Facebook URL</label>
                                            <input type="url" name="facebook_url" value={formData.facebook_url} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                                            <input type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
                                            <input type="url" name="instagram_url" value={formData.instagram_url} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 border rounded-xl">
                                    <h3 className="text-xl font-semibold text-primary-dark mb-4 border-b pb-2">Company Visuals</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Cover Photo</label>
                                        {coverImagePreview && <img src={coverImagePreview} alt="Cover preview" className="mt-2 h-48 w-full object-cover rounded-lg"/>}
                                        <input type="file" ref={coverImageInputRef} onChange={handleCoverImageChange} className="hidden" accept="image/*"/>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button type="button" onClick={() => coverImageInputRef.current.click()} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Upload Cover Image</button>
                                            {coverImagePreview && <button type="button" onClick={handleRemoveCoverImage} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Remove</button>}
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700">Company Gallery</label>
                                        {imagesToRemove.length > 0 && (
                                            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
                                                <p className="text-sm text-yellow-800">
                                                    <strong>{imagesToRemove.length}</strong> image(s) marked for deletion. Changes will be saved when you update your profile.
                                                </p>
                                            </div>
                                        )}
                                        <div className="mt-2 grid grid-cols-3 gap-4">
                                            {existingGalleryImages.map(image => (
                                                <div key={image.id} className="relative group">
                                                    <img src={`http://uniwiz-backend.test/api/${image.image_url}`} alt="Gallery item" className="h-24 w-full object-cover rounded-md"/>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveGalleryImage(image.id)} 
                                                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                                                        title="Delete this image"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            {galleryImagePreviews.map((src, index) => (
                                                <div key={index} className="relative group">
                                                    <img src={src} alt={`New gallery item ${index + 1}`} className="h-24 w-full object-cover rounded-md"/>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveNewGalleryImage(index)} 
                                                        className="absolute top-1 right-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                                                        title="Remove this new image"
                                                    >
                                                        ×
                                                    </button>
                                                    <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                                        +
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <input type="file" ref={galleryInputRef} onChange={handleGalleryImagesChange} className="hidden" accept="image/*" multiple/>
                                        <button type="button" onClick={() => galleryInputRef.current.click()} className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Add Gallery Images</button>
                                    </div>
                                </div>
                                {/* BR/NIC Upload Field */}
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700">Business Registration Certificate (BR) or NIC <span className="text-red-500">*</span></label>
                                    <input
                                        type="file"
                                        ref={requiredDocInputRef}
                                        onChange={handleRequiredDocChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-lighter file:text-primary-dark hover:file:bg-primary-light"
                                        accept="application/pdf,image/jpeg,image/png"
                                    />
                                    {selectedRequiredDoc && (
                                        <p className="mt-2 text-sm text-primary-dark">Selected: {selectedRequiredDoc.name}</p>
                                    )}
                                    {/* Show current document if already uploaded */}
                                    {user.required_doc_url && !selectedRequiredDoc && (
                                        <p className="mt-2 text-sm text-green-700">
                                            Current Document: <a href={`http://uniwiz-backend.test/api/${user.required_doc_url}`} target="_blank" rel="noopener noreferrer" className="underline">View/Download</a>
                                        </p>
                                    )}
                                </div>
                                </>
                            )}
                            {/* Student Info */}
                            {user.role === 'student' && (
                                <div className="p-6 border rounded-xl">
                                    <h3 className="text-xl font-semibold text-primary-dark mb-4 border-b pb-2">Educational & Professional Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">University/Institution</label>
                                            <input type="text" name="university_name" value={formData.university_name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Field of Study</label>
                                            <input type="text" name="field_of_study" value={formData.field_of_study} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Year of Study</label>
                                            <select name="year_of_study" value={formData.year_of_study} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white">
                                                <option value="">Select Year</option>
                                                <option value="1st Year">1st Year</option>
                                                <option value="2nd Year">2nd Year</option>
                                                <option value="3rd Year">3rd Year</option>
                                                <option value="4th Year">4th Year</option>
                                                <option value="Graduate">Graduate</option>
                                                <option value="Postgraduate">Postgraduate</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Languages Spoken</label>
                                            <input type="text" name="languages_spoken" value={formData.languages_spoken} placeholder="e.g., Sinhala, English" onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                                        </div>
                                        <div className="md:col-span-2 space-y-3">
                                            <label className="block text-sm font-medium text-gray-700">Skills</label>
                                            <input type="text" name="skills" value={formData.skills} placeholder="e.g., Web Development, Graphic Design" onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                                            {suggestions.skills.length > 0 && 
                                                <Suggestions 
                                                    title="Add from suggestions:"
                                                    suggestions={suggestions.skills}
                                                    onSelect={(skill) => handleSuggestionSelect('skills', skill)}
                                                />
                                            }
                                        </div>
                                        <div className="md:col-span-2 space-y-3">
                                            <label className="block text-sm font-medium text-gray-700">Preferred Job Categories</label>
                                            <input type="text" name="preferred_categories" value={formData.preferred_categories} placeholder="e.g., Event, IT" onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                                            {suggestions.categories.length > 0 &&
                                                <Suggestions 
                                                    title="Add from suggestions:"
                                                    suggestions={suggestions.categories}
                                                    onSelect={(category) => handleSuggestionSelect('preferred_categories', category)}
                                                />
                                            }
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Upload CV (PDF only, max 5MB)</label>
                                            <input 
                                                type="file" 
                                                ref={cvInputRef} 
                                                onChange={handleCVChange}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-lighter file:text-primary-dark hover:file:bg-primary-light"
                                                accept="application/pdf"
                                            />
                                            {user.cv_url && !selectedCV && (
                                                <p className="mt-2 text-sm text-gray-500">
                                                    Current CV: <a href={`http://uniwiz-backend.test/api/${user.cv_url}`} target="_blank" rel="noopener noreferrer" className="text-primary-main hover:underline">View Current CV</a>
                                                </p>
                                            )}
                                            {selectedCV && (
                                                 <p className="mt-2 text-sm text-primary-dark">New CV selected: {selectedCV.name}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end pt-8">
                            <button type="submit" disabled={isLoading} className="px-6 py-3 bg-primary-main text-white font-bold rounded-lg hover:bg-primary-dark transition duration-300 disabled:bg-gray-400">
                                {isLoading ? 'Saving...' : 'Save All Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default ProfilePage;