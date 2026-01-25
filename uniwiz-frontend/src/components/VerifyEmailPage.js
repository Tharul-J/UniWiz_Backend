import React, { useEffect, useState } from 'react';

function VerifyEmailPage({ setPage }) {
  const [email, setEmail] = useState(() => {
    try {
      const pending = sessionStorage.getItem('pendingLogin');
      if (pending) {
        const parsed = JSON.parse(pending);
        return parsed.email || '';
      }
    } catch (_) {}
    return '';
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    if (verified === '1') {
      // On verified success, switch to login. Auto-login will happen from App.js logic.
      setTimeout(() => setPage('login'), 1500);
    }
  }, [setPage]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <img src="/logo.png" alt="UniWiz" className="h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Email verification</h1>
        <p className="text-gray-600 mb-6">
          We sent an email{email ? ` to ${email}` : ''} to verify your address. Click the
          "Verify email" button in the email to continue.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>Not seeing the email? Check your spam folder.</p>
          <button onClick={() => setPage('login')} className="text-blue-600 hover:underline">Back to login</button>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;



