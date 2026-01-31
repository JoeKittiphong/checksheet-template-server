require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS as_machine_master (
        id SERIAL PRIMARY KEY,
        machine_no VARCHAR(50) NOT NULL,
        model VARCHAR(100) NOT NULL,
        assigned_form VARCHAR(100) NOT NULL,
        department VARCHAR(50) DEFAULT 'ASSEMBLY',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

const seedDataQuery = `
    INSERT INTO as_machine_master (machine_no, model, assigned_form, department)
    VALUES 
    ('NO.1', 'AL400G', 'ASSY_PROBLEM', 'ASSEMBLY'),
    ('NO.2', 'AL400G', 'ASSY_PROBLEM', 'ASSEMBLY')
    ON CONFLICT DO NOTHING;
`;

const runMigration = async () => {
    try {
        console.log("Creating as_machine_master table...");
        await pool.query(createTableQuery);
        console.log("Table created successfully.");

        console.log("Seeding machine data...");
        await pool.query(seedDataQuery);
        console.log("Data seeded successfully.");

        console.log("Migration completed.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        pool.end();
    }
};

runMigration();
