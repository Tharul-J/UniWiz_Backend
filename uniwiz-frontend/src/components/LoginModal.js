import React, { useState } from 'react';

// --- LoginModal: Modal popup for user login ---
// Receives props to control visibility, handle close, and handle login success
function LoginModal({ isOpen, onClose, onLoginSuccess }) {
    // --- State Management for the Form ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // --- State for Handling API Response ---
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Handle form submission for login ---
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const apiUrl = 'http://uniwiz-backend.test/api/auth.php';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // We must send 'action: "login"' so our PHP router knows what to do
                body: JSON.stringify({ action: 'login', email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'An unknown error occurred.');
            }
            
            // If login is successful, call the function from App.js
            onLoginSuccess(result.user);
            onClose(); // Close the modal on success

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Don't render modal if not open ---
    if (!isOpen) return null;

    // --- Main Render: Modal layout with login form ---
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                {/* UPDATED: Changed text color class to primary-dark */}
                <h2 className="text-3xl font-bold text-primary-dark mb-6">Log In to Your Account</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="login-email">Email Address</label>
                        <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="login-password">Password</label>
                        <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" required />
                    </div>

                    {/* Show error message if login fails */}
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    
                    <div className="flex items-center justify-center">
                        <button type="submit" disabled={isLoading} 
                            // UPDATED: Changed background and hover background colors to primary-main and primary-dark
                            className="bg-primary-main hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 disabled:bg-gray-400">
                            {isLoading ? 'Logging In...' : 'Log In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginModal;
