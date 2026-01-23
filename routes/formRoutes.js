const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const formsDir = path.join(__dirname, '../checksheet_form');

// Endpoint to list available forms
router.get('/available-forms', (req, res) => {
    fs.readdir(formsDir, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.error('Error reading forms directory:', err);
            return res.status(500).json({ error: 'Failed to retrieve forms' });
        }

        const forms = files
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
                const metaPath = path.join(formsDir, dirent.name, 'meta.json');
                let meta = {};
                if (fs.existsSync(metaPath)) {
                    try {
                        const metaContent = fs.readFileSync(metaPath, 'utf8');
                        meta = JSON.parse(metaContent);
                    } catch (e) {
                        console.error(`Error reading meta.json for ${dirent.name}:`, e);
                    }
                }

                return {
                    name: meta.checksheet_name || dirent.name,
                    label: meta.checksheet_name ? `${meta.checksheet_name} - ${meta.model || ''}` : dirent.name,
                    path: `/${dirent.name}`,
                    department: meta.department,
                    model: meta.model,
                    as_group: meta.as_group
                };
            });

        res.json(forms);
    });
});

module.exports = router;
