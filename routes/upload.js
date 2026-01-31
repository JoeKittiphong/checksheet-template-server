const express = require('express');
const router = express.Router();
const upload = require('../utils/uploadConfig');
const pool = require('../config/db');

// POST /api/upload/assy
router.post('/assy', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Return the filename so frontend can save it
        res.json({
            success: true,
            message: 'File uploaded successfully',
            filename: req.file.filename,
            path: req.file.path
        });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

module.exports = router;
