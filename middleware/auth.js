const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.', code: 'NO_TOKEN' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.clearCookie('token');
            return res.status(401).json({ error: 'Session expired. Please login again.', code: 'TOKEN_EXPIRED' });
        }
        res.status(401).json({ error: 'Invalid token.', code: 'INVALID_TOKEN' });
    }
};

const ADMIN_ROLES = ['admin', 'manager', 'supervisor', 'engineer'];

const requireAdmin = (req, res, next) => {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied. Admin level only.' });
    }
    next();
};

module.exports = { authenticateToken, requireAdmin, JWT_SECRET, ADMIN_ROLES };
