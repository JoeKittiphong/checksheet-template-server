require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function inspect() {
    try {
        console.log("Querying as_checksheet_db...");
        const res = await pool.query('SELECT id, checksheet_name, machine_no, department, model FROM as_checksheet_db ORDER BY id DESC LIMIT 10');
        console.log('Recent Checksheets:', res.rows);
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        pool.end();
    }
}

inspect();
