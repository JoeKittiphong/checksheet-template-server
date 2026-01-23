const pool = require('../config/db');

/**
 * Logs an activity to the database
 * @param {Object} params
 * @param {string} params.user_code - Employee code of the user
 * @param {string} params.username - Name of the user
 * @param {string} params.action_type - Type of action (e.g., LOGIN, UPDATE_CHECK)
 * @param {string} params.target_id - ID of the affected resource
 * @param {Object|string} params.details - Additional details (will be stringified if object)
 * @param {import('express').Request} params.req - Express request object to extract IP
 */
const logActivity = async ({ user_code, username, action_type, target_id, details, req }) => {
    try {
        const ip_address = req?.headers['x-forwarded-for'] || req?.socket.remoteAddress || 'unknown';
        const details_str = typeof details === 'object' ? JSON.stringify(details) : details;

        await pool.query(
            'INSERT INTO activity_logs (user_code, username, action_type, target_id, details, ip_address, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
            [user_code || 'system', username || 'System', action_type, target_id || null, details_str || null, ip_address]
        );
    } catch (err) {
        console.error('Failed to record log:', err);
    }
};

module.exports = { logActivity };
