require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixMachines() {
    try {
        console.log("Fixing UNKNOWN machine numbers for ASSY PROBLEM FORM...");

        // Update all 'ASSY PROBLEM FORM' with 'UNKNOWN' machine_no to 'NO.1'
        // We assume NO.1 is the default since that's what the user mentioned.
        const res = await pool.query(`
            UPDATE as_checksheet_db 
            SET machine_no = 'NO.1' 
            WHERE checksheet_name = 'ASSY PROBLEM FORM' 
              AND machine_no = 'UNKNOWN'
        `);

        console.log(`Updated ${res.rowCount} records.`);

    } catch (err) {
        console.error('Error updating DB:', err);
    } finally {
        pool.end();
    }
}

fixMachines();
