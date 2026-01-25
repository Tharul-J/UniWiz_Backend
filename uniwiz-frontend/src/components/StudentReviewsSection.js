import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateStudentReviewModal from './CreateStudentReviewModal';

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

// --- Student Card Component ---
const StudentCard = ({ student, onReviewClick }) => (
    <motion.div
        whileHover={{ y: -2 }}
        className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200"
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <img 
                    src={student.profile_image_url ? 
                        `http://uniwiz-backend.test/api/${student.profile_image_url}` : 
                        `https://ui-avatars.com/api/?name=${student.first_name}+${student.last_name}&background=E8EAF6&color=211C84`
                    }
                    alt="Student profile"
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                    <h4 className="font-semibold text-gray-800">{student.first_name} {student.last_name}</h4>
                    <p className="text-sm text-gray-600">{student.job_title}</p>
                    {student.university && (
                        <p className="text-xs text-gray-500">{student.university}</p>
                    )}
                </div>
            </div>
            
            <div className="text-right">
                {student.existing_review_id ? (
                    <div className="flex flex-col items-end">
                        <StarRating rating={student.existing_rating} />
                        <p className="text-xs text-gray-500 mt-1">
                            Reviewed {new Date(student.review_created_at).toLocaleDateString()}
                        </p>
                        <button
                            onClick={() => onReviewClick(student)}
                            className="text-xs text-yellow-600 hover:text-yellow-800 mt-1"
                        >
                            Edit Review
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => onReviewClick(student)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    >
                        Review
                    </button>
                )}
            </div>
        </div>
    </motion.div>
);

// --- Main Student Reviews Component ---
function StudentReviewsSection({ publisherId, currentUser }) {
    const [students, setStudents] = useState({ not_reviewed: [], reviewed: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'completed'

    // --- Fetch reviewable students ---
    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://uniwiz-backend.test/api/get_reviewable_students.php?publisher_id=${publisherId}`);
            const data = await response.json();
            
            if (data.success) {
                setStudents(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch students');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (publisherId) {
            fetchStudents();
        }
    }, [publisherId]);

    // --- Handle review submission ---
    const handleReviewSubmit = (message) => {
        setNotification({ type: 'success', message });
        setTimeout(() => setNotification(null), 5000);
        fetchStudents(); // Refresh the list
    };

    // --- Handle review modal ---
    const handleReviewClick = (student) => {
        setSelectedStudent(student);
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded"></div>
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
                        onClick={fetchStudents}
                        className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Student Reviews</h3>
                        <p className="text-gray-600 text-sm">Review students you've worked with</p>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex space-x-4 text-center">
                        <div className="bg-yellow-50 px-3 py-2 rounded-lg">
                            <div className="text-lg font-bold text-yellow-700">{students.pending_reviews || 0}</div>
                            <div className="text-xs text-yellow-600">Pending</div>
                        </div>
                        <div className="bg-green-50 px-3 py-2 rounded-lg">
                            <div className="text-lg font-bold text-green-700">{students.reviewed_count || 0}</div>
                            <div className="text-xs text-green-600">Reviewed</div>
                        </div>
                    </div>
                </div>

                {/* Notification */}
                <AnimatePresence>
                    {notification && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`mb-4 p-3 rounded-lg ${
                                notification.type === 'success' ? 'bg-green-100 border border-green-300 text-green-700' :
                                'bg-red-100 border border-red-300 text-red-700'
                            }`}
                        >
                            {notification.message}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'pending' 
                                ? 'bg-white text-gray-800 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Pending Reviews ({students.pending_reviews || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'completed' 
                                ? 'bg-white text-gray-800 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Completed ({students.reviewed_count || 0})
                    </button>
                </div>

                {/* Students List */}
                <div className="space-y-3">
                    {activeTab === 'pending' ? (
                        students.not_reviewed && students.not_reviewed.length > 0 ? (
                            students.not_reviewed.map((student, index) => (
                                <motion.div
                                    key={`${student.student_id}-${student.job_id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <StudentCard student={student} onReviewClick={handleReviewClick} />
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-gray-400 mb-2">
                                    <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-medium text-gray-600">No pending reviews</h4>
                                <p className="text-gray-500">All your students have been reviewed!</p>
                            </div>
                        )
                    ) : (
                        students.reviewed && students.reviewed.length > 0 ? (
                            students.reviewed.map((student, index) => (
                                <motion.div
                                    key={`${student.student_id}-${student.job_id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <StudentCard student={student} onReviewClick={handleReviewClick} />
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-gray-400 mb-2">
                                    <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-medium text-gray-600">No reviews yet</h4>
                                <p className="text-gray-500">Start by reviewing students from your accepted applications.</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Review Modal */}
            <CreateStudentReviewModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedStudent(null);
                }}
                student={selectedStudent}
                publisherId={publisherId}
                onSubmitSuccess={handleReviewSubmit}
                existingReview={selectedStudent?.existing_review_id ? {
                    rating: selectedStudent.existing_rating,
                    review_text: selectedStudent.existing_review_text
                } : null}
            />
        </>
    );
}

export default StudentReviewsSection;