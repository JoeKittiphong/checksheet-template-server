const fs = require('fs');
const path = require('path');

// UNC path to bypass Windows trailing space limitation
// Note: We must use backslashes for the prefix \\?\
const ghostPath = '\\\\?\\d:\\Program e-checksheet\\template-E-checksheet\\server-checksheet\\checksheet_form\\ASSY_PROBLEM ';

console.log(`Attempting to delete: "${ghostPath}"`);

try {
    if (fs.existsSync(ghostPath)) {
        fs.rmSync(ghostPath, { recursive: true, force: true });
        console.log('SUCCESS: Deleted ghost folder.');
    } else {
        console.log('Folder not found (maybe already deleted?)');
    }
} catch (err) {
    console.error('FAILED:', err);
}
