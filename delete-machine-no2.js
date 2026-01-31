require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function deleteNo2() {
    try {
        console.log("Deleting Machine NO.2...");
        const res = await pool.query("DELETE FROM as_machine_master WHERE machine_no = 'NO.2'");
        console.log(`Deleted ${res.rowCount} record(s).`);
    } catch (err) {
        console.error('Error deleting:', err);
    } finally {
        pool.end();
    }
}

deleteNo2();
