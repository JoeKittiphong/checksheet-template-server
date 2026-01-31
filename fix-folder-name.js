const fs = require('fs');
const path = require('path');

const dir = 'd:/Program e-checksheet/template-E-checksheet/server-checksheet/checksheet_form';

fs.readdir(dir, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Files found:', files);

    const badFolder = files.find(f => f.trim() === 'ASSY_PROBLEM' && f.length > 'ASSY_PROBLEM'.length);

    if (badFolder) {
        console.log(`Found bad folder: "${badFolder}" (Length: ${badFolder.length})`);
        const oldPath = path.join(dir, badFolder);
        const newPath = path.join(dir, 'ASSY_PROBLEM');

        fs.rename(oldPath, newPath, (err) => {
            if (err) console.error('Rename failed:', err);
            else console.log('Rename successful!');
        });
    } else {
        console.log('No bad folder found. Checking for exact match "ASSY_PROBLEM"...');
        const exact = files.find(f => f === 'ASSY_PROBLEM');
        if (exact) console.log('Found correct folder: "ASSY_PROBLEM"');
        else console.log('Neither bad nor good folder found??');
    }
});
