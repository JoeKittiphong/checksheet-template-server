const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// List all users
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, code, username, role, create_at FROM users ORDER BY create_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

// Create new user
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { code, username, password, role } = req.body;
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
            'INSERT INTO users (code, username, password_hash, role, create_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, code, username, role',
            [code, username, hash, role]
        );

        await logActivity({
            user_code: req.user.code,
            username: req.user.username,
            action_type: 'CREATE_USER',
            target_id: result.rows[0].id.toString(),
            details: { code, username, role },
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
    const { username, password, role, code } = req.body;

    try {
        let query = 'UPDATE users SET username = $1, role = $2, code = $3';
        let params = [username, role, code, id];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            query += ', password_hash = $4 WHERE id = $5';
            params = [username, role, code, hash, id];
        } else {
            query += ' WHERE id = $4';
        }

        await pool.query(query, params);

        await logActivity({
            user_code: req.user.code,
            username: req.user.username,
            action_type: 'UPDATE_USER',
            target_id: id,
            details: { code, username, role, password_updated: !!password },
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
