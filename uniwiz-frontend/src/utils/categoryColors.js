// FILE: src/utils/categoryColors.js (Auto Color Generation for Categories)
// ========================================================================

// Predefined color schemes for categories (for new categories)
const colorSchemes = [
    { bg: 'bg-accent-pink-light', text: 'text-accent-pink-dark' },
    { bg: 'bg-accent-teal-light', text: 'text-accent-teal-dark' },
    { bg: 'bg-accent-blue-light', text: 'text-accent-blue-dark' },
    { bg: 'bg-accent-purple-light', text: 'text-accent-purple-dark' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    { bg: 'bg-gray-100', text: 'text-gray-800' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    { bg: 'bg-orange-100', text: 'text-orange-800' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    { bg: 'bg-lime-100', text: 'text-lime-800' },
    { bg: 'bg-rose-100', text: 'text-rose-800' },
    { bg: 'bg-violet-100', text: 'text-violet-800' },
    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
    { bg: 'bg-sky-100', text: 'text-sky-800' }
];

// Default color for unknown categories
const defaultColor = { bg: 'bg-gray-100', text: 'text-gray-800' };

// Predefined category mappings (existing categories)
const predefinedCategories = {
    'Graphic Design': { bg: 'bg-accent-pink-light', text: 'text-accent-pink-dark' },
    'Content Writing': { bg: 'bg-accent-teal-light', text: 'text-accent-teal-dark' },
    'Web Development': { bg: 'bg-accent-blue-light', text: 'text-accent-blue-dark' },
    'IT & Software Development': { bg: 'bg-accent-blue-light', text: 'text-accent-blue-dark' },
    'Tutoring': { bg: 'bg-accent-purple-light', text: 'text-accent-purple-dark' },
    'Event Support': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'Data Entry & Admin': { bg: 'bg-gray-100', text: 'text-gray-800' },
    'Digital Marketing & SEO': { bg: 'bg-accent-pink-light', text: 'text-accent-pink-dark' },
    'Writing & Translation': { bg: 'bg-accent-teal-light', text: 'text-accent-teal-dark' },
    'Writing & Content': { bg: 'bg-accent-teal-light', text: 'text-accent-teal-dark' }
};

// Cache for dynamically assigned colors
const colorCache = new Map();

// Function to generate a hash from category name
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

// Function to get color for a category
export function getCategoryColor(categoryName) {
    if (!categoryName) return defaultColor;
    
    // Check if it's a predefined category
    if (predefinedCategories[categoryName]) {
        return predefinedCategories[categoryName];
    }
    
    // Check if we have a cached color for this category
    if (colorCache.has(categoryName)) {
        return colorCache.get(categoryName);
    }
    
    // Generate a new color based on the category name
    const hash = hashString(categoryName);
    const colorIndex = hash % colorSchemes.length;
    const color = colorSchemes[colorIndex];
    
    // Cache the color for future use
    colorCache.set(categoryName, color);
    
    return color;
}

// Function to get the combined CSS class
export function getCategoryColorClass(categoryName) {
    const color = getCategoryColor(categoryName);
    return `${color.bg} ${color.text}`;
}

// Function to get all category colors (for admin panel)
export function getAllCategoryColors(categories) {
    const result = {};
    categories.forEach(category => {
        result[category] = getCategoryColor(category);
    });
    return result;
}

// Function to reset color cache (useful for testing)
export function resetColorCache() {
    colorCache.clear();
}

// Export predefined categories for reference
export { predefinedCategories, colorSchemes, defaultColor }; 