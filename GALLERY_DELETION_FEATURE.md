# Gallery Image Deletion Feature

## Overview
Publishers can now delete individual gallery images from their profiles with enhanced visual feedback and confirmation dialogs.

## Features Implemented

### 1. Individual Image Deletion
- **Delete Button**: Each existing gallery image now has a red delete button (×) that appears on hover
- **Confirmation Dialog**: Users must confirm deletion to prevent accidental removals
- **Visual Feedback**: Deleted images are immediately removed from view with a notification

### 2. Enhanced UI/UX
- **Red Delete Button**: Clear, prominent delete button with hover effects for existing images
- **Yellow Delete Button**: For newly selected images that haven't been uploaded yet
- **Status Indicator**: Shows how many images are marked for deletion
- **Green Plus Indicator**: Shows newly added images that will be uploaded

### 3. State Management
- **Immediate Removal**: Images are removed from view immediately upon deletion
- **Backend Sync**: Actual file deletion occurs when the profile is saved
- **Rollback Prevention**: Once marked for deletion, images cannot be restored in the current session

## How It Works

### Frontend (ProfilePage.js)
1. **Delete Existing Images**: 
   - Click the red × button on any existing gallery image
   - Confirm deletion in the dialog
   - Image is immediately removed from view
   - Image ID is added to `imagesToRemove` array

2. **Remove New Images**:
   - Click the yellow × button on newly selected images
   - Images are removed from the selection without confirmation
   - Images are removed from both `selectedGalleryImages` and `galleryImagePreviews` arrays

3. **Status Display**:
   - Yellow info box shows how many images are marked for deletion
   - Visual indicators help distinguish between existing, new, and deleted images

### Backend (update_profile.php)
- Receives `remove_gallery_images` parameter with JSON array of image IDs
- Deletes files from filesystem using `unlink()`
- Removes database records from `publisher_images` table
- Uses proper security checks to ensure user can only delete their own images

## Usage Instructions

### For Publishers:
1. Go to Profile Page
2. Scroll to "Company Gallery" section
3. Hover over any existing image to see the delete button
4. Click the red × button to delete
5. Confirm deletion in the dialog
6. Save your profile to apply changes

### Visual Indicators:
- **Red × button**: Delete existing gallery images
- **Yellow × button**: Remove newly selected images  
- **Green + indicator**: Shows newly added images
- **Yellow info box**: Shows deletion count and status

## Technical Implementation

### State Variables:
```javascript
const [existingGalleryImages, setExistingGalleryImages] = useState([]);
const [selectedGalleryImages, setSelectedGalleryImages] = useState([]);
const [galleryImagePreviews, setGalleryImagePreviews] = useState([]);
const [imagesToRemove, setImagesToRemove] = useState([]);
```

### Key Functions:
```javascript
// Delete existing gallery image
const handleRemoveGalleryImage = (id) => {
    if (window.confirm('Are you sure you want to delete this gallery image?')) {
        setImagesToRemove(prev => [...prev, id]);
        setExistingGalleryImages(prev => prev.filter(img => img.id !== id));
        showNotification('Image will be removed when you save your profile.', 'info');
    }
};

// Remove newly selected image
const handleRemoveNewGalleryImage = (index) => {
    setSelectedGalleryImages(prev => prev.filter((_, i) => i !== index));
    setGalleryImagePreviews(prev => prev.filter((_, i) => i !== index));
};
```

## File Structure
```
uniwiz-frontend/src/components/ProfilePage.js - Main UI implementation
uniwiz-backend/api/update_profile.php - Backend deletion handling
uniwiz-backend/api/uploads/gallery/ - Gallery image storage directory
```

## Security Features
- User authentication required
- Users can only delete their own images  
- Server-side validation of image ownership
- Proper file cleanup from filesystem
- SQL injection protection with prepared statements

## Benefits
- **Better UX**: Clear visual feedback and confirmation dialogs
- **Mistake Prevention**: Confirmation dialogs prevent accidental deletions
- **Immediate Feedback**: Users see changes instantly
- **Clean Management**: Both existing and new images can be managed consistently
- **Secure**: Proper validation and ownership checks