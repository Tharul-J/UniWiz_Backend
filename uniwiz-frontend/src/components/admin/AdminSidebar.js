// ==============================================================================
// AdminSidebar.js
// ------------------------------------------------------------------------------
// This file defines the AdminSidebar component for the UniWiz admin dashboard.
// It provides navigation links for admin pages, supports sidebar expansion/collapse,
// notification indicators, and integrates with framer-motion for smooth UI effects.
// ------------------------------------------------------------------------------
//
// Key Features:
// - Sidebar navigation for admin dashboard, user management, job management, etc.
// - Animated expand/collapse with lock/unlock functionality
// - Notification badges for unread messages and pending reports
// - Uses framer-motion for smooth transitions and animations
// - Responsive to hover and lock state
//
// ==============================================================================
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Reusable navigation link component
// NavLink renders a single navigation button with icon, text, and optional notification badge.
// It supports both expanded and collapsed sidebar states, and shows a tooltip when collapsed.
const NavLink = ({ icon, text, isActive, isExpanded, onClick, isLogout = false, hasNotification = false }) => {
  // Local state to track hover for tooltip and icon animation
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <div className="relative group" 
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: isExpanded ? 1.02 : 1 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full flex items-center transition-all duration-200
          ${!isExpanded ? 'px-3 justify-center' : 'px-4 justify-between'} 
          ${isActive
            ? 'bg-gradient-to-r from-green-100 to-green-50 border-l-4 border-green-400 text-green-700 shadow-sm py-3.5 rounded-lg' 
            : isLogout
              ? 'text-red-500 hover:bg-red-50 py-3 rounded-lg'
              : 'text-gray-600 hover:bg-gray-50 py-3 rounded-lg'
          }
        `}
      >
        <div className="flex items-center">
            <div className="relative">
                <motion.div animate={{ rotate: isHovering && !isActive ? 5 : 0 }}>
                    {icon}
                </motion.div>
                {/* Blinking dot for notifications */}
                {/* Show a red blinking dot if hasNotification is true and sidebar is collapsed */}
                {!isExpanded && hasNotification && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                )}
            </div>
            {isExpanded && (
            <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="ml-4 font-medium"
            >
                {text}
            </motion.span>
            )}
        </div>
        {isExpanded && hasNotification && (
            // Show notification dot when expanded
            <span className="flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
        )}
      </motion.button>
      
      {!isExpanded && (
        // Tooltip for collapsed sidebar
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ 
            opacity: isHovering ? 1 : 0,
            y: isHovering ? 0 : -5
          }}
          className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-lg pointer-events-none whitespace-nowrap"
        >
          {text}
          <div className="absolute w-2 h-2 bg-gray-900 rotate-45 -left-1 top-1/2 -translate-y-1/2"></div>
        </motion.div>
      )}
    </div>
  );
};

// AdminSidebar main component
// Props:
// - currentPage: string indicating the current active admin page
// - setPage: function to change the current page
// - onLogout: function to handle logout
// - isLocked: boolean, whether sidebar is pinned open
// - toggleLock: function to toggle lock state
// - hasUnreadMessages: boolean, whether there are unread admin messages
function AdminSidebar({ currentPage, setPage, onLogout, isLocked, toggleLock, hasUnreadMessages }) {
    // State to track hover (for expand/collapse on hover)
    const [isHovered, setIsHovered] = useState(false);
    // State to track if there are any pending reports (for notification badge)
    const [hasPendingReports, setHasPendingReports] = useState(false);
    // Sidebar is expanded if locked or hovered
    const isExpanded = isLocked || isHovered;

    // Effect: Poll backend every 15s for pending admin reports
    useEffect(() => {
        let interval;
        const fetchPendingReports = async () => {
            try {
                // Fetch only the count of pending reports
                const response = await fetch('http://uniwiz-backend.test/api/get_reports_admin.php?pending_count_only=1');
                const data = await response.json();
                setHasPendingReports((data.pending_count ?? 0) > 0);
            } catch (err) {
                setHasPendingReports(false);
            }
        };
        fetchPendingReports();
        interval = setInterval(fetchPendingReports, 15000);
        return () => clearInterval(interval);
    }, []);

    // SVG icon definitions for sidebar links
    const dashboardIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    const usersIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    const jobsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    const messagesIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
    const reportsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    const settingsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    const logoutIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
    const pinIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;
    const unpinIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" /></svg>;

    return (
        // Sidebar container with animated width
        <motion.aside 
            className={`bg-white h-full flex-shrink-0 p-4 flex flex-col shadow-xl transition-all duration-200 ease-out relative z-20 ${isExpanded ? 'w-64' : 'w-20'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ width: isLocked ? 256 : 80 }}
            animate={{ width: isExpanded ? 256 : 80 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            {/* Logo and lock/unlock button */}
            <div className="flex items-center justify-between mb-8">
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-3"
                    >
                        <img src="/logo.png" alt="UniWiz Logo" className="h-12" />
                        <motion.h1 className="text-xl font-bold text-primary-dark">UniWiz Admin</motion.h1>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Collapsed logo */}
                {!isExpanded && (
                    <div className="flex justify-center w-full">
                        <img src="/logo.png" alt="UniWiz Logo" className="h-12" />
                    </div>
                )}
                
                {/* Lock/unlock sidebar button */}
                <motion.button 
                  onClick={toggleLock}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-1.5 rounded-full hover:bg-gray-100 ${!isExpanded ? 'hidden' : ''}`}
                  title={isLocked ? "Unlock Sidebar" : "Lock Sidebar"}
                >
                    {isLocked ? unpinIcon : pinIcon}
                </motion.button>
            </div>

            {/* Navigation links */}
            <nav className="flex-grow space-y-2">
                {/* Dashboard link */}
                <NavLink text="Dashboard" icon={dashboardIcon} isActive={currentPage === 'dashboard'} isExpanded={isExpanded} onClick={() => setPage('dashboard')} />
                {/* User management link */}
                <NavLink text="User Management" icon={usersIcon} isActive={currentPage === 'user-management'} isExpanded={isExpanded} onClick={() => setPage('user-management')} />
                {/* Job management link */}
                <NavLink text="Job Management" icon={jobsIcon} isActive={currentPage === 'job-management'} isExpanded={isExpanded} onClick={() => setPage('job-management')} />
                {/* Conversation viewer link with unread message notification */}
                <NavLink text="View Messages" icon={messagesIcon} isActive={currentPage === 'conversation-viewer'} isExpanded={isExpanded} onClick={() => setPage('conversation-viewer')} hasNotification={hasUnreadMessages} />
                {/* Reports link with pending report notification */}
                <NavLink text="Reports" icon={reportsIcon} isActive={currentPage === 'report-management'} isExpanded={isExpanded} onClick={() => setPage('report-management')} hasNotification={hasPendingReports} />
                {/* Settings link */}
                <NavLink text="Settings" icon={settingsIcon} isActive={currentPage === 'settings'} isExpanded={isExpanded} onClick={() => setPage('settings')} />
            </nav>

            {/* Logout button at the bottom */}
            <div className="mt-auto">
                <motion.div 
                  className="border-t border-gray-200 my-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                ></motion.div>
                <NavLink text="Log Out" icon={logoutIcon} isExpanded={isExpanded} onClick={onLogout} isLogout={true} />
            </div>
        </motion.aside>
    );
}

export default AdminSidebar;
