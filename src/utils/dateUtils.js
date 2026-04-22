/**
 * Formats a UTC timestamp to India Standard Time (IST)
 * @param {string|Date} timestamp - The UTC timestamp or Date object
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time string in IST
 */
export const formatToIST = (timestamp, options = { hour: '2-digit', minute: '2-digit', second: '2-digit' }) => {
    if (!timestamp) return 'N/A';
    try {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('en-IN', {
            ...options,
            timeZone: 'Asia/Kolkata',
            hour12: true
        }).format(date);
    } catch (err) {
        console.error('Error formatting IST time:', err);
        return 'Invalid Time';
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
        const date = new Date(timestamp);
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
