const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// List all users with their online status based on logs
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const query = `
            WITH LastActivity AS (
                SELECT DISTINCT ON (user_code) 
                    user_code, 
                    action_type as last_action, 
                    created_at as last_action_at
                FROM activity_logs
                WHERE action_type IN ('LOGIN_SUCCESS', 'LOGOUT')
                ORDER BY user_code, created_at DESC
            )
            SELECT 
                u.id, 
                u.code, 
                u.username, 
                u.role, 
                u.department,
                u.create_at,
                la.last_action,
                la.last_action_at
            FROM users u
            LEFT JOIN LastActivity la ON u.code = la.user_code
            ORDER BY u.create_at DESC
        `;
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

// Create new user
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { code, username, password, role, department } = req.body;
    if (!code || !username || !password || !role) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        // Check if user already exists
        const checkUser = await pool.query('SELECT id FROM users WHERE code = $1', [code]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'User code already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO users (code, username, password_hash, role, department, create_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, code, username, role, department',
            [code, username, hash, role, department || null]
        );

        await logActivity({
            user_code: req.user.code,
            username: req.user.username,
            action_type: 'CREATE_USER',
            target_id: result.rows[0].id.toString(),
            details: { code, username, role, department },
            req
        });

        res.json({ success: true, message: 'User created successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ success: false, error: 'Failed to create user' });
    }
});

// Update user
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, password, role, code, department } = req.body;

    try {
        let query = 'UPDATE users SET username = $1, role = $2, code = $3, department = $4';
        let params = [username, role, code, department || null, id];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            query += ', password_hash = $5 WHERE id = $6';
            params = [username, role, code, department || null, hash, id];
        } else {
            query += ' WHERE id = $5';
        }

        await pool.query(query, params);

        await logActivity({
            user_code: req.user.code,
            username: req.user.username,
            action_type: 'UPDATE_USER',
            target_id: id,
            details: { code, username, role, department, password_updated: !!password },
            req
        });

        res.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ success: false, error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    // Prevent deleting itself if needed (optional)
    if (req.user.id == id) {
        return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    }

    try {
        // Fetch info before delete
        const userResult = await pool.query('SELECT code, username, role FROM users WHERE id = $1', [id]);
        const targetUser = userResult.rows[0];

        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        if (targetUser) {
            await logActivity({
                user_code: req.user.code,
                username: req.user.username,
                action_type: 'DELETE_USER',
                target_id: id,
                details: {
                    info: `Deleted user: ${targetUser.username} (${targetUser.code})`,
                    role: targetUser.role
                },
                req
            });
        }

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
});

module.exports = router;
