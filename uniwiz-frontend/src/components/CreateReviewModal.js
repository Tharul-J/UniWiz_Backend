// FILE: src/components/CreateReviewModal.js (ENHANCED for Editing)
// =====================================================================
// This version can now be used for both creating and editing a review.

import React, { useState, useEffect } from 'react';

// --- Star: Reusable star icon component for rating ---
const Star = ({ selected = false, onSelect = f => f }) => (
    <svg
        className={`w-8 h-8 cursor-pointer ${selected ? 'text-yellow-400' : 'text-gray-300'}`}
        onClick={onSelect}
        fill="currentColor"
        viewBox="0 0 20 20"
    >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

// --- CreateReviewModal: Modal for creating or editing a review ---
function CreateReviewModal({ isOpen, onClose, publisherId, studentId, companyName, onSubmitSuccess, existingReview }) {
    // --- State hooks for form fields and UI ---
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Pre-fill the form when editing an existing review ---
    useEffect(() => {
        if (isOpen) {
            if (existingReview) {
                setRating(existingReview.rating || 0);
                setReviewText(existingReview.review_text || '');
            } else {
                // Reset form for new review
                setRating(0);
                setReviewText('');
            }
        }
    }, [isOpen, existingReview]);

    if (!isOpen) return null;

    // --- Handle review submission ---
    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Please select a star rating.");
            return;
        }
        if (!reviewText.trim()) {
            setError("Please write a review.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://uniwiz-backend.test/api/create_review.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publisher_id: publisherId,
                    student_id: studentId,
                    rating: rating,
                    comment: reviewText,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to submit review.');
            }

            onSubmitSuccess(result.message);
            onClose();

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Handle modal close and reset state ---
    const handleClose = () => {
        setError(null);
        setIsLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg relative">
                <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                {/* --- Modal title changes based on whether it's a new review or an edit --- */}
                <h2 className="text-2xl font-bold text-primary-dark mb-2">
                    {existingReview ? `Edit your review for ${companyName}` : `Write a review for ${companyName}`}
                </h2>
                <p className="text-gray-600 mb-6">Share your experience to help other students.</p>

                <div className="space-y-4">
                    <div className="flex justify-center">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} selected={i < rating} onSelect={() => setRating(i + 1)} />
                        ))}
                    </div>
                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="shadow-sm border rounded w-full py-3 px-4 h-32 focus:outline-none focus:ring-2 focus:ring-primary-main"
                        placeholder="What was your experience like?"
                    />
                    {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                    <div className="flex justify-end space-x-3">
                         <button
                            onClick={handleClose}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition duration-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="bg-primary-main hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition duration-300 disabled:bg-gray-400"
                        >
                            {isLoading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateReviewModal;
