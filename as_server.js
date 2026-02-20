require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const { authenticateToken, JWT_SECRET } = require('./middleware/auth');
const jwt = require('jsonwebtoken');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

// ============================================
// ROUTES
// ============================================
const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');
const dbRoutes = require('./routes/dbRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/upload');
const formsRoutes = require('./routes/forms');
const adminRoutes = require('./routes/adminRoutes');
const logRoutes = require('./routes/logRoutes');

app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/logs', logRoutes);
app.use('/api/upload', uploadRoutes); // Non-authenticated for builder preview convenience if needed
app.use('/api/forms', formsRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/', formRoutes);
app.use('/', dbRoutes);
app.use('/uploads/assy_problem', express.static(path.join(__dirname, 'upload_images/assy_problem'))); // Assy problem images (Legacy)
app.use('/uploads/assy_problem_images', express.static(path.join(__dirname, 'upload_images/assy_problem'))); // Assy problem images (New Path)
app.use('/uploads/double_check', authenticateToken, express.static(path.join(__dirname, 'upload_images/double_check'))); // Double check images
app.use('/uploads/assets', express.static(path.join(__dirname, 'upload_images/assets'))); // Asset Library images (Publicly accessible)
app.use('/uploads', authenticateToken, express.static(path.join(__dirname, 'uploads'))); // Serve legacy location

// ============================================
// SERVE STATIC FORMS & ADMIN PANEL
// ============================================
const formsDir = path.join(__dirname, 'checksheet_form');

// Allow public access to manifest.webmanifest for PWA
app.get('/form/:formName/manifest.webmanifest', (req, res) => {
    // Serve from the unified FORMVIEWER build or specific legacy folders
    // Prioritize FORMVIEWER as it's the main PWA engine
    const manifestPath = path.join(formsDir, 'FORMVIEWER', 'manifest.webmanifest');
    if (fs.existsSync(manifestPath)) {
        res.sendFile(manifestPath);
    } else {
        res.status(404).send('Manifest not found');
    }
});

// 0. Serve Static Forms (Assets & JSON) - PRIORITY
app.use('/form', authenticateToken, express.static(formsDir));

// SPA Fallback for Dynamic Forms (/form/edw, etc.)

// Explicitly handle JSON form requests to prevent falling through to SPA
app.get('/form/:name.json', authenticateToken, (req, res) => {
    const filePath = path.join(formsDir, `${req.params.name}.json`);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'Form file not found' });
    }
});

// SPA Fallback for Dynamic Forms (/form/edw, etc.)
app.get(/^\/form\/([^/]+)(?:\/.*)?$/, (req, res, next) => {
    // Check authentication and redirect to login if not authenticated
    const token = req.cookies.token;
    if (!token) return res.redirect('/');

    // Verify token validity to prevent "bounce"
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Token invalid or expired
            res.clearCookie('token');
            return res.redirect('/');
        }

        // Token is valid, proceed
        const formName = req.params[0];
        if (req.path.match(/\.\w+$/)) return next();

        // 1. Try to serve specific form (Legacy HTML)
        const formPath = path.join(formsDir, formName, 'index.html');
        if (fs.existsSync(formPath)) {
            return res.sendFile(formPath);
        }

        // 2. Fallback to Generic Form Viewer (Dynamic JSON)
        // If the specific folder exists (it should for assets), but no index.html,
        // we serve the Viewer engine.
        // Even if folder doesn't exist, we might want to let Viewer handle 404s gracefully,
        // but typically the folder is created when saving.
        const viewerPath = path.join(formsDir, 'FORMVIEWER', 'index.html');
        if (fs.existsSync(viewerPath)) {
            return res.sendFile(viewerPath);
        }

        res.status(404).send('Form not found');
    });
});

// 1. Form Builder (Secured for Admin)
// Mount at both /builder and /form/FORMBUILDER to satisfy the built app's asset paths
// NOW SERVED FROM checksheet_form/FORMBUILDER (Unified Location)
app.use('/builder', authenticateToken, express.static(path.join(formsDir, 'FORMBUILDER')));
app.use('/form/FORMBUILDER', authenticateToken, express.static(path.join(formsDir, 'FORMBUILDER')));

// 2. Admin Panel (Public Static)
const appBuildDir = path.join(__dirname, 'checksheet_admin/dist');
app.use(express.static(appBuildDir));

// 3. Serve checksheet forms (Secured Assets)


// Shorthand for images/assets (legacy support - secured)
app.use('/images', authenticateToken, express.static(path.join(formsDir, 'dist/images')));
app.use('/assets', authenticateToken, express.static(path.join(formsDir, 'dist/assets')));

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

process.on('uncaughtException', (err) => {
    console.error('FATAL ERROR: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('FATAL ERROR: Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
});
