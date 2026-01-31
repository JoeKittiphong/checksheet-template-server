require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createTables() {
    try {
        console.log('Creating tables for Assy Problem Checksheet...');

        // 1. ตารางหลักสำหรับเก็บข้อมูลฟอร์ม
        await pool.query(`
            CREATE TABLE IF NOT EXISTS as_assy_problem_db (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- ข้อมูลพื้นฐาน (ปรับแก้ได้ตาม JSON ฟอร์มจริง)
                checker_name VARCHAR(100),
                checked_date DATE,
                machine_no VARCHAR(50),
                
                -- ข้อมูล JSON ก้อนใหญ่ (เผื่อ fields ยิบย่อยที่ไม่อยากสร้าง column)
                form_data JSONB DEFAULT '{}'::jsonb,
                
                status VARCHAR(50) DEFAULT 'draft' -- draft, submitted, approved
            );
        `);
        console.log('✔ Table "as_assy_problem_db" created (or already exists).');

        // 2. ตารางเก็บรูปภาพ (แยกออกมาเพื่อความ clean)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS as_assy_problem_images (
                id SERIAL PRIMARY KEY,
                report_id INTEGER REFERENCES as_assy_problem_db(id) ON DELETE CASCADE,
                
                field_name VARCHAR(100) NOT NULL, -- ชื่อช่อง input ที่รูปนี้สังกัดอยู่
                file_path VARCHAR(255) NOT NULL,  -- ชื่อไฟล์บน Server
                original_name VARCHAR(255),       -- ชื่อไฟล์เดิมที่ User อัพโหลดมา
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✔ Table "as_assy_problem_images" created (or already exists).');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating tables:', err);
        process.exit(1);
    }
}

createTables();
