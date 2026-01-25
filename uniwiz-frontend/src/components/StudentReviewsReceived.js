import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Star Rating Component ---
const StarRating = ({ rating, size = 'w-4 h-4' }) => {
    const totalStars = 5;
    const numericRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numericRating);
    
    return (
        <div className="flex items-center">
            {[...Array(totalStars)].map((_, i) => (
                <svg
                    key={i}
                    className={`${size} ${i < fullStars ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                </svg>
            ))}
        </div>
    );
};

// --- Review Card Component ---
const ReviewCard = ({ review }) => (
    <motion.div
        whileHover={{ y: -2 }}
        className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
    >
        <div className="flex items-start space-x-3">
            <img 
                src={review.publisher_image_url ? 
                    `http://uniwiz-backend.test/api/${review.publisher_image_url}` : 
                    `https://ui-avatars.com/api/?name=${review.company_name || review.publisher_first_name}&background=E8EAF6&color=211C84`
                }
                alt="Publisher profile"
                className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h4 className="font-semibold text-gray-800">
                            {review.company_name || `${review.publisher_first_name} ${review.publisher_last_name}`}
                        </h4>
                        {review.job_title && (
                            <p className="text-sm text-gray-600">Job: {review.job_title}</p>
                        )}
                    </div>
                    <div className="flex flex-col items-end">
                        <StarRating rating={review.rating} />
                        <p className="text-xs text-gray-500 mt-1">
                            {new Date(review.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <p className="text-sm text-gray-700 italic">
                    "{review.review_text}"
                </p>
            </div>
        </div>
    </motion.div>
);

// --- Rating Statistics Component ---
const RatingStats = ({ stats }) => (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-center mb-4">
            <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">
                    {stats.avg_rating ? stats.avg_rating.toFixed(1) : 'N/A'}
                </div>
                <div className="flex justify-center my-2">
                    <StarRating rating={stats.avg_rating} size="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-600">
                    {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
        
        {/* Rating Distribution */}
        {stats.rating_distribution && stats.rating_distribution.length > 0 && (
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</h4>
                {[5, 4, 3, 2, 1].map((rating) => {
                    const ratingData = stats.rating_distribution.find(r => r.rating == rating) || { count: 0 };
                    const percentage = stats.total_reviews > 0 ? (ratingData.count / stats.total_reviews) * 100 : 0;
                    
                    return (
                        <div key={rating} className="flex items-center space-x-2">
                            <span className="text-sm w-6">{rating}</span>
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                            </svg>
                            <div className="flex-grow bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <span className="text-sm text-gray-600 w-8">{ratingData.count}</span>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);

// --- Main Student Reviews Received Component ---
function StudentReviewsReceived({ studentId, showTitle = true }) {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ avg_rating: 0, total_reviews: 0, rating_distribution: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch student reviews ---
    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://uniwiz-backend.test/api/get_student_reviews_received.php?student_id=${studentId}`);
            const data = await response.json();
            
            if (response.ok) {
                setReviews(data.reviews || []);
                setStats(data.stats || { avg_rating: 0, total_reviews: 0, rating_distribution: [] });
            } else {
                throw new Error(data.message || 'Failed to fetch reviews');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentId) {
            fetchReviews();
        }
    }, [studentId]);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="animate-pulse">
                    {showTitle && <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>}
                    <div className="h-20 bg-gray-100 rounded mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-center py-8">
                    <p className="text-red-500">Error: {error}</p>
                    <button 
                        onClick={fetchReviews}
                        className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            {showTitle && (
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                        </svg>
                        Reviews from Employers
                    </h3>
                    <p className="text-gray-600 text-sm">Feedback from companies you've worked with</p>
                </div>
            )}

            {/* Rating Statistics */}
            {stats.total_reviews > 0 && <RatingStats stats={stats} />}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                        <motion.div
                            key={review.review_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <ReviewCard review={review} />
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-medium text-gray-600">No reviews yet</h4>
                        <p className="text-gray-500 mt-2">
                            Keep doing great work! Reviews from employers will appear here once they share their feedback.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentReviewsReceived;