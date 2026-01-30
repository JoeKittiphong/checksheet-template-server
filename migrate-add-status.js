require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration: Add "status" column to as_checksheet_db');

        // Check if column exists
        const checkResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='as_checksheet_db' AND column_name='status';
        `);

        if (checkResult.rows.length > 0) {
            console.log('Column "status" already exists. Skipping...');
        } else {
            // Add column
            await pool.query(`
                ALTER TABLE as_checksheet_db 
                ADD COLUMN status VARCHAR(20) DEFAULT 'prepare';
            `);
            console.log('Successfully added "status" column.');
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

migrate();
