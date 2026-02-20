const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
// UPDATED BY AGENT FOR JSON SUPPORT
const multer = require('multer');
const AdmZip = require('adm-zip');
const { requireAdmin } = require('../middleware/auth');
const { getSettings, saveSettings } = require('../utils/settings');

// Setup Multer for ZIP uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(`[Multer] Receiving file: ${file.originalname}`);
        const tempDir = path.join(__dirname, '../temp_uploads');
        if (!fs.existsSync(tempDir)) {
            console.log(`[Multer] Creating temp directory: ${tempDir}`);
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, `template_${Date.now()}.zip`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.zip') {
            cb(null, true);
        } else {
            cb(new Error('Only .zip files are allowed'));
        }
    }
});

// Helper to get directories
const getDirectories = source =>
    fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

// Helper: Async ZIP extraction (non-blocking)
const extractZipAsync = (zipFilePath, targetDir) => {
    return new Promise((resolve, reject) => {
        try {
            const zip = new AdmZip(zipFilePath);
            const entries = zip.getEntries();
            console.log(`[Upload] Extracting ${entries.length} entries...`);

            let extracted = 0;
            for (const entry of entries) {
                zip.extractEntryTo(entry, targetDir, true, true);
                extracted++;
                if (extracted % 50 === 0) {
                    console.log(`[Upload] Extracted ${extracted}/${entries.length} entries`);
                }
            }

            console.log(`[Upload] Extraction complete: ${extracted} entries`);
            resolve(extracted);
        } catch (err) {
            reject(err);
        }
    });
};

// Helper: Recursive delete directory
const deleteFolderRecursive = (dirPath) => {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dirPath);
    }
};

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

        // 1. Process Legacy Folders
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
                type: 'legacy',
                meta: metaData,
                hasMeta: !!metaData,
                url: `/form/${folder}`
            });
        });

        // 2. Process New JSON Forms
        const files = fs.readdirSync(formsDir);
        files.forEach(file => {
            if (file.endsWith('.json') && file !== 'meta.json') {
                const name = path.basename(file, '.json');
                const filePath = path.join(formsDir, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const formData = JSON.parse(content);

                    templates.push({
                        folderName: name,
                        type: 'json',
                        meta: formData.formSettings?.meta || {
                            form_name: name,
                            checksheet_name: name,
                            department: 'JSON',
                            version: '1.0'
                        },
                        hasMeta: true,
                        url: `/preview/${name}` // Point to the new FormViewer route
                    });
                } catch (err) {
                    console.error(`Error reading JSON form ${file}:`, err.message);
                }
            }
        });

        // Sort alphabetically by folderName
        templates.sort((a, b) => a.folderName.localeCompare(b.folderName));

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

// POST /api/admin/upload-template
// Upload a ZIP file and extract it to checksheet_form/[folder_name]
router.post('/upload-template', requireAdmin, (req, res, next) => {
    console.log(`[Upload] Request received at ${new Date().toISOString()}`);
    next();
}, upload.single('templateZip'), async (req, res) => {
    const { folderName } = req.body;
    console.log(`[Upload] Multer finished. folderName: ${folderName}, file: ${req.file ? req.file.filename : 'MISSING'}`);

    if (!folderName) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, error: 'Folder name is required' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, error: 'ZIP file is required' });
    }

    try {
        const targetDir = path.join(__dirname, '../checksheet_form', folderName);

        if (fs.existsSync(targetDir)) {
            console.log(`[Upload] Target directory exists, merging: ${targetDir}`);
        } else {
            console.log(`[Upload] Creating target directory: ${targetDir}`);
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Async extraction — does NOT block the event loop
        console.log(`[Upload] Starting async extraction to: ${targetDir}`);
        const entryCount = await extractZipAsync(req.file.path, targetDir);

        // Cleanup temp file
        console.log(`[Upload] Cleaning up temp file: ${req.file.path}`);
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: `Template uploaded and extracted to ${folderName} successfully (${entryCount} files)`,
            folderName
        });

    } catch (error) {
        console.error('Template Upload Error:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, error: `Failed to extract ZIP: ${error.message}` });
    }
});

