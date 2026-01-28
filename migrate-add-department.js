require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    try {
        console.log('Adding department column to users table...');
        /* 
        SQL Command:
        ALTER TABLE users ADD COLUMN department VARCHAR(255);
        */
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255)');

        console.log('Migration successful: "department" column added.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
