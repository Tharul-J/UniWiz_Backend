# Student Review Access Control Implementation

## Overview
This implementation restricts student reviews to only allow students to review publishers who have **accepted** their job applications. This ensures that only students who have actually worked with or been engaged by a publisher can leave reviews.

## Changes Made

### Backend Changes

#### 1. Enhanced `create_review.php` API
**File**: `uniwiz-backend/api/create_review.php`
- **Added validation check**: Before allowing any review creation or update, the API now checks if the student has at least one accepted application with the publisher
- **Database query**: Uses a JOIN between `job_applications` and `jobs` tables to verify `ja.status = 'accepted'`
- **Error response**: Returns 403 Forbidden with a clear message if student has no accepted applications

#### 2. New API Endpoint `can_review_publisher.php`
**File**: `uniwiz-backend/api/can_review_publisher.php`
- **Purpose**: Checks if a student can review a specific publisher
- **Parameters**: `student_id` and `publisher_id` via GET request
- **Returns**: JSON response with `can_review` boolean and accepted applications count
- **Usage**: Called by frontend to conditionally show/hide review button

### Frontend Changes

#### Updated `CompanyProfilePage.js`
**File**: `uniwiz-frontend/src/components/CompanyProfilePage.js`

**New state variables:**
```javascript
const [canReview, setCanReview] = useState(false);
const [reviewCheckLoading, setReviewCheckLoading] = useState(false);
```

**New function:**
```javascript
const checkCanReview = useCallback(async () => {
    // Calls can_review_publisher.php API
    // Sets canReview state based on response
}, [currentUser, publisherId]);
```

**Updated review button logic:**
- Review button only shows when `canReview === true`
- Shows informative message when student cannot review
- Includes loading state during permission check

## Business Logic

### Review Permission Rules
1. **Student must have applied** to at least one job posted by the publisher
2. **Application must be accepted** by the publisher  
3. **Only then can the student leave a review** for that publisher

### User Experience Flow
1. Student visits a publisher's profile page
2. Frontend checks if student can review this publisher (API call)
3. **If eligible**: Shows "Leave a Review" button
4. **If not eligible**: Shows informative message explaining the requirement
5. When student tries to submit review, backend validates again for security

## Database Dependencies

### Required Tables
- `job_applications` - stores application status
- `jobs` - links applications to publishers  
- `company_reviews` - stores the actual reviews

### Key Relationship
```sql
SELECT COUNT(*) as accepted_applications 
FROM job_applications ja 
JOIN jobs j ON ja.job_id = j.id 
WHERE ja.student_id = ? 
AND j.publisher_id = ? 
AND ja.status = 'accepted'
```

## Security Features

### Double Validation
1. **Frontend check**: Prevents UI from showing review option to ineligible students
2. **Backend validation**: Ensures no unauthorized reviews can be created via direct API calls

### Access Control
- 403 Forbidden response for unauthorized review attempts
- Clear error messages explaining the restriction
- Maintains existing review update functionality for eligible students

## Testing

### Test Scenarios
1. **Student with accepted application**: ✅ Can review publisher
2. **Student with only rejected/pending applications**: ❌ Cannot review publisher  
3. **Student with no applications**: ❌ Cannot review publisher
4. **Direct API manipulation attempts**: ❌ Blocked by backend validation

### API Testing
```bash
# Check review eligibility
curl "http://uniwiz-backend.test/api/can_review_publisher.php?student_id=1&publisher_id=1"

# Attempt unauthorized review (should fail)
POST /api/create_review.php
{"publisher_id":1,"student_id":1,"rating":5,"comment":"Test review"}
```

## Benefits

### For Publishers
- **Quality assurance**: Only reviews from students they've actually worked with
- **Authentic feedback**: Reviews are based on real working relationships
- **Prevents spam**: Eliminates random/malicious reviews from unrelated students

### For Students
- **Clear guidance**: Understands exactly when they can leave reviews
- **Professional process**: Mirrors real-world review systems where experience is required

### For Platform
- **Data integrity**: Ensures review authenticity and relevance
- **Trust building**: Users know reviews are from genuine work relationships
- **Professional standards**: Maintains high-quality feedback ecosystem

## Files Modified/Created

### Backend
- ✅ `uniwiz-backend/api/create_review.php` (modified)
- ✅ `uniwiz-backend/api/can_review_publisher.php` (created)

### Frontend  
- ✅ `uniwiz-frontend/src/components/CompanyProfilePage.js` (modified)

## Backward Compatibility
- Existing reviews remain unchanged
- Current review functionality preserved for eligible students
- No database schema changes required
- Seamless integration with existing review system