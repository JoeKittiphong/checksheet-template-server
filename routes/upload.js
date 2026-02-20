const express = require('express');
const router = express.Router();
console.log('[DEBUG] Loading upload.js route file');
const upload = require('../utils/uploadConfig');
const uploadDoubleCheck = require('../utils/uploadDoubleCheck');
const uploadAssets = require('../utils/uploadAssets');
const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

// POST /api/upload/assy
router.post('/assy', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const relativePath = req.fileRelativePath
            ? `${req.fileRelativePath}/${req.file.filename}`
            : req.file.filename;

        res.json({
            success: true,
            message: 'File uploaded successfully',
            filename: relativePath,
            path: req.file.path
        });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

// POST /api/upload/double-check
// Saves to: double_check/{year}/{month}/{machine_no}/
router.post('/double-check', uploadDoubleCheck.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Relative path: year/month/machine_no/filename
        const relativePath = req.fileRelativePath
            ? `${req.fileRelativePath}/${req.file.filename}`
            : req.file.filename;

        res.json({
            success: true,
            message: 'File uploaded successfully',
            filename: relativePath,
            path: req.file.path
        });
    } catch (err) {
        console.error('Double Check Upload Error:', err);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

// DELETE /api/upload/delete
// Deletes an uploaded image file
// Body: { filename: "2026/02/NO.1/dc-123.jpg", folder: "double_check" | "assy_problem_images" }
router.delete('/delete', async (req, res) => {
    try {
        const { filename, folder } = req.body;

        if (!filename || !folder) {
            return res.status(400).json({ success: false, message: 'Missing filename or folder' });
        }

        // Validate folder name to prevent directory traversal
        const allowedFolders = ['double_check', 'assy_problem'];
        if (!allowedFolders.includes(folder)) {
            return res.status(400).json({ success: false, message: 'Invalid folder' });
        }

        // Sanitize filename to prevent directory traversal attacks
        const sanitizedFilename = filename.replace(/\.\./g, '');

        // Construct full path
        const filePath = path.join(__dirname, '..', 'upload_images', folder, sanitizedFilename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Delete file
        fs.unlinkSync(filePath);

        console.log(`Deleted file: ${filePath}`);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (err) {
        console.error('Delete Error:', err);
        res.status(500).json({ success: false, message: 'Server error during delete' });
    }
});

// --- ASSET MANAGEMENT ROUTES ---

// GET /api/upload/assets
// Returns list of all files in upload_images/assets/[workspace]
router.get('/assets', async (req, res) => {
    try {
        const { workspace } = req.query;
        const subFolder = workspace || 'general';
        const assetDir = path.join(__dirname, '..', 'upload_images', 'assets', subFolder);

        if (!fs.existsSync(assetDir)) {
            return res.json({ success: true, assets: [] });
        }

        const files = fs.readdirSync(assetDir);
        const assets = files.map(file => ({
            name: file,
            url: `/uploads/assets/${subFolder}/${file}`,
            type: 'image'
        })).filter(a => /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(a.name));

        res.json({ success: true, assets });
    } catch (err) {
        console.error('Fetch Assets Error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching assets' });
    }
});

// POST /api/upload/assets
// Uploads a new asset to the library
router.post('/assets', uploadAssets.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const workspace = req.headers['x-workspace-name'] || 'general';

        res.json({
            success: true,
            message: 'Asset uploaded successfully',
            filename: req.file.filename,
            url: `/uploads/assets/${workspace}/${req.file.filename}`
        });
    } catch (err) {
        console.error('Asset Upload Error:', err);
        res.status(500).json({ success: false, message: 'Server error during asset upload' });
    }
});

// DELETE /api/upload/assets
// Deletes an asset from the library
// Body: { filename: "image.png", workspace: "workspace_name" }
router.delete('/assets', async (req, res) => {
    try {
        const { filename, workspace } = req.body;

        if (!filename) {
            return res.status(400).json({ success: false, message: 'Filename required' });
        }

        const subFolder = workspace || 'general';
        // Validate filename to prevent traversal
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const assetPath = path.join(__dirname, '..', 'upload_images', 'assets', subFolder, sanitizedFilename);

        if (!fs.existsSync(assetPath)) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        fs.unlinkSync(assetPath);
        res.json({ success: true, message: 'Asset deleted successfully' });
    } catch (err) {
        console.error('Delete Asset Error:', err);
        res.status(500).json({ success: false, message: 'Server error deleting asset' });
    }
});

module.exports = router;
