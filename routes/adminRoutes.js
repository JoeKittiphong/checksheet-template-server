const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Helper to get directories
const getDirectories = source =>
    fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

// GET /api/admin/templates
// List all available checksheet templates from the filesystem
router.get('/templates', (req, res) => {
    try {
        const formsDir = path.join(__dirname, '../checksheet_form');

        // Ensure directory exists
        if (!fs.existsSync(formsDir)) {
            return res.json({ success: true, templates: [] });
        }

        const folders = getDirectories(formsDir);
        const templates = [];

        folders.forEach(folder => {
            const metaPath = path.join(formsDir, folder, 'meta.json');
            let metaData = null;

            if (fs.existsSync(metaPath)) {
                try {
                    const fileContent = fs.readFileSync(metaPath, 'utf-8');
                    metaData = JSON.parse(fileContent);
                } catch (err) {
                    console.error(`Error reading meta.json for ${folder}:`, err.message);
                    metaData = { error: 'Invalid meta.json' };
                }
            }

            templates.push({
                folderName: folder,
                meta: metaData,
                hasMeta: !!metaData,
                url: `/form/${folder}` // Assuming base path convention
            });
        });

        res.json({
            success: true,
            count: templates.length,
            templates: templates
        });

    } catch (error) {
        console.error('Admin Template List Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
