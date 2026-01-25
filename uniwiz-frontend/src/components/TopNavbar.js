// FILE: src/components/TopNavbar.js (ENHANCED with Role-Based Theming)
// =================================================================================
// This version dynamically changes the color of notifications and other elements
// based on the logged-in user's role (student, publisher, or admin).

import React, { useState, useEffect, useRef } from 'react';

// --- NotificationIcon: Shows notification icon with color based on type and user role ---
const NotificationIcon = ({ type, role }) => {
    // Define base colors for each role
    const roleColors = {
        student: 'text-blue-500',
        publisher: 'text-primary-main', // Indigo
        admin: 'text-green-500',
        default: 'text-gray-500'
    };

    // Map notification types to SVG icons
    const iconMap = {
        new_applicant: (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${roleColors.publisher}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        application_accepted: (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${roleColors.student}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        application_rejected: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        new_review: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ),
        // --- User-specific notification icons ---
        account_blocked: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
        account_unblocked: <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${roleColors[role] || roleColors.default}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.276a11.952 11.952 0 01-1.296-.682A4.992 4.992 0 0017 12a4.992 4.992 0 00-3.678-4.712M15 17H3v-1a6 6 0 0112 0v1zm-3 4h.01M12 3v1m0 16v1m9.356-9.356l-.682-.296M15 5.618l-.296-.682m-4.276 5.618a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
        account_verified: <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${roleColors[role] || roleColors.default}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        account_unverified: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        // --- Admin notification icons ---
        new_user_registration: <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${roleColors.admin}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
        new_job_pending_approval: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        default: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
    };
    
    // Determine background color based on user role for unread notifications
    const unreadBgColor = {
        student: 'bg-blue-50',
        publisher: 'bg-primary-lighter/50',
        admin: 'bg-green-50'
    };

    return (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${unreadBgColor[role] || 'bg-gray-100'}`}>
            {iconMap[type] || iconMap.default}
        </div>
    );
};

// --- Main TopNavbar Component ---
function TopNavbar({ user, setPage, notifications, onNotificationClick }) {
    // --- State for notification dropdown ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // --- Count unread notifications ---
    const unreadCount = notifications.filter(n => !n.is_read).length;

    // --- Determine notification badge color based on role ---
    const badgeColor = {
        student: 'bg-blue-500',
        publisher: 'bg-primary-main',
        admin: 'bg-green-600',
    }[user?.role] || 'bg-red-500';

    // --- Close dropdown when clicking outside ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    // --- Handle notification item click ---
    const handleItemClick = (notification) => {
        onNotificationClick(notification);
        setIsDropdownOpen(false); // Close dropdown after clicking an item
    };
    
    // --- Format time since notification ---
    const timeSince = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    // --- Unread notification background color by role ---
    const unreadBgClass = {
        student: 'bg-blue-50',
        publisher: 'bg-primary-lighter/50',
        admin: 'bg-green-50'
    }[user?.role] || '';

    // --- Main Render: Top navigation bar layout ---
    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center z-20">
            <div className="flex-1"></div> 
            
            <div className="flex items-center space-x-4">
                {/* Notification Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="relative p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {unreadCount > 0 && (
                            <span className={`absolute top-0 right-0 block h-5 w-5 rounded-full ${badgeColor} text-white text-xs flex items-center justify-center ring-2 ring-white`}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border z-30">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">Notifications</h3>
                                <button onClick={() => setPage('notifications')} className="text-sm font-semibold text-primary-main hover:underline">View All</button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div key={notif.id} onClick={() => handleItemClick(notif)} className={`p-3 flex items-start space-x-3 hover:bg-gray-50 cursor-pointer border-b ${!notif.is_read ? unreadBgClass : ''}`}>
                                            <NotificationIcon type={notif.type} role={user?.role} />
                                            <div className="flex-grow">
                                                <p className="text-sm text-gray-700">{notif.message}</p>
                                                <p className="text-xs text-blue-500 font-semibold mt-1">{timeSince(notif.created_at)}</p>
                                            </div>
                                            {!notif.is_read && <span className={`w-2.5 h-2.5 ${badgeColor.replace('bg-', 'bg-opacity-100 bg-')} rounded-full flex-shrink-0 mt-1`}></span>}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 p-8">You have no new notifications.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-gray-200"></div>
                
                <button onClick={() => setPage('profile')} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    {user.profile_image_url ? (
                        <img src={`http://uniwiz-backend.test/api/${user.profile_image_url}`} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                        <div className={`text-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${badgeColor}`}>
                            {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                     <div className="text-left">
                        <p className="font-semibold text-sm text-gray-800">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                </button>
            </div>
        </header>
    );
}

export default TopNavbar;