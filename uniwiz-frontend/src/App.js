import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getSafeUserFromStorage, setSafeUserInStorage } from './utils/debugHelpers';

// --- Component Imports ---
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import ProfileSetup from './components/ProfileSetup';
import StudentDashboard from './components/StudentDashboard';
import PublisherDashboard from './components/PublisherDashboard';
import Sidebar from './components/Sidebar';
import StudentSidebar from './components/StudentSidebar';
import TopNavbar from './components/TopNavbar';
import ManageJobs from './components/ManageJobs';
import CreateJob from './components/CreateJob';
import AllApplicants from './components/AllApplicants';
import FindJobsPage from './components/FindJobsPage';
import AppliedJobsPage from './components/AppliedJobsPage';
import ProfilePage from './components/ProfilePage';
import CompanyProfilePage from './components/CompanyProfilePage';
import StudentProfilePage from './components/StudentProfilePage';
import JobDetailsPage from './components/JobDetailsPage';
import NotificationsPage from './components/NotificationsPage';
import SettingsPage from './components/SettingsPage';
import ApplyModal from './components/ApplyModal';
import JobDetailsModal from './components/JobDetailsModal';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import JobManagementAdmin from './components/admin/JobManagement';
import AdminSidebar from './components/admin/AdminSidebar';
import MessagesPage from './components/MessagesPage';
import ReportManagement from './components/admin/ReportManagement';
import EditJob from './components/EditJob'; 
import ViewApplicants from './components/ViewApplicants';
import AdminSettingsPage from './components/admin/AdminSettingsPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import VerifyEmailPage from './components/VerifyEmailPage';
import WishlistPage from './components/WishlistPage';

import './output.css';

// --- Constants ---
const API_BASE_URL = 'http://uniwiz-backend.test/api';

// --- INLINED ConversationViewerAdmin COMPONENT TO FIX BUILD ERROR ---

