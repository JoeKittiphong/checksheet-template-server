const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../assy_problem_images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Dynamic Destination: Year/Month
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');

        const subFolder = path.join(uploadDir, `${year}/${month}`); // OS-specific path separators

        if (!fs.existsSync(subFolder)) {
            fs.mkdirSync(subFolder, { recursive: true });
        }

        // We attach the relative path to the request object so the route handler can use it
        req.fileRelativePath = `${year}/${month}`; // standardized forward slash for URL

        cb(null, subFolder);
    },
    filename: (req, file, cb) => {
        // extract metadata from body (multer processes text fields before files if appended order is correct)
        // Sanitization helper
        const safeStr = (str) => (str || 'UNKNOWN').replace(/[^a-zA-Z0-9_\-]/g, '');

        const model = safeStr(req.body.model);
        const machine = safeStr(req.body.machine_no);
        const group = safeStr(req.body.as_group);

        // secure filename: model-machine-group-timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);

        // Final Name: AL400-MC1-SEMI-170123...png
        cb(null, `${model}-${machine}-${group}-${uniqueSuffix}${ext}`);
    }
});

// File filter (Images only)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

module.exports = upload;
