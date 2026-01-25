// =======================================================
// AdminSettingsPage.js
// -------------------------------------------------------
// This file defines the AdminSettingsPage component for the
// UniWiz admin dashboard. It allows admins to manage job
// categories, skills, and footer links for the platform.
// Includes reusable components for list management and footer
// link management, with API integration and user feedback.
// -------------------------------------------------------
//
// Key Features:
// - Manage job categories and skills (add/delete)
// - Manage footer links for different categories
// - Uses loading, error, and success states for UX
// - API integration for CRUD operations
// =======================================================
import React, { useState, useEffect, useCallback } from 'react';
import { getCategoryColorClass, getAllCategoryColors } from '../../utils/categoryColors';

const API_BASE_URL = 'http://uniwiz-backend.test/api';

// Reusable component to manage a list (Skills or Categories)
// ListManager handles fetching, adding, and deleting items (categories/skills)
const ListManager = ({ title, apiEndpoint }) => {
    // State for list items
    const [items, setItems] = useState([]);
    // State for new item input
    const [newItem, setNewItem] = useState('');
    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState(null);

    // Fetch list data from backend
    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const response = await fetch(`${API_BASE_URL}/${apiEndpoint}`);
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(`Failed to fetch ${title}:`, error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [apiEndpoint, title]);

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Add new item to the list
    const handleAdd = async () => {
        if (!newItem.trim()) return;
        setIsAdding(true);
        try {
            const response = await fetch(`${API_BASE_URL}/${apiEndpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newItem.trim() }),
            });
            if (!response.ok) throw new Error('Failed to add item');
            setNewItem('');
            await fetchData();
        } catch (error) {
            setError(error.message);
        } finally {
            setIsAdding(false);
        }
    };

    // Delete item from the list
    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${title.slice(0, -1).toLowerCase()}?`)) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/${apiEndpoint}?id=${id}`, { 
                method: 'DELETE' 
            });
            if (!response.ok) throw new Error('Failed to delete item');
            await fetchData();
        } catch (error) {
            setError(error.message);
        }
    };

    // Add item on Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleAdd();
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                {title}
            </h3>
            
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Add new ${title.slice(0, -1).toLowerCase()}`}
                    disabled={isAdding}
                />
                <button 
                    onClick={handleAdd} 
                    disabled={isAdding || !newItem.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isAdding ? 'Adding...' : 'Add'}
                </button>
            </div>

            <div className="max-h-60 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No {title.toLowerCase()} found</p>
                ) : (
                    <ul className="space-y-2">
                        {items.map(item => (
                            <li key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-2">
                                    {/* Show color dot and badge for job categories */}
                                    {title === 'Job Categories' && (
                                        <span className={`inline-block w-3 h-3 rounded-full ${getCategoryColorClass(item.name).split(' ')[0]}`}></span>
                                    )}
                                    <span className="text-gray-800">{item.name}</span>
                                    {title === 'Job Categories' && (
                                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColorClass(item.name)}`}>
                                            Auto Color
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => handleDelete(item.id)} 
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                    title={`Delete ${item.name}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

// Enhanced Footer Manager Component
// FooterManager handles editing and saving footer links for the site
const FooterManager = ({ user }) => {
    // State for footer links by category
    const [footerLinks, setFooterLinks] = useState({
        support: [],
        company: [],
        connect: [],
        legal: []
    });
    // Loading, saving, error, and success states
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Fetch footer links from backend
    const fetchFooterLinks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/get_site_settings.php`);
            if (!response.ok) throw new Error('Failed to fetch footer links');
            
            const data = await response.json();
            // Ensure all categories exist with default empty arrays
            const defaultCategories = { support: [], company: [], connect: [], legal: [] };
            setFooterLinks({ ...defaultCategories, ...data });
        } catch (err) {
            console.error('Error fetching footer links:', err);
            setError(err.message);
            // Set default structure on error
            setFooterLinks({ support: [], company: [], connect: [], legal: [] });
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch footer links on mount
    useEffect(() => {
        fetchFooterLinks();
    }, [fetchFooterLinks]);

    // Handle input changes for link text/url
    const handleInputChange = (category, index, field, value) => {
        const updatedLinks = { ...footerLinks };
        if (!updatedLinks[category][index]) {
            updatedLinks[category][index] = { text: '', url: '' };
        }
        updatedLinks[category][index][field] = value;
        setFooterLinks(updatedLinks);
    };

    // Add a new link to a category
    const addLink = (category) => {
        const updatedLinks = { ...footerLinks };
        updatedLinks[category].push({ text: '', url: '' });
        setFooterLinks(updatedLinks);
    };

    // Remove a link from a category
    const removeLink = (category, index) => {
        if (!window.confirm('Are you sure you want to remove this link?')) return;
        
        const updatedLinks = { ...footerLinks };
        updatedLinks[category].splice(index, 1);
        setFooterLinks(updatedLinks);
    };

    // Save footer links to backend
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/update_site_settings.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_id: user.id,
                    settings_type: 'footer_links',
                    settings_value: footerLinks
                })
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to save footer links');
            
            setSuccess('Footer links updated successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error saving footer links:', err);
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Labels for footer link categories
    const categoryLabels = {
        support: 'Support',
        company: 'Company',
        connect: 'Connect',
        legal: 'Legal'
    };

    if (isLoading) {
        return (
            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading Footer Settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                    </svg>
                    Footer Link Management
                </h3>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                    {isSaving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-600 text-sm">{success}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.keys(footerLinks).map(category => (
                    <div key={category} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-700 capitalize">{categoryLabels[category]}</h4>
                            <button 
                                onClick={() => addLink(category)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                title={`Add new ${category} link`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {footerLinks[category].map((link, index) => (
                                <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 font-medium">Link {index + 1}</span>
                                        <button 
                                            onClick={() => removeLink(category, index)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                            title="Remove this link"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={link.text || ''}
                                        onChange={(e) => handleInputChange(category, index, 'text', e.target.value)}
                                        placeholder="Link Text"
                                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={link.url || ''}
                                        onChange={(e) => handleInputChange(category, index, 'url', e.target.value)}
                                        placeholder="URL (e.g., /about, https://example.com)"
                                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            ))}
                            
                            {footerLinks[category].length === 0 && (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No {category} links added yet
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h5 className="font-semibold text-blue-800 mb-2">Instructions:</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Add links to different footer categories (Support, Company, Connect, Legal)</li>
                    <li>• Use relative URLs (e.g., /about) for internal pages</li>
                    <li>• Use full URLs (e.g., https://example.com) for external links</li>
                    <li>• Click "Save Changes" to update the footer on the website</li>
                </ul>
            </div>
        </div>
    );
};

function AdminSettingsPage({ user }) {
    return (
        <div 
            className="p-8 min-h-screen"
            style={{
                background: 'linear-gradient(to bottom right, #E8FFE9, #ffffff)'
            }}
        >
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Platform Settings</h1>
                    <p className="text-gray-600">Manage job categories, skills, and footer links for the platform</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ListManager title="Job Categories" apiEndpoint="manage_categories_admin.php" />
                    <ListManager title="Skills" apiEndpoint="manage_skills_admin.php" />
                </div>
                
                <div className="mt-8">
                    <FooterManager user={user} />
                </div>
            </div>
        </div>
    );
}

export default AdminSettingsPage;
