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
        // If uploadConfig attached a relative path (e.g. "2024/01"), prepend it.
        const relativePath = req.fileRelativePath ? `${req.fileRelativePath}/${req.file.filename}` : req.file.filename;

        res.json({
            success: true,
            message: 'File uploaded successfully',
            filename: relativePath, // Returns "2024/01/model-machine-date.png"
            path: req.file.path
        });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

module.exports = router;
