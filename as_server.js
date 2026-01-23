require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ============================================
// ROUTES
// ============================================
const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');
const dbRoutes = require('./routes/dbRoutes');
const userRoutes = require('./routes/userRoutes');
const logRoutes = require('./routes/logRoutes');

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/logs', logRoutes);
app.use('/', formRoutes);
app.use('/', dbRoutes);

// ============================================
// SERVE STATIC FORMS & ADMIN PANEL
// ============================================
const formsDir = path.join(__dirname, 'checksheet_form');
app.use('/form', express.static(formsDir));

// Shorthand for images/assets (legacy support)
app.use('/images', express.static(path.join(formsDir, 'dist/images')));
app.use('/assets', express.static(path.join(formsDir, 'dist/assets')));

// SPA Fallback for Dynamic Forms (/form/edw, etc.)
app.get(/^\/form\/([^/]+)(?:\/.*)?$/, (req, res, next) => {
    const formName = req.params[0];
    if (req.path.match(/\.\w+$/)) return next();

    const formPath = path.join(formsDir, formName, 'index.html');
    if (fs.existsSync(formPath)) {
        res.sendFile(formPath);
    } else {
        res.status(404).send('Form not found');
    }
});

// Admin Panel
const appBuildDir = path.join(__dirname, 'checksheet_admin/dist');
app.use(express.static(appBuildDir));

// SPA Fallback for Admin Panel
app.get(/.*/, (req, res) => {
    // Skip API routes that might have fallen through
    if (req.path.startsWith('/auth') || req.path.startsWith('/api') || ['/new', '/search', '/options', '/db'].some(p => req.path.startsWith(p))) {
        return res.status(404).send('API endpoint not found');
    }

    const indexHtml = path.join(appBuildDir, 'index.html');
    if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
    } else {
        res.status(404).send('Web App build not found. Please run "npm run build" in checksheet-template.');
    }
});

const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
