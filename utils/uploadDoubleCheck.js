const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base upload directory for double check images
const uploadDir = path.join(__dirname, '../upload_images/double_check');
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
            // Standardize Year/Month
            const date = new Date();
            const year = date.getFullYear().toString();
            const month = String(date.getMonth() + 1).padStart(2, '0');

            // Get model and machine_no from request body or query
            const model = (req.body.model || req.query.model || 'UNKNOWN')
                .replace(/[^a-zA-Z0-9_\-\.]/g, '_');
            const machineNo = (req.body.machine_no || req.query.machine_no || 'UNKNOWN')
                .replace(/[^a-zA-Z0-9_\-\.]/g, '_');

            // Create folder path: year/month/model/machine_no/image
            const subFolder = path.join(uploadDir, year, month, model, machineNo, 'image');

            if (!fs.existsSync(subFolder)) {
                fs.mkdirSync(subFolder, { recursive: true });
            }

            // Attach relative path for URL construction (standardized forward slash)
            req.fileRelativePath = `${year}/${month}/${model}/${machineNo}/image`;

            cb(null, subFolder);
        },
        filename: (req, file, cb) => {
            // Helper to sanitize filename parts
            const clean = (str) => {
                if (!str) return 'UNKNOWN';
                return String(str)
                    .replace(/[^a-zA-Z0-9ก-ฮะ-ูเ-์_\-\s]/g, '') // Allow Thai characters and basics
                    .trim()
                    .replace(/\s+/g, '_'); // Replace spaces with underscores
            };

            // Get metadata from body (sent by CompactImageUpload or uploadPendingFiles)
            const model = clean(req.body.model);
            const machine = clean(req.body.machine_no);
            const part = clean(req.body.part_name || req.body.row_id || 'PART');
            const step = req.body.step || 'X';

            // Unique suffix to avoid collisions for the same part
            const uniqueSuffix = Date.now().toString().slice(-4);
            const ext = path.extname(file.originalname).toLowerCase() || '.jpg';

            // Filename: {model}-{machine}-{part}-Check{step}-{suffix}.{ext}
            const finalFilename = `${model}-${machine}-${part}-Check${step}-${uniqueSuffix}${ext}`;

            cb(null, finalFilename);
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
