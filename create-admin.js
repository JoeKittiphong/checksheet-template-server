require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createAdmin(code, username, password) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO users (code, username, password_hash, role, create_at) VALUES ($1, $2, $3, $4, NOW())',
            [code, username, hash, 'admin']
        );

        console.log(`Admin user ${username} created successfully!`);
        process.exit(0);
    } catch (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
    }
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 3) {
    console.log('Usage: node create-admin.js <code> <username> <password>');
    process.exit(1);
}

createAdmin(args[0], args[1], args[2]);
