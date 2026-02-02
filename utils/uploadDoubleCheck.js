const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base upload directory for double check images
const uploadDir = path.join(__dirname, '../double_check');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Creates a multer upload instance for double_check
 * Folder structure: double_check/{year}/{month}/{machine_no}/
 */
const createDoubleCheckStorage = () => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            // Get year/month
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');

            // Get machine_no from request body or query
            const machineNo = (req.body.machine_no || req.query.machine_no || 'UNKNOWN')
                .replace(/[^a-zA-Z0-9_\-\.]/g, '_'); // Sanitize

            // Create folder path: year/month/machine_no
            const subFolder = path.join(uploadDir, year.toString(), month, machineNo);

            if (!fs.existsSync(subFolder)) {
                fs.mkdirSync(subFolder, { recursive: true });
            }

            // Attach relative path for URL construction
            req.fileRelativePath = `${year}/${month}/${machineNo}`;

            cb(null, subFolder);
        },
        filename: (req, file, cb) => {
            // Create unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);

            // Filename: dc-{timestamp}.{ext}
            cb(null, `dc-${uniqueSuffix}${ext}`);
        }
    });
};

// File filter (Images only)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed!'));
    }
};

const uploadDoubleCheck = multer({
    storage: createDoubleCheckStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

module.exports = uploadDoubleCheck;
