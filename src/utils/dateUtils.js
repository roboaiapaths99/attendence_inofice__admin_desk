/**
 * Formats a UTC timestamp to India Standard Time (IST)
 * @param {string|Date} timestamp - The UTC timestamp or Date object
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time string in IST
 */
export const formatToIST = (timestamp, options = { hour: '2-digit', minute: '2-digit', second: '2-digit' }) => {
    if (!timestamp) return 'N/A';
    try {
        // Ensure string timestamps are treated as UTC if they lack timezone info
        let dateStr = timestamp;
        if (typeof timestamp === 'string' && !timestamp.endsWith('Z') && !timestamp.includes('+')) {
            dateStr = timestamp.includes('T') ? `${timestamp}Z` : `${timestamp.replace(' ', 'T')}Z`;
        }
        
        const date = new Date(dateStr);
        
        // Use Intl with explicit IST target
        return new Intl.DateTimeFormat('en-IN', {
            ...options,
            timeZone: 'Asia/Kolkata',
            hour12: true
        }).format(date);
    } catch (e) {
        console.error('Date formatting error:', e);
        return 'Invalid Date';
    }
};

/**
 * Formats a UTC timestamp to a date string in IST
 * @param {string|Date} timestamp - The UTC timestamp or Date object
 * @returns {string} Formatted date string in IST
 */
export const formatDateToIST = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
        // Ensure string timestamps are treated as UTC if they lack timezone info
        let dateStr = timestamp;
        if (typeof timestamp === 'string' && !timestamp.endsWith('Z') && !timestamp.includes('+')) {
            dateStr = timestamp.includes('T') ? `${timestamp}Z` : `${timestamp.replace(' ', 'T')}Z`;
        }

        const date = new Date(dateStr);
        
        // Check if date is valid
        if (isNaN(date.getTime())) return 'Invalid Date';

        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Kolkata'
        }).format(date);
    } catch (err) {
        console.error('Error formatting IST date:', err);
        return 'Invalid Date';
    }
};

/**
 * Returns a relative date label (Today, Yesterday, or Date) in IST
 * @param {string|Date} timestamp - The UTC timestamp or Date object
 * @returns {string} "Today", "Yesterday", or formatted date (e.g., "22 Apr")
 */
export const getRelativeDateLabel = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
        const date = new Date(timestamp);
        
        // Get IST current date components
        const now = new Date();
        const istNowStr = new Intl.DateTimeFormat('en-IN', {
            year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Asia/Kolkata'
        }).format(now);
        
        const istDateStr = new Intl.DateTimeFormat('en-IN', {
            year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Asia/Kolkata'
        }).format(date);

        if (istNowStr === istDateStr) return 'Today';

        // Check for Yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const istYesterdayStr = new Intl.DateTimeFormat('en-IN', {
            year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Asia/Kolkata'
        }).format(yesterday);

        if (istYesterdayStr === istDateStr) return 'Yesterday';

        // Older than yesterday
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            timeZone: 'Asia/Kolkata'
        }).format(date);
    } catch (err) {
        console.error('Error getting relative date label:', err);
        return '';
    }
};
