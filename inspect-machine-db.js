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
        const res = await pool.query('SELECT * FROM as_machine_master');
        console.log('Machine Master Records:', res.rows);
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        pool.end();
    }
}

inspect();
