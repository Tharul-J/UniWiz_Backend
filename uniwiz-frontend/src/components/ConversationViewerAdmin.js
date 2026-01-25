// FILE: src/components/admin/ConversationViewerAdmin.js
// =================================================================
// DESCRIPTION: This component provides a read-only interface for administrators
// to view all user conversations on the platform for moderation purposes.

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const API_BASE_URL = 'http://uniwiz-backend.test/api';

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

export default ConversationViewerAdmin;
