const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const FORMS_DIR = path.join(__dirname, '..', 'checksheet_form');
const ASSETS_DIR = path.join(__dirname, '..', 'upload_images', 'assets');

// Ensure directories exist
if (!fs.existsSync(FORMS_DIR)) fs.mkdirSync(FORMS_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

// GET /api/forms/list
// List all JSON forms as workspaces
router.get('/list', (req, res) => {
    try {
        if (!fs.existsSync(FORMS_DIR)) {
            return res.json({ success: true, forms: [] });
        }
        const files = fs.readdirSync(FORMS_DIR);
        const forms = files
            .filter(f => f.endsWith('.json'))
            .map(f => path.basename(f, '.json'));

        res.json({ success: true, forms });
    } catch (err) {
        console.error('List Forms Error:', err);
        res.status(500).json({ success: false, message: 'Failed to list forms' });
    }
});

// GET /api/forms/load?name=...
// Load a specific form's JSON
router.get('/load', (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });

    const filePath = path.join(FORMS_DIR, `${name}.json`);
    if (!fs.existsSync(filePath)) {
        return res.json({ success: true, data: null, message: 'New form' });
    }

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        res.json({ success: true, data: JSON.parse(data) });
    } catch (err) {
        console.error('Load Form Error:', err);
        res.status(500).json({ success: false, message: 'Failed to load form' });
    }
});

// POST /api/forms/save
// Save form JSON and ensure asset workspace folder exists
router.post('/save', (req, res) => {
    const { name, data } = req.body;
    if (!name || !data) return res.status(400).json({ success: false, message: 'Name and data required' });

    try {
        // 1. Save JSON File
        const filePath = path.join(FORMS_DIR, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

        // 2. Ensure Asset Workspace Directory exists
        const workspaceAssetDir = path.join(ASSETS_DIR, name);
        if (!fs.existsSync(workspaceAssetDir)) {
            fs.mkdirSync(workspaceAssetDir, { recursive: true });
        }

        res.json({ success: true, message: 'Form and Workspace saved successfully' });
    } catch (err) {
        console.error('Save Form Error:', err);
        res.status(500).json({ success: false, message: 'Failed to save form' });
    }
});

module.exports = router;
