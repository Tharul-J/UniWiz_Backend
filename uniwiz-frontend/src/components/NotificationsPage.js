// FILE: src/components/NotificationsPage.js (UPDATED - Admin Notification Icons and User-Specific Icons)
// =====================================================================
// This component displays a list of notifications for the user.

import React from 'react';

// --- NotificationIcon: Shows an icon based on notification type ---
const NotificationIcon = ({ type }) => {
    const iconMap = {
        new_applicant: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        application_accepted: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        // --- NEW USER-SPECIFIC NOTIFICATION ICONS (from admin actions) ---
        account_blocked: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        ),
        account_unblocked: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.276a11.952 11.952 0 01-1.296-.682A4.992 4.992 0 0017 12a4.992 4.992 0 00-3.678-4.712M15 17H3v-1a6 6 0 0112 0v1zm-3 4h.01M12 3v1m0 16v1m9.356-9.356l-.682-.296M15 5.618l-.296-.682m-4.276 5.618a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        account_verified: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        account_unverified: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        // --- ADMIN NOTIFICATION ICONS ---
        new_user_registration: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        new_job_pending_approval: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };
    return <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">{iconMap[type] || iconMap.new_applicant}</div>;
};

// --- Main NotificationsPage component ---
function NotificationsPage({ user, notifications, isLoading, error, onNotificationClick }) {

    // --- Format time since notification ---
    const timeSince = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    // --- Main Render: Notifications list layout ---
    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold text-primary-dark mb-8">Notifications</h1>
                <div className="bg-white rounded-xl shadow-md border">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div></div>
                    ) : error ? (
                        <p className="text-center text-red-500 py-16">{error}</p>
                    ) : notifications.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {notifications.map((notif) => (
                                <li key={notif.id} onClick={() => onNotificationClick(notif)} className={`p-4 flex items-start space-x-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-blue-50' : ''}`}>
                                    <NotificationIcon type={notif.type} />
                                    <div className="flex-grow">
                                        <p className="text-gray-800">{notif.message}</p>
                                        <p className="text-sm text-gray-500 mt-1">{timeSince(notif.created_at)}</p>
                                    </div>
                                    {!notif.is_read && <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-16">You have no new notifications.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NotificationsPage;
