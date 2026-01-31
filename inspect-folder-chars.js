const fs = require('fs');
const path = require('path');

const dir = 'd:/Program e-checksheet/template-E-checksheet/server-checksheet/checksheet_form';

fs.readdir(dir, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }
    files.forEach(f => {
        if (f.includes('ASSY_PROBLEM')) {
            console.log(`Name: "${f}"`);
            console.log(`Codes: ${f.split('').map(c => c.charCodeAt(0)).join(', ')}`);
        }
    });
});