// --- Reusable Read-Only Chat Window ---
const ReadOnlyChatWindow = ({ conversation, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = useCallback(async () => {
        if (!conversation) return;
        setIsLoading(true);
        try {
            // Use the new admin-specific endpoint that doesn't mark messages as read
            const response = await fetch(`${API_BASE_URL}/get_messages_admin.php?conversation_id=${conversation.conversation_id}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch messages.');
            setMessages(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [conversation]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 10000); // Poll for new messages every 10 seconds
        return () => clearInterval(interval);
    }, [fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    // Determine who is who in the conversation
    const userOne = {
        id: conversation.user_one_id,
        name: conversation.user_one_company_name || `${conversation.user_one_first_name} ${conversation.user_one_last_name}`,
        image: conversation.user_one_profile_image
    };
    const userTwo = {
        id: conversation.user_two_id,
        name: conversation.user_two_company_name || `${conversation.user_two_first_name} ${conversation.user_two_last_name}`,
        image: conversation.user_two_profile_image
    };

    return (
        <>
            <div className="p-4 border-b flex items-center justify-between bg-white">
                <div className="flex items-center space-x-3">
                    <div className="flex -space-x-4">
                        <img 
                            src={userOne.image ? `${API_BASE_URL}/${userOne.image}` : `https://placehold.co/40x40/E8EAF6/211C84?text=${(userOne.name || 'U').charAt(0)}`}
                            alt={userOne.name}
                            className="h-10 w-10 rounded-full object-cover border-2 border-white"
                            title={userOne.name}
                        />
                        <img 
                            src={userTwo.image ? `${API_BASE_URL}/${userTwo.image}` : `https://placehold.co/40x40/9FA8DA/1A237E?text=${(userTwo.name || 'U').charAt(0)}`}
                            alt={userTwo.name}
                            className="h-10 w-10 rounded-full object-cover border-2 border-white"
                            title={userTwo.name}
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{userOne.name} &harr; {userTwo.name}</h3>
                        <p className="text-xs text-gray-500">Conversation ID: {conversation.conversation_id}</p>
                    </div>
                </div>
            </div>

            <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                {isLoading ? (
                    <p className="text-center text-gray-500">Loading messages...</p>
                ) : (
                    messages.map(msg => {
                        const isUserOneSender = msg.sender_id === userOne.id;
                        return (
                            <div key={msg.id} className={`flex my-2 ${isUserOneSender ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl shadow-sm ${isUserOneSender ? 'bg-white text-gray-800 border rounded-bl-none' : 'bg-green-100 text-gray-800 rounded-br-none'}`}>
                                    <p className="leading-snug whitespace-pre-wrap">{msg.message_text}</p>
                                    <p className={`text-xs mt-1 text-right ${isUserOneSender ? 'text-gray-400' : 'text-green-700'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-white text-center text-sm text-gray-500">
                This is a read-only view for administrators.
            </div>
        </>
    );
};

// --- Reusable Conversation Item Component ---
const ConversationItem = ({ conversation, onSelect, isActive }) => {
    const userOneName = conversation.user_one_company_name || `${conversation.user_one_first_name} ${conversation.user_one_last_name}`;
    const userTwoName = conversation.user_two_company_name || `${conversation.user_two_first_name} ${conversation.user_two_last_name}`;

    return (
        <button 
            onClick={() => onSelect(conversation)}
            className={`w-full text-left p-3 flex items-center space-x-4 transition-colors duration-200 border-b border-gray-100 ${isActive ? 'bg-green-50' : 'hover:bg-gray-50'}`}
        >
            <div className="relative flex-shrink-0 flex -space-x-4">
                 <img 
                    src={conversation.user_one_profile_image ? `${API_BASE_URL}/${conversation.user_one_profile_image}` : `https://placehold.co/48x48/E8EAF6/211C84?text=${(userOneName || 'U').charAt(0)}`}
                    alt={userOneName}
                    className="h-12 w-12 rounded-full object-cover border-2 border-white"
                />
                 <img 
                    src={conversation.user_two_profile_image ? `${API_BASE_URL}/${conversation.user_two_profile_image}` : `https://placehold.co/48x48/9FA8DA/1A237E?text=${(userTwoName || 'U').charAt(0)}`}
                    alt={userTwoName}
                    className="h-12 w-12 rounded-full object-cover border-2 border-white"
                />
            </div>
            <div className="flex-grow overflow-hidden">
                <p className="font-bold text-gray-800 truncate text-sm">{userOneName} &harr; {userTwoName}</p>
                <p className="text-sm text-gray-500 truncate">{conversation.last_message || 'No messages yet.'}</p>
            </div>
        </button>
    );
};

// --- Main Conversation Viewer Component ---
function ConversationViewerAdmin({ user, setPage }) {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchConversations = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/get_all_conversations_admin.php`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch conversations.');
            setConversations(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const filteredConversations = useMemo(() => {
        if (!searchTerm) return conversations;
        return conversations.filter(convo => {
            const userOneName = convo.user_one_company_name || `${convo.user_one_first_name} ${convo.user_one_last_name}`;
            const userTwoName = convo.user_two_company_name || `${convo.user_two_first_name} ${convo.user_two_last_name}`;
            return userOneName.toLowerCase().includes(searchTerm.toLowerCase()) || userTwoName.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [conversations, searchTerm]);

    return (
        <div className="p-4 md:p-8 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold text-primary-dark mb-6">Conversation Viewer</h1>
                <div className="bg-white rounded-2xl shadow-lg h-[calc(100vh-12rem)] md:h-[calc(100vh-14rem)] flex overflow-hidden border">
                    <div className="w-full md:w-1/3 border-r flex flex-col">
                        <div className="p-4 border-b">
                            <input 
                                type="text" 
                                placeholder="Search by name or company..." 
                                className="w-full p-2 border rounded-lg text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {isLoading ? (
                                <p className="p-4 text-gray-500">Loading conversations...</p>
                            ) : error ? (
                                <p className="p-4 text-red-500">{error}</p>
                            ) : filteredConversations.length > 0 ? (
                                filteredConversations.map(convo => (
                                    <ConversationItem 
                                        key={convo.conversation_id}
                                        conversation={convo}
                                        onSelect={setSelectedConversation}
                                        isActive={selectedConversation?.conversation_id === convo.conversation_id}
                                    />
                                ))
                            ) : (
                                <p className="p-4 text-center text-gray-500 mt-10">No conversations found.</p>
                            )}
                        </div>
                    </div>
                    <div className={`w-full md:w-2/3 flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                        {selectedConversation ? (
                            <ReadOnlyChatWindow 
                                key={selectedConversation.conversation_id}
                                conversation={selectedConversation}
                                currentUser={user}
                            />
                        ) : (
                            <div className="flex-grow flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold text-gray-700">Select a conversation</h3>
                                    <p className="text-gray-500">Choose a chat from the left to view messages.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- END INLINED COMPONENT ---


// --- Reusable Notification Popup (Toast) ---
const NotificationPopup = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const typeClasses = {
        success: "bg-green-500",
        error: "bg-red-500",
        info: "bg-blue-500",
    };
    const baseClasses = "fixed top-20 right-5 p-4 rounded-lg shadow-xl text-white z-50 transition-transform transform translate-x-0";

    return (
        <div className={`${baseClasses} ${typeClasses[type] || 'bg-gray-800'}`}>
            {message}
        </div>
    );
};

function App() {
    
  // --- State Management ---
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPageInternal] = useState('loading'); 
  const [currentPageState, setCurrentPageState] = useState(null);
  
  const [selectedJobIdForDetailsPage, setSelectedJobIdForDetailsPage] = useState(null);
  const [publisherIdForProfile, setPublisherIdForProfile] = useState(null);
  const [studentIdForProfile, setStudentIdForProfile] = useState(null);
  const [applicationIdToView, setApplicationIdToView] = useState(null); 

  const [jobToEdit, setJobToEdit] = useState(null);
  const [jobToViewApplicants, setJobToViewApplicants] = useState(null);

  const [isApplyModalOpen, setApplyModalOpen] = useState(false);
  const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);
  
  const [jobToApply, setJobToApply] = useState(null); 
  const [appliedJobs, setAppliedJobs] = useState(new Set()); 
  const [applyingStatus, setApplyingStatus] = useState({}); 

  // --- Wishlist State ---
  const [wishlistJobs, setWishlistJobs] = useState([]);

  const [isSidebarLocked, setIsSidebarLocked] = useState(true);
  const [applicantsPageFilter, setApplicantsPageFilter] = useState('All');
  const [appliedJobsPageFilter, setAppliedJobsPageFilter] = useState('All');

  const [notifications, setNotifications] = useState([]); 
  const [popupNotification, setPopupNotification] = useState({ message: '', type: '', key: 0 });
  const [shownPopupIds, setShownPopupIds] = useState(new Set()); 

  const [conversationContext, setConversationContext] = useState(null);
  
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasPendingReports, setHasPendingReports] = useState(false);

  const isUserVerified = true; // Allow applying without admin verification

  const showPopupNotification = useCallback((message, type = 'info') => {
      setPopupNotification({ message, type, key: Date.now() });
  }, []);
  
  const toggleSidebarLock = () => setIsSidebarLocked(prev => !prev);

  const setPage = useCallback((newPage, state = null) => {
    setCurrentPageState(state);
    setPageInternal(newPage);
  }, []);


  const fetchAppliedJobs = useCallback(async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/get_applied_jobs.php?user_id=${userId}`);
        const appliedIds = await response.json();
        if (response.ok) {
            setAppliedJobs(new Set(appliedIds.map(id => parseInt(id, 10))));
        } else {
            throw new Error(appliedIds.message || 'Could not fetch applied jobs');
        }
    } catch (err) {
        console.error("Fetch Applied Jobs Error:", err);
    }
  }, []);

  // Effect for fetching general notifications
  useEffect(() => {
    if (!currentUser) {
        setNotifications([]);
        return;
    }

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/get_notifications.php?user_id=${currentUser.id}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch notifications.');
            
            setNotifications(data);

            const newNotificationsForPopup = data.filter(n => !n.is_read && !shownPopupIds.has(n.id));

            if (newNotificationsForPopup.length > 0) {
                showPopupNotification(`You have ${newNotificationsForPopup.length} new notification(s)!`, 'info');
                setShownPopupIds(prevIds => {
                    const newIds = new Set(prevIds);
                    newNotificationsForPopup.forEach(n => newIds.add(n.id));
                    return newIds;
                });
            }
        } catch (err) {
            console.error("Fetch Notifications Error:", err.message);
        }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); 

    return () => clearInterval(interval);
  }, [currentUser, showPopupNotification, shownPopupIds]);
  
  // Effect for checking unread messages and reports
  useEffect(() => {
    if (!currentUser) {
        setHasUnreadMessages(false);
        setHasPendingReports(false);
        return;
    }

    const checkStatus = async () => {
        // Check for unread messages (for all roles except admin, as they have a viewer)
        if (currentUser.role !== 'admin') {
            try {
                const response = await fetch(`${API_BASE_URL}/get_conversations.php?user_id=${currentUser.id}`);
                const conversations = await response.json();
                if (response.ok && conversations.length > 0) {
                    const totalUnread = conversations.reduce((sum, convo) => sum + parseInt(convo.unread_count, 10), 0);
                    setHasUnreadMessages(totalUnread > 0);
                }
            } catch (err) { console.error("Error checking messages:", err); }
        }

        // Check for pending reports (for admin)
        if (currentUser.role === 'admin') {
            try {
                const response = await fetch(`${API_BASE_URL}/get_reports_admin.php`);
                const reports = await response.json();
                if (response.ok) {
                    // The backend returns { userReports: [...], appProblemReports: [...] }
                    const hasPending = (Array.isArray(reports.userReports) && reports.userReports.some(report => report.status === 'pending')) ||
                                      (Array.isArray(reports.appProblemReports) && reports.appProblemReports.some(report => report.status === 'pending'));
                    setHasPendingReports(hasPending);
                }
            } catch (err) { console.error("Error checking reports:", err); }
        }
    };

    checkStatus();
    const statusInterval = setInterval(checkStatus, 20000); // Check every 20 seconds

    return () => clearInterval(statusInterval);
  }, [currentUser]);


  useEffect(() => {
    const initializeUser = async () => {
        // If coming back from backend verification redirect, try magic token or pending creds
        try {
            const params = new URLSearchParams(window.location.search);

            // 1) Prefer magic link token if present
            const magic = params.get('magic');
            if (magic) {
                const resp = await fetch(`${API_BASE_URL}/auth.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'magic_login', token: magic })
                });
                const data = await resp.json();
                if (resp.ok && data.user) {
                    // Clean query param from URL without reload
                    const url = new URL(window.location.href);
                    url.searchParams.delete('magic');
                    window.history.replaceState({}, '', url.pathname + url.search);
                    await handleLoginSuccess(data.user);
                    return;
                }
            }

            // 2) Fallback: if verified flag and pending credentials exist, attempt silent login
            if (params.get('verified') === '1') {
                const pending = sessionStorage.getItem('pendingLogin');
                if (pending) {
                    const { email, password } = JSON.parse(pending);
                    const resp = await fetch(`${API_BASE_URL}/auth.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'login', email, password })
                    });
                    const data = await resp.json();
                    if (resp.ok && data.user) {
                        sessionStorage.removeItem('pendingLogin');
                        await handleLoginSuccess(data.user);
                        return;
                    }
                }
            }
        } catch (e) {
            console.error('Auto-login after verification failed:', e);
        }
        const user = getSafeUserFromStorage();
        if (user) {
            try {
                const response = await fetch(`${API_BASE_URL}/get_user_profile_by_id.php?user_id=${user.id}`);
                const result = await response.json();
                
                if (response.ok && result.user) {
                    if (result.user.status === 'blocked') {
                        showPopupNotification("Your account has been blocked by the administrator.", 'error');
                        setCurrentUser(null);
                        localStorage.removeItem('user');
                        setPage('login');
                        return;
                    }
                    setCurrentUser(result.user);
                    setSafeUserInStorage(result.user);
                    if (result.user.role === 'student') {
                        await fetchAppliedJobs(result.user.id);
                        loadWishlistFromStorage(result.user.id);
                    }
                    if (!result.user.first_name || (result.user.role === 'publisher' && !result.user.company_name)) {
                        setPage('profile-setup');
                    } else {
                        setPage(result.user.role === 'admin' ? 'dashboard' : 'home');
                    }
                } else {
                    showPopupNotification(result.message || "Session expired or user not found. Please log in.", 'error');
                    setCurrentUser(null);
                    try {
                        localStorage.removeItem('user');
                    } catch (error) {
                        console.error('Error clearing localStorage:', error);
                    }
                    setPage('landing');
                }
                            } catch (err) {
                    console.error('localStorage or session error:', err);
                    showPopupNotification("Could not re-establish session. Please log in again.", 'error');
                    setCurrentUser(null);
                    try {
                        localStorage.removeItem('user');
                    } catch (error) {
                        console.error('Error clearing localStorage:', error);
                    }
                    setPage('landing');
                }
        } else {
            setPage('landing');
        }
    };
    initializeUser();
  }, [fetchAppliedJobs, showPopupNotification, setPage]);

  const handleLoginSuccess = useCallback(async (userData) => {
    if (userData.status === 'blocked') {
        showPopupNotification("Your account has been blocked by the administrator.", 'error');
        setCurrentUser(null);
        try {
            localStorage.removeItem('user');
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
        setPage('login');
        return;
    }

    // Fetch the latest user profile from the backend
    let latestUser = userData;
    try {
        const response = await fetch(`http://uniwiz-backend.test/api/get_user_profile_by_id.php?user_id=${userData.id}`);
        if (response.ok) {
            const result = await response.json();
            if (result && result.user) {
                latestUser = result.user;
            }
        }
    } catch (err) {
        // fallback to userData if fetch fails
        console.error('Failed to fetch latest user profile:', err);
    }

    setCurrentUser(latestUser);
    setSafeUserInStorage(latestUser);
    if (latestUser.role === 'student') {
        await fetchAppliedJobs(latestUser.id);
        loadWishlistFromStorage(latestUser.id);
    }
    if (!latestUser.first_name || (latestUser.role === 'publisher' && !latestUser.company_name)) {
        setPage('profile-setup');
    } else {
        setPage(latestUser.role === 'admin' ? 'dashboard' : 'home');
    }
    showPopupNotification(`Welcome back, ${latestUser.first_name}!`, 'success');
  }, [fetchAppliedJobs, showPopupNotification, setPage]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    setAppliedJobs(new Set()); 
    setNotifications([]);
    setShownPopupIds(new Set()); 
    setPage('landing');
  }, [setPage]);

  const handleProfileUpdate = useCallback((updatedUserData) => {
    setCurrentUser(updatedUserData);
    setSafeUserInStorage(updatedUserData);
    if (page === 'profile-setup') {
        setPage('home');
        showPopupNotification('Profile setup complete!', 'success');
    } else {
        showPopupNotification('Profile updated successfully!', 'success');
    }
  }, [page, showPopupNotification, setPage]);
  
  const handleViewCompanyProfile = (pubId) => { setPublisherIdForProfile(pubId); setPage('company-profile'); };
  const handleViewApplicants = (filter = 'All') => { setApplicantsPageFilter(filter); setPage('applicants'); };
  const handleViewJobDetailsPage = (jobId) => { setSelectedJobIdForDetailsPage(jobId); setPage('view-job-details'); };
  const handleViewJobDetails = (job) => { setSelectedJobForDetails(job); setIsJobDetailsModalOpen(true); };
  const handleViewApplicantDetails = (applicationId) => {
      setApplicationIdToView(applicationId);
      setPage('applicants');
  };

  const handleInitiateConversation = (targetInfo) => {
      setConversationContext(targetInfo);
      setPage('messages');
  };

  const handleEditJob = (job) => {
    setJobToEdit(job);
    setPage('edit-job');
  };

  // Wishlist management functions
  const loadWishlistFromStorage = () => {
    try {
      const stored = localStorage.getItem('wishlist');
      if (stored) {
        setWishlistJobs(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading wishlist from storage:', error);
    }
  };

  const saveWishlistToStorage = (wishlist) => {
    try {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    } catch (error) {
      console.error('Error saving wishlist to storage:', error);
    }
  };

  const addToWishlist = useCallback((job) => {
    setWishlistJobs(prevWishlist => {
      const isAlreadyInWishlist = prevWishlist.some(wishlistJob => wishlistJob.id === job.id);
      if (isAlreadyInWishlist) {
        showPopupNotification('Job is already in your wishlist!', 'info');
        return prevWishlist;
      }
      
      const newWishlist = [...prevWishlist, job];
      saveWishlistToStorage(newWishlist);
      showPopupNotification('Job added to wishlist!', 'success');
      return newWishlist;
    });
  }, [showPopupNotification]);

  const removeFromWishlist = useCallback((jobId) => {
    setWishlistJobs(prevWishlist => {
      const newWishlist = prevWishlist.filter(job => job.id !== jobId);
      saveWishlistToStorage(newWishlist);
      showPopupNotification('Job removed from wishlist!', 'success');
      return newWishlist;
    });
  }, [showPopupNotification]);

  const isInWishlist = (jobId) => {
    return wishlistJobs.some(job => job.id === jobId);
  };

  const handleViewApplicantsForJob = (job) => {
    setJobToViewApplicants(job);
    setPage('view-applicants');
  };

  const handleNotificationClick = useCallback(async (notification) => {
    if (!notification.is_read) {
        try {
            await fetch(`${API_BASE_URL}/mark_notification_read.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_id: notification.id, user_id: currentUser.id })
            });
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: 1 } : n));
        }
        catch (err) {
            showPopupNotification('Could not update notification status.', 'error');
        }
    }
    if (notification.link) {
        const linkParts = notification.link.split('/'); 
        const pageTarget = linkParts[1];
        const action = linkParts[2];
        const id = linkParts[3];

        if (pageTarget === 'applicants' && action === 'view' && id) {
            handleViewApplicantDetails(parseInt(id, 10));
        } else if (pageTarget === 'applicants') {
            setPage('applicants');
        } else if (pageTarget === 'applied-jobs') {
            setPage('applied-jobs');
        } else if (pageTarget === 'user-management') {
            setPage('user-management', { filter: 'unverified' });
        } else if (pageTarget === 'job-management') {
            setPage('job-management', { filter: 'draft' });
        } else if (pageTarget === 'login') {
            handleLogout();
        }
    }
  }, [currentUser, showPopupNotification, handleLogout, setPage]);

  const handleOpenApplyModal = useCallback((job) => {
    if (!currentUser) {
      showPopupNotification("Please log in or sign up to apply for jobs.", 'info');
      setPage('login', { signup: true, role: 'student' });
      return;
    }
    setJobToApply(job); 
    setApplyModalOpen(true);
  }, [currentUser, showPopupNotification, setPage]);

  const handleSubmitApplication = useCallback(async (proposal) => {
    if (!jobToApply || !currentUser) return; 
    const jobId = jobToApply.id;
    setApplyingStatus(prev => ({ ...prev, [jobId]: 'applying' }));
    try {
        const response = await fetch(`${API_BASE_URL}/applications.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, job_id: jobId, proposal }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not submit application.');
        
        setAppliedJobs(prev => new Set(prev).add(jobId)); 
        setApplyingStatus(prev => ({ ...prev, [jobId]: 'applied' }));
        showPopupNotification('Application submitted successfully!', 'success');
    } catch (err) {
        setApplyingStatus(prev => ({ ...prev, [jobId]: 'error' }));
        showPopupNotification(err.message, 'error');
    }
  }, [jobToApply, currentUser, showPopupNotification]);

  const renderLoggedInPageContent = () => {
      if (!currentUser) return null; 

      // Common pages for students and publishers
      const commonPages = {
        'notifications': <NotificationsPage user={currentUser} notifications={notifications} onNotificationClick={handleNotificationClick} />,
        'profile': <ProfilePage user={currentUser} onProfileUpdate={handleProfileUpdate} />,
        // Settings page for non-admin users
        'settings': <SettingsPage user={currentUser} onLogout={handleLogout} />,
      };
      
      if (page === 'messages') {
          return <MessagesPage user={currentUser} setPage={setPage} conversationContext={conversationContext} setConversationContext={setConversationContext} />;
      }
      
      // --- IMPORTANT: Check for Admin role FIRST ---
      if (currentUser.role === 'admin') {
          switch (page) {
              case 'home':
              case 'dashboard': 
                return <AdminDashboard setPage={setPage} />;
              
              // Admin-specific settings page is rendered here
              case 'settings':
                return <AdminSettingsPage user={currentUser} />;

              case 'user-management': return <UserManagement user={currentUser} setPage={setPage} setStudentIdForProfile={setStudentIdForProfile} setPublisherIdForProfile={setPublisherIdForProfile} initialFilter={currentPageState} />;
              case 'job-management': return <JobManagementAdmin user={currentUser} setPage={setPage} setSelectedJobIdForDetailsPage={setSelectedJobIdForDetailsPage} initialFilter={currentPageState} />;
              case 'student-profile': return <StudentProfilePage studentId={studentIdForProfile} onBackClick={() => setPage('user-management')} />;
              case 'company-profile': return <CompanyProfilePage publisherId={publisherIdForProfile} currentUser={currentUser} handleApply={handleOpenApplyModal} appliedJobs={appliedJobs} applyingStatus={applyingStatus} showNotification={showPopupNotification} handleViewJobDetails={handleViewJobDetails} />;
              case 'view-job-details': return <JobDetailsPage 
                jobId={selectedJobIdForDetailsPage} 
                onBackClick={() => setPage('job-management')}
                onDeleteClick={async (jobId) => {
                    if (window.confirm('Are you sure you want to delete this job?')) {
                        await fetch('http://uniwiz-backend.test/api/manage_job_action_admin.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ job_id: jobId, admin_id: currentUser.id, action: 'delete' })
                        });
                        setPage('job-management');
                    }
                }}
                onCompanyClick={(publisherId) => { setPublisherIdForProfile(publisherId); setPage('company-profile'); }}
            />;
              case 'report-management': return <ReportManagement user={currentUser} setPage={setPage} setStudentIdForProfile={setStudentIdForProfile} setPublisherIdForProfile={setPublisherIdForProfile} />;
              case 'conversation-viewer': return <ConversationViewerAdmin user={currentUser} setPage={setPage} />;
              default: return <AdminDashboard setPage={setPage} />;
          }
      }

      // If not admin, check for common pages
      if (page && commonPages[page]) return commonPages[page];

      // Pages for Publisher
      if (currentUser.role === 'publisher') {
          switch (page) {
              case 'home': return <PublisherDashboard user={currentUser} onPostJobClick={() => setPage('create-job')} onViewAllJobsClick={() => setPage('manage-jobs')} onViewApplicants={handleViewApplicants} onViewApplicantDetails={handleViewApplicantDetails} />;
              case 'create-job': return <CreateJob user={currentUser} onJobPosted={() => { setPage('manage-jobs'); showPopupNotification('Job posted successfully!', 'success'); }} />;
              case 'manage-jobs': return <ManageJobs user={currentUser} onPostJobClick={() => setPage('create-job')} onViewJobDetails={handleViewJobDetailsPage} onEditJob={handleEditJob} onViewApplicants={handleViewApplicantsForJob} />; 
              case 'edit-job': return <EditJob user={currentUser} jobData={jobToEdit} onJobUpdated={() => { setPage('manage-jobs'); showPopupNotification('Job updated successfully!', 'success'); }} onBackClick={() => setPage('manage-jobs')} />;
              case 'view-applicants': return <ViewApplicants job={jobToViewApplicants} onBack={() => setPage('manage-jobs')} handleInitiateConversation={handleInitiateConversation} />;
              case 'view-job-details': return <JobDetailsPage jobId={selectedJobIdForDetailsPage} onBackClick={() => setPage('manage-jobs')} />;
              case 'applicants': return <AllApplicants user={currentUser} initialFilter={applicantsPageFilter} setInitialFilter={setApplicantsPageFilter} initialApplicationId={applicationIdToView} onModalClose={() => setApplicationIdToView(null)} handleInitiateConversation={handleInitiateConversation} />;
              case 'student-profile': return <StudentProfilePage studentId={studentIdForProfile} onBackClick={() => setPage('applicants')} />;
              default: return <PublisherDashboard user={currentUser} onPostJobClick={() => setPage('create-job')} onViewAllJobsClick={() => setPage('manage-jobs')} onViewApplicants={handleViewApplicants} onViewApplicantDetails={handleViewApplicantDetails} />;
          }
      } 
      
      // Pages for Student
      else if (currentUser.role === 'student') {
          switch (page) {
              case 'home': return <StudentDashboard currentUser={currentUser} handleApply={handleOpenApplyModal} appliedJobs={appliedJobs} applyingStatus={applyingStatus} setPage={setPage} setPublisherIdForProfile={setPublisherIdForProfile} handleViewJobDetails={handleViewJobDetails} setAppliedJobsPageFilter={setAppliedJobsPageFilter} addToWishlist={addToWishlist} isInWishlist={isInWishlist} />;
              case 'find-jobs':
                return <FindJobsPage 
                  currentUser={currentUser} 
                  handleApply={handleOpenApplyModal} 
                  appliedJobs={appliedJobs} 
                  applyingStatus={applyingStatus} 
                  setPage={setPage} 
                  setPublisherIdForProfile={handleViewCompanyProfile} 
                  handleViewJobDetails={handleViewJobDetails} 
                  isUserVerified={isUserVerified}
                  addToWishlist={addToWishlist}
                  isInWishlist={isInWishlist}
                />;
              case 'applied-jobs':
                return <AppliedJobsPage 
                  user={currentUser} 
                  handleViewJobDetails={handleViewJobDetails} 
                  initialFilter={appliedJobsPageFilter} 
                  setInitialFilter={setAppliedJobsPageFilter}
                  isUserVerified={isUserVerified}
                />;
              case 'wishlist':
                return <WishlistPage 
                  currentUser={currentUser} 
                  wishlistJobs={wishlistJobs}
                  handleApply={handleOpenApplyModal} 
                  handleViewJobDetails={handleViewJobDetails} 
                  removeFromWishlist={removeFromWishlist}
                />;
              case 'company-profile': return <CompanyProfilePage publisherId={publisherIdForProfile} currentUser={currentUser} handleApply={handleOpenApplyModal} appliedJobs={appliedJobs} applyingStatus={applyingStatus} showNotification={showPopupNotification} handleViewJobDetails={handleViewJobDetails} addToWishlist={addToWishlist} isInWishlist={isInWishlist} />;
              default: return <StudentDashboard currentUser={currentUser} handleApply={handleOpenApplyModal} appliedJobs={appliedJobs} applyingStatus={applyingStatus} setPage={setPage} setPublisherIdForProfile={setPublisherIdForProfile} handleViewJobDetails={handleViewJobDetails} setAppliedJobsPageFilter={setAppliedJobsPageFilter} addToWishlist={addToWishlist} isInWishlist={isInWishlist} />;
          }
      }
      return null;
  };

  const renderPage = () => {
    switch (page) {
        case 'loading':
            return <div className="flex items-center justify-center min-h-screen"><p>Loading UniWiz...</p></div>;
        case 'login':
            return <LoginPage onLoginSuccess={handleLoginSuccess} setPage={setPage} initialState={currentPageState} />;
        case 'profile-setup':
            return <ProfileSetup user={currentUser} onSetupComplete={handleProfileUpdate} onBackClick={() => setPage('login')} />;
        case 'landing':
             return <LandingPage setPage={setPage} />;
        case 'reset-password':
            return <ResetPasswordPage setPage={setPage} />;
        case 'verify':
            return <VerifyEmailPage setPage={setPage} />;
        case 'public-jobs':
            return (
                <div className="flex flex-col h-screen bg-gray-50">
                    <header className="bg-white shadow-sm p-4 flex justify-between items-center z-20">
                        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setPage('landing')}>
                            <img src="/logo.png" alt="UniWiz Logo" className="h-10" />
                            <h1 className="text-xl font-bold text-primary-dark">UniWiz</h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => setPage('login')} className="font-semibold text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                                Log In
                            </button>
                            <button onClick={() => setPage('login', { signup: true, role: 'student' })} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                Sign Up
                            </button>
                        </div>
                    </header>
                    <main className="flex-1 overflow-x-hidden overflow-y-auto">
                        <FindJobsPage currentUser={null} handleApply={handleOpenApplyModal} appliedJobs={new Set()} applyingStatus={{}} setPage={setPage} setPublisherIdForProfile={handleViewCompanyProfile} handleViewJobDetails={handleViewJobDetails} addToWishlist={addToWishlist} isInWishlist={isInWishlist} />
                    </main>
                </div>
            );
        default:
            if (!currentUser) {
                return <LandingPage setPage={setPage} />;
            }
            return (
                <div className={`flex h-screen bg-gray-50`}>
                    {currentUser.role === 'publisher' ? (
                        <Sidebar user={currentUser} currentPage={page} setPage={setPage} onLogout={handleLogout} isLocked={isSidebarLocked} toggleLock={toggleSidebarLock} hasUnreadMessages={hasUnreadMessages} />
                    ) : currentUser.role === 'student' ? (
                        <StudentSidebar user={currentUser} currentPage={page} setPage={setPage} onLogout={handleLogout} isLocked={isSidebarLocked} toggleLock={toggleSidebarLock} hasUnreadMessages={hasUnreadMessages} />
                    ) : (
                        <AdminSidebar user={currentUser} currentPage={page} setPage={setPage} onLogout={handleLogout} isLocked={isSidebarLocked} toggleLock={toggleSidebarLock} hasUnreadReports={hasPendingReports} />
                    )}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <TopNavbar user={currentUser} setPage={setPage} notifications={notifications} onNotificationClick={handleNotificationClick} />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto">
                            {renderLoggedInPageContent()}
                        </main>
                    </div>
                </div>
            );
    }
  };

  return (
    <>
      {popupNotification.message && (
          <NotificationPopup
              key={popupNotification.key}
              message={popupNotification.message}
              type={popupNotification.type}
              onClose={() => setPopupNotification(p => ({ ...p, message: '' }))}
          />
      )}
      {renderPage()}
      <ApplyModal isOpen={isApplyModalOpen} onClose={() => setApplyModalOpen(false)} jobTitle={jobToApply?.title} onSubmit={handleSubmitApplication} />
      <JobDetailsModal 
        isOpen={isJobDetailsModalOpen} 
        onClose={() => setIsJobDetailsModalOpen(false)} 
        job={selectedJobForDetails}
        currentUser={currentUser}
        handleApply={handleOpenApplyModal}
        handleViewCompanyProfile={handleViewCompanyProfile}
        handleMessagePublisher={handleInitiateConversation}
      />
    </>
  );
}

export default App;
