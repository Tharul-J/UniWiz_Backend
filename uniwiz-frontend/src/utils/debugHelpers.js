// FILE: src/utils/debugHelpers.js (Debug Helpers for Development)
// ========================================================================

// Function to clear localStorage and reload the page
export function clearLocalStorageAndReload() {
    console.log('Clearing localStorage...');
    localStorage.clear();
    console.log('localStorage cleared. Reloading page...');
    window.location.reload();
}

// Function to check localStorage for invalid data
export function checkLocalStorage() {
    console.log('Checking localStorage...');
    const keys = Object.keys(localStorage);
    console.log('localStorage keys:', keys);
    
    keys.forEach(key => {
        try {
            const value = localStorage.getItem(key);
            if (value) {
                JSON.parse(value);
                console.log(`✅ ${key}: Valid JSON`);
            }
        } catch (error) {
            console.error(`❌ ${key}: Invalid JSON - ${error.message}`);
            console.log(`Value: ${localStorage.getItem(key)}`);
        }
    });
}

// Function to safely get user from localStorage
export function getSafeUserFromStorage() {
    try {
        const userData = localStorage.getItem('user');
        if (!userData) return null;
        
        const user = JSON.parse(userData);
        if (!user || typeof user !== 'object') {
            console.error('Invalid user data in localStorage');
            localStorage.removeItem('user');
            return null;
        }
        
        return user;
    } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        localStorage.removeItem('user');
        return null;
    }
}

// Function to safely set user in localStorage
export function setSafeUserInStorage(user) {
    try {
        if (!user || typeof user !== 'object') {
            throw new Error('Invalid user object');
        }
        localStorage.setItem('user', JSON.stringify(user));
        console.log('User saved to localStorage successfully');
    } catch (error) {
        console.error('Error saving user to localStorage:', error);
        localStorage.removeItem('user');
    }
}

// Add these functions to window for easy access in browser console
if (typeof window !== 'undefined') {
    window.clearLocalStorageAndReload = clearLocalStorageAndReload;
    window.checkLocalStorage = checkLocalStorage;
    window.getSafeUserFromStorage = getSafeUserFromStorage;
    window.setSafeUserInStorage = setSafeUserInStorage;
    
    console.log('🔧 Debug helpers loaded! Available functions:');
    console.log('- clearLocalStorageAndReload()');
    console.log('- checkLocalStorage()');
    console.log('- getSafeUserFromStorage()');
    console.log('- setSafeUserInStorage(user)');
} 