const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all logs with optional filtering
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    const { user_code, action_type, start_date, end_date, limit = 100 } = req.query;
    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (user_code) {
        query += ` AND user_code = $${paramIndex}`;
        params.push(user_code);
        paramIndex++;
    }

    if (action_type) {
        query += ` AND action_type = $${paramIndex}`;
        params.push(action_type);
        paramIndex++;
    }

    if (start_date) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
    }

    if (end_date) {
        // Add 23:59:59 to include the whole end day if only date is provided
        const endDateWithTime = end_date.includes(' ') ? end_date : `${end_date} 23:59:59`;
        query += ` AND created_at <= $${paramIndex}`;
        params.push(endDateWithTime);
        paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    try {
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch logs' });
    }
});

module.exports = router;
