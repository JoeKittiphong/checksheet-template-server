const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Login
router.post('/login', async (req, res) => {
    const { code, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE code = $1', [code]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            await logActivity({
                user_code: code,
                action_type: 'LOGIN_FAILURE',
                details: 'Invalid code or password',
                req
            });
            return res.status(401).json({ success: false, error: 'Invalid code or password' });
        }

        const token = jwt.sign(
            { id: user.id, code: user.code, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to false to allow login over HTTP via Nginx
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        await logActivity({
            user_code: user.code,
            username: user.username,
            action_type: 'LOGIN_SUCCESS',
            req
        });

        res.json({
            success: true,
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error during login' });
    }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
    await logActivity({
        user_code: req.user.code,
        username: req.user.username,
        action_type: 'LOGOUT',
        req
    });
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out' });
});

// Get Current User (Me)
router.get('/me', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// Register Initial Admin
router.post('/register-admin', async (req, res) => {
    const { code, username, password } = req.body;
    try {
        const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO users (code, username, password_hash, role, create_at) VALUES ($1, $2, $3, $4, NOW())',
            [code, username, hash, 'admin']
        );

        res.json({ success: true, message: 'Admin registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

module.exports = router;
