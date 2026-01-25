import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Star Icon Component ---
const StarIcon = ({ filled = false, size = 'w-5 h-5', onClick = null }) => (
    <svg 
        className={`${size} ${filled ? 'text-yellow-400' : 'text-gray-300'} ${onClick ? 'cursor-pointer hover:text-yellow-300' : ''} transition-colors`}
        fill="currentColor"
        viewBox="0 0 20 20"
        onClick={onClick}
    >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
    </svg>
);

// --- CreateStudentReviewModal: Modal for publishers to review students ---
function CreateStudentReviewModal({ 
    isOpen, 
    onClose, 
    student, 
    publisherId, 
    onSubmitSuccess, 
    existingReview = null 
}) {
    // --- State hooks for form fields and UI ---
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Pre-fill form when editing existing review ---
    useEffect(() => {
        if (isOpen) {
            if (existingReview) {
                setRating(existingReview.rating || 0);
                setReviewText(existingReview.review_text || '');
            } else {
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
            const response = await fetch('http://uniwiz-backend.test/api/create_student_review.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publisher_id: publisherId,
                    student_id: student.student_id,
                    job_id: student.job_id || null,
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
        setRating(0);
        setHoverRating(0);
        setReviewText('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {existingReview ? 'Update Review' : 'Review Student'}
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Share your experience working with {student.first_name} {student.last_name}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Student Info */}
                <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
                    <img 
                        src={student.profile_image_url ? 
                            `http://uniwiz-backend.test/api/${student.profile_image_url}` : 
                            `https://ui-avatars.com/api/?name=${student.first_name}+${student.last_name}&background=E8EAF6&color=211C84`
                        }
                        alt="Student profile"
                        className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                        <h3 className="font-semibold text-lg">{student.first_name} {student.last_name}</h3>
                        {student.job_title && (
                            <p className="text-gray-600 text-sm">Job: {student.job_title}</p>
                        )}
                        {student.university && (
                            <p className="text-gray-500 text-xs">{student.university}</p>
                        )}
                    </div>
                </div>

                {/* Rating Section */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                                key={star}
                                filled={star <= (hoverRating || rating)}
                                size="w-8 h-8"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-gray-500">
                        {hoverRating ? 
                            `${hoverRating} star${hoverRating > 1 ? 's' : ''}` :
                            rating ? `${rating} star${rating > 1 ? 's' : ''} selected` : 'Select a rating'
                        }
                    </p>
                </div>

                {/* Review Text */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Review <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows="4"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                        placeholder="Share your experience working with this student. What were their strengths? How was their work quality and reliability?"
                        maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {reviewText.length}/1000 characters
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || rating === 0 || !reviewText.trim()}
                        className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-800 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                            </>
                        ) : (
                            existingReview ? 'Update Review' : 'Submit Review'
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default CreateStudentReviewModal;