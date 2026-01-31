require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const formsDir = 'd:/Program e-checksheet/template-E-checksheet/server-checksheet/checksheet_form';

async function testForms() {
    try {
        console.log("Reading directory...");
        const files = await fs.promises.readdir(formsDir, { withFileTypes: true });

        const templates = files
            .filter(dirent => dirent.isDirectory() && dirent.name.trim() === dirent.name) // Logic from formRoutes
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
                    id: dirent.name,
                    ...meta
                };
            });

        console.log("Templates found:", templates.map(t => t.id));

        console.log("Querying DB...");
        const result = await pool.query('SELECT * FROM as_machine_master');
        const machineAssignments = result.rows;
        console.log("Assignments found:", machineAssignments);

        const finalForms = [];

        templates.forEach(template => {
            console.log(`Checking template: ${template.id}`);
            const assignments = machineAssignments.filter(m => m.assigned_form === template.id);
            console.log(`Assignments for ${template.id}: ${assignments.length}`);

            if (assignments.length > 0) {
                assignments.forEach(machine => {
                    finalForms.push({
                        label: `${template.checksheet_name || template.id} (${machine.machine_no})`,
                        machine_no: machine.machine_no
                    });
                });
            } else {
                finalForms.push({
                    label: template.checksheet_name,
                    machine_no: 'UNKNOWN'
                });
            }
        });

        console.log("FINAL RESULTS:");
        console.log(finalForms);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

testForms();