// DELETE /api/admin/delete-template/:folderName
// Delete a template folder from checksheet_form/
router.delete('/delete-template/:folderName', requireAdmin, (req, res) => {
    const { folderName } = req.params;

    // Security: Validate folder name (no path traversal)
    if (!folderName || /[\/\\\.]{2}/.test(folderName) || /[<>:"|?*]/.test(folderName)) {
        return res.status(400).json({ success: false, error: 'Invalid folder name' });
    }

    try {
        const targetDir = path.join(__dirname, '../checksheet_form', folderName);

        if (!fs.existsSync(targetDir)) {
            return res.status(404).json({ success: false, error: `Template "${folderName}" not found` });
        }

        console.log(`[Delete] Deleting template folder: ${targetDir}`);
        deleteFolderRecursive(targetDir);
        console.log(`[Delete] Successfully deleted: ${folderName}`);

        res.json({
            success: true,
            message: `Template "${folderName}" deleted successfully`
        });

    } catch (error) {
        console.error('Template Delete Error:', error);
        res.status(500).json({ success: false, error: `Failed to delete template: ${error.message}` });
    }
});

// GET /api/admin/templates/:folderName/meta
// Read meta.json for a specific template
router.get('/templates/:folderName/meta', requireAdmin, (req, res) => {
    const { folderName } = req.params;

    if (!folderName || /[\/\\\.]{2}/.test(folderName) || /[<>:"|?*]/.test(folderName)) {
        return res.status(400).json({ success: false, error: 'Invalid folder name' });
    }

    try {
        const metaPath = path.join(__dirname, '../checksheet_form', folderName, 'meta.json');

        if (!fs.existsSync(metaPath)) {
            return res.json({ success: true, meta: {}, exists: false });
        }

        const content = fs.readFileSync(metaPath, 'utf-8');
        const meta = JSON.parse(content);
        res.json({ success: true, meta, exists: true });

    } catch (error) {
        console.error('Read Meta Error:', error);
        res.status(500).json({ success: false, error: `Failed to read meta.json: ${error.message}` });
    }
});

// PUT /api/admin/templates/:folderName/meta
// Write/update meta.json for a specific template
router.put('/templates/:folderName/meta', requireAdmin, (req, res) => {
    const { folderName } = req.params;
    const metaData = req.body;

    if (!folderName || /[\/\\\.]{2}/.test(folderName) || /[<>:"|?*]/.test(folderName)) {
        return res.status(400).json({ success: false, error: 'Invalid folder name' });
    }

    try {
        const formDir = path.join(__dirname, '../checksheet_form', folderName);

        if (!fs.existsSync(formDir)) {
            return res.status(404).json({ success: false, error: `Template folder "${folderName}" not found` });
        }

        const metaPath = path.join(formDir, 'meta.json');
        const jsonContent = JSON.stringify(metaData, null, 4);
        fs.writeFileSync(metaPath, jsonContent, 'utf-8');

        console.log(`[Meta] Updated meta.json for: ${folderName}`);
        res.json({ success: true, message: `meta.json updated for ${folderName}`, meta: metaData });

    } catch (error) {
        console.error('Write Meta Error:', error);
        res.status(500).json({ success: false, error: `Failed to write meta.json: ${error.message}` });
    }
});

// GET /api/admin/settings
// Read server settings (admin only)
router.get('/settings', requireAdmin, (req, res) => {
    try {
        const settings = getSettings();
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Read Settings Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/settings
// Update server settings (admin only)
router.put('/settings', requireAdmin, (req, res) => {
    try {
        const { token_expiry_hours } = req.body;

        const updates = {};
        if (token_expiry_hours !== undefined) {
            const hours = Number(token_expiry_hours);
            if (isNaN(hours) || hours < 1 || hours > 720) {
                return res.status(400).json({ success: false, error: 'token_expiry_hours must be between 1 and 720' });
            }
            updates.token_expiry_hours = hours;
        }

        const saved = saveSettings(updates);
        console.log(`[Settings] Updated:`, saved);
        res.json({ success: true, settings: saved, message: 'Settings updated. New token duration applies to next login.' });
    } catch (error) {
        console.error('Save Settings Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
