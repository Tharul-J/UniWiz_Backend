import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Star Rating Display Component ---
const StarRating = ({ rating, size = 'w-4 h-4', showNumber = true }) => {
    const totalStars = 5;
    const numericRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numericRating);
    
    return (
        <div className="flex items-center space-x-1">
            <div className="flex">
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
            {showNumber && (
                <span className="text-sm font-semibold text-gray-700">
                    {numericRating.toFixed(1)}
                </span>
            )}
        </div>
    );
};

// --- Review Card Component ---
const ReviewCard = ({ review }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
    >
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
                <img 
                    src={review.publisher_image_url ? 
                        `http://uniwiz-backend.test/api/${review.publisher_image_url}` : 
                        `https://ui-avatars.com/api/?name=${review.company_name || review.publisher_first_name}&background=3B82F6&color=fff`
                    }
                    alt="Publisher profile"
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                    <h4 className="font-semibold text-gray-800">
                        {review.company_name || `${review.publisher_first_name} ${review.publisher_last_name}`}
                    </h4>
                    {review.job_title && (
                        <p className="text-sm text-gray-600">Job: {review.job_title}</p>
                    )}
                </div>
            </div>
            <div className="text-right">
                <StarRating rating={review.rating} showNumber={true} />
                <p className="text-xs text-gray-500 mt-1">
                    {new Date(review.created_at).toLocaleDateString()}
                </p>
            </div>
        </div>
        
        <p className="text-gray-700 italic leading-relaxed">
            "{review.review_text}"
        </p>
        
        {review.updated_at !== review.created_at && (
            <p className="text-xs text-gray-400 mt-2">
                Updated: {new Date(review.updated_at).toLocaleDateString()}
            </p>
        )}
    </motion.div>
);

// --- Rating Distribution Component ---
const RatingDistribution = ({ distribution, totalReviews }) => (
    <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(rating => {
            const ratingData = distribution.find(d => d.rating === rating);
            const count = ratingData ? ratingData.count : 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            return (
                <div key={rating} className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600 w-8">
                        {rating}★
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <span className="text-sm text-gray-600 w-8">
                        {count}
                    </span>
                </div>
            );
        })}
    </div>
);

// --- Main Student Reviews Received Component ---
function StudentReviewsReceived({ studentId, showInModal = false }) {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch student reviews ---
    const fetchReviews = async () => {
        if (!studentId) return;
        
        try {
            setLoading(true);
            const response = await fetch(`http://uniwiz-backend.test/api/get_student_reviews_received.php?student_id=${studentId}`);
            const data = await response.json();
            
            if (response.ok) {
                setReviews(data.reviews || []);
                setStats(data.stats || {});
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
        fetchReviews();
    }, [studentId]);

    if (loading) {
        return (
            <div className={`${showInModal ? '' : 'bg-white p-6 rounded-lg shadow-sm border border-gray-200'}`}>
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
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
            <div className={`${showInModal ? '' : 'bg-white p-6 rounded-lg shadow-sm border border-gray-200'}`}>
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
        <div className={`${showInModal ? '' : 'bg-white p-6 rounded-lg shadow-sm border border-gray-200'}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Reviews Received</h3>
                    <p className="text-gray-600 text-sm">Feedback from employers</p>
                </div>
                
                {stats.total_reviews > 0 && (
                    <div className="text-right">
                        <div className="flex items-center space-x-2">
                            <StarRating rating={stats.avg_rating} size="w-5 h-5" showNumber={true} />
                        </div>
                        <p className="text-sm text-gray-600">
                            {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </div>

            {reviews.length > 0 ? (
                <div className="space-y-6">
                    {/* Rating Distribution */}
                    {stats.rating_distribution && stats.rating_distribution.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-3">Rating Breakdown</h4>
                            <RatingDistribution 
                                distribution={stats.rating_distribution} 
                                totalReviews={stats.total_reviews}
                            />
                        </div>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800">All Reviews</h4>
                        {reviews.map((review, index) => (
                            <motion.div
                                key={review.review_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <ReviewCard review={review} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-600 mb-2">No Reviews Yet</h4>
                    <p className="text-gray-500">
                        Complete some jobs to start receiving reviews from employers!
                    </p>
                </div>
            )}
        </div>
    );
}

export default StudentReviewsReceived;