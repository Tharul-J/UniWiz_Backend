// FILE: src/components/MessagesPage.js 
// =================================================================
// DESCRIPTION: This component serves as the main layout for the messaging feature,
// now with a more compact and theme-based design, search functionality, and
// the ability to initiate new conversations seamlessly.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ChatWindow from './ChatWindow';

const API_BASE_URL = 'http://uniwiz-backend.test/api';

// App Problem Modal for Messages Page
const AppProblemModal = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    if (!isOpen) return null;
    const handleSubmit = () => {
        if (!reason.trim()) {
            alert("Please describe the app problem.");
            return;
        }
        onSubmit(reason);
        setReason('');
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Report App Problem</h2>
                <p className="text-sm text-gray-600 mb-4">Describe the issue or bug you encountered in the app. This will be sent to the admin team.</p>
                <textarea
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary-main focus:outline-none"
                    rows="4"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., App crashed when sending a message, UI not loading, etc."
                ></textarea>
                <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark">Submit</button>
                </div>
            </div>
        </div>
    );
};

// --- Reusable Conversation Item Component ---
const ConversationItem = ({ conversation, onSelect, isActive, userRole }) => {
    const activeBgColor = {
        student: 'bg-blue-100',
        publisher: 'bg-primary-lighter',
        admin: 'bg-green-100',
    }[userRole] || 'bg-gray-100';

    const unreadIndicatorColor = {
        student: 'bg-blue-500',
        publisher: 'bg-primary-main',
        admin: 'bg-green-500',
    }[userRole] || 'bg-red-500';

    return (
        <button 
            onClick={() => onSelect(conversation)}
            className={`w-full text-left p-3 flex items-center space-x-4 transition-colors duration-200 border-b border-gray-100 ${isActive ? activeBgColor : 'hover:bg-gray-50'}`}
        >
            <div className="relative flex-shrink-0">
                <img 
                    src={conversation.profile_image_url ? `${API_BASE_URL}/${conversation.profile_image_url}` : `https://placehold.co/48x48/E8EAF6/211C84?text=${(conversation.company_name || conversation.first_name || 'U').charAt(0)}`}
                    alt="profile"
                    className="h-12 w-12 rounded-full object-cover"
                />
            </div>
            <div className="flex-grow overflow-hidden">
                <div className="flex justify-between items-start">
                    <p className="font-bold text-gray-800 truncate">{conversation.company_name || `${conversation.first_name} ${conversation.last_name}`}</p>
                    {conversation.last_message_time && (
                        <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(conversation.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    )}
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 truncate">{conversation.last_message || 'Start a new conversation...'}</p>
                    {conversation.unread_count > 0 && (
                        <span className={`text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${unreadIndicatorColor}`}>
                            {conversation.unread_count}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

// --- Main Messages Page Component ---
function MessagesPage({ user, setPage, conversationContext, setConversationContext }) {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // State for search input
    const [isAppProblemModalOpen, setAppProblemModalOpen] = useState(false);

    const handleAppProblemSubmit = async (reason) => {
        try {
            const response = await fetch(`${API_BASE_URL}/report_user.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporter_id: user.id,
                    reason: reason,
                    type: 'app_problem',
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
        } catch (err) {
            console.error("App problem report error:", err);
            alert(`Error: ${err.message}`);
        }
    };

    const fetchConversations = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`${API_BASE_URL}/get_conversations.php?user_id=${user.id}`);
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
        const interval = setInterval(fetchConversations, 15000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    // **UPDATED LOGIC**: Handles initiating a new conversation more robustly.
    useEffect(() => {
        // This effect runs when a new conversation is initiated from another page.
        // It waits until the initial loading of existing conversations is complete.
        if (conversationContext && !isLoading) {
            // Check if a conversation with this user already exists.
            const existingConvo = conversations.find(c => 
                c.other_user_id === conversationContext.targetUserId
            );

            if (existingConvo) {
                // If it exists, select it and add the new job context.
                setSelectedConversation({
                    ...existingConvo,
                    job_title_context: conversationContext.jobTitle,
                    job_id: conversationContext.jobId // Pass the new job_id
                });
            } else {
                // If no conversation exists, create a temporary placeholder to open the chat window.
                const newPlaceholderConvo = {
                    conversation_id: `temp_${conversationContext.targetUserId}`,
                    job_id: conversationContext.jobId,
                    job_title: conversationContext.jobTitle, // Used for display and context
                    other_user_id: conversationContext.targetUserId,
                    first_name: conversationContext.targetUserFirstName,
                    last_name: conversationContext.targetUserLastName,
                    company_name: conversationContext.targetUserCompanyName,
                    profile_image_url: null, // This can be fetched if needed.
                    last_message: null,
                    last_message_time: new Date().toISOString(),
                    unread_count: 0
                };
                // Add this placeholder to the top of the conversations list and select it.
                setConversations(prev => [newPlaceholderConvo, ...prev.filter(c => !String(c.conversation_id).startsWith('temp_'))]);
                setSelectedConversation(newPlaceholderConvo);
            }
            // Clear the context so it doesn't re-trigger on subsequent renders.
            setConversationContext(null);
        }
    }, [conversationContext, conversations, isLoading, setConversationContext]);
    
    // Memoized filtering for the search functionality
    const filteredConversations = useMemo(() => {
        if (!searchTerm) {
            return conversations;
        }
        return conversations.filter(convo => {
            const name = convo.company_name || `${convo.first_name} ${convo.last_name}`;
            const lastMessage = convo.last_message || '';
            return name.toLowerCase().includes(searchTerm.toLowerCase()) || lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [conversations, searchTerm]);

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        // If the conversation is not a temporary one, mark its messages as read visually.
        if (!String(conversation.conversation_id).startsWith('temp_')) {
            setConversations(prev => prev.map(c => 
                c.conversation_id === conversation.conversation_id ? { ...c, unread_count: 0 } : c
            ));
        }
    };
    
    const bgColor = {
        student: 'bg-gray-50',
        publisher: 'bg-bg-publisher-dashboard',
        admin: 'bg-gray-50',
    }[user.role] || 'bg-gray-50';

    return (
        <div className={`p-4 md:p-8 min-h-screen ${bgColor}`}>
            <AppProblemModal
                isOpen={isAppProblemModalOpen}
                onClose={() => setAppProblemModalOpen(false)}
                onSubmit={handleAppProblemSubmit}
            />
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-primary-dark">Messages</h1>
                    {(user.role === 'student' || user.role === 'publisher') && (
                        <button onClick={() => setAppProblemModalOpen(true)} className="font-semibold text-primary-main hover:underline flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9.75h.008v.008H9.75V9.75zm0 4.5h.008v.008H9.75v-.008zm4.5-4.5h.008v.008h-.008V9.75zm0 4.5h.008v.008h-.008v-.008zM12 6.75v.008h.008V6.75H12zm0 10.5v.008h.008V17.25H12z" />
                            </svg>
                            Report App Problem
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-lg h-[calc(100vh-12rem)] md:h-[calc(100vh-14rem)] flex overflow-hidden border">
                    {/* Left Panel: Conversations List */}
                    <div className="w-full md:w-1/3 border-r flex flex-col">
                        <div className="p-4 border-b">
                            <input 
                                type="text" 
                                placeholder="Search chats..." 
                                className="w-full p-2 border rounded-lg text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {isLoading && conversations.length === 0 ? (
                                <p className="p-4 text-gray-500">Loading conversations...</p>
                            ) : error ? (
                                <p className="p-4 text-red-500">{error}</p>
                            ) : filteredConversations.length > 0 ? (
                                filteredConversations.map(convo => (
                                    <ConversationItem 
                                        key={convo.conversation_id}
                                        conversation={convo}
                                        onSelect={handleSelectConversation}
                                        isActive={selectedConversation?.conversation_id === convo.conversation_id}
                                        userRole={user.role}
                                    />
                                ))
                            ) : (
                                <p className="p-4 text-center text-gray-500 mt-10">You have no active conversations.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Chat Window */}
                    <div className={`w-full md:w-2/3 flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                        {selectedConversation ? (
                            <ChatWindow 
                                key={selectedConversation.conversation_id}
                                conversation={selectedConversation}
                                currentUser={user}
                                onNewMessageSent={() => {
                                    if (String(selectedConversation.conversation_id).startsWith('temp_')) {
                                        // After sending the first message, refetch conversations to get the real conversation ID
                                        fetchConversations();
                                    }
                                }}
                            />
                        ) : (
                            <div className="flex-grow flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold text-gray-700">Select a conversation</h3>
                                    <p className="text-gray-500">Choose a chat from the left to start messaging.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MessagesPage;
