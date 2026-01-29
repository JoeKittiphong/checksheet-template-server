require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function inspectConstraints() {
    try {
        console.log('Inspecting indexes for "as_checksheet_db"...');
        const indexResult = await pool.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'as_checksheet_db'
        `);
        console.table(indexResult.rows);

        console.log('\nInspecting triggers for "as_checksheet_db"...');
        const triggerResult = await pool.query(`
            SELECT event_object_table, trigger_name, event_manipulation, action_statement, action_timing
            FROM information_schema.triggers
            WHERE event_object_table = 'as_checksheet_db'
        `);
        console.table(triggerResult.rows);

        process.exit(0);
    } catch (err) {
        console.error('Inspection failed:', err);
        process.exit(1);
    }
}

inspectConstraints();
