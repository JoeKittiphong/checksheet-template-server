const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure asset directory exists
const assetDir = path.join(__dirname, '../upload_images/assets');
if (!fs.existsSync(assetDir)) {
    fs.mkdirSync(assetDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Get workspace from header
        const workspace = req.headers['x-workspace-name'] || 'general';
        const workspaceDir = path.join(assetDir, workspace);

        if (!fs.existsSync(workspaceDir)) {
            fs.mkdirSync(workspaceDir, { recursive: true });
        }
        cb(null, workspaceDir);
    },
    filename: (req, file, cb) => {
        // Sanitize original filename
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E4);
        const ext = path.extname(safeName);
        const base = path.basename(safeName, ext);

        // Final Name: logo-170123...png
        cb(null, `${base}-${uniqueSuffix}${ext}`);
    }
});

// File filter (Images only)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (jpg, png, gif, svg, webp) are allowed!'));
    }
};

const uploadAssets = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for assets
    fileFilter: fileFilter
});

module.exports = uploadAssets;
