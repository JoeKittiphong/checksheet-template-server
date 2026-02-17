-- ==========================================
-- E-Checksheet System - Complete Database Schema
-- Database: checksheet_db (Refined from Screenshots)
-- ==========================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    code character varying(100) NOT NULL UNIQUE,
    username character varying(100) NOT NULL,
    password_hash character varying(100) NOT NULL,
    role character varying(100) NOT NULL,
    create_at timestamp without time zone DEFAULT now(),
    department character varying(255)
);

-- 2. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_code character varying(50),
    username character varying(255),
    action_type character varying(50),
    target_id character varying(100),
    details text,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT now()
);

-- 3. Main Checksheet Database
CREATE TABLE IF NOT EXISTS as_checksheet_db (
    id SERIAL PRIMARY KEY,
    department character varying(100),
    model character varying(100),
    machine_no character varying(100),
    as_group character varying(100),
    checksheet_name character varying(100),
    checksheet_data jsonb,
    hash character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    status character varying(20) DEFAULT 'prepare'
);

-- 4. Machine Master Table
CREATE TABLE IF NOT EXISTS as_machine_master (
    id SERIAL PRIMARY KEY,
    machine_no character varying(50) UNIQUE NOT NULL,
    model character varying(100),
    assigned_form character varying(100),
    department character varying(50),
    created_at timestamp without time zone DEFAULT now()
);

-- 5. Assy Problem Database
CREATE TABLE IF NOT EXISTS as_assy_problem_db (
    id SERIAL PRIMARY KEY,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    checker_name character varying(100),
    checked_date date,
    machine_no character varying(50),
    form_data jsonb,
    status character varying(50) DEFAULT 'pending'
);

-- 6. Assy Problem Images Table
CREATE TABLE IF NOT EXISTS as_assy_problem_images (
    id SERIAL PRIMARY KEY,
    report_id integer REFERENCES as_assy_problem_db(id) ON DELETE CASCADE,
    field_name character varying(100),
    file_path character varying(255),
    original_name character varying(255),
    created_at timestamp without time zone DEFAULT now()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_code ON users(code);
CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_code);
CREATE INDEX IF NOT EXISTS idx_checksheet_machine ON as_checksheet_db(machine_no);
CREATE INDEX IF NOT EXISTS idx_checksheet_status ON as_checksheet_db(status);

-- ==========================================
-- INITIAL DATA
-- ==========================================

-- Insert Default Admin User (Password: admin123)
-- Note: code length in screenshots is 100, password_hash 100
INSERT INTO users (code, username, password_hash, role, department) 
VALUES ('ADMIN', 'Admin Account', '$2b$10$45RLaPNqAVdiiZU29.6OYuS2tcy1YDeM4S0uuaiqZYzghA1M4ka3y', 'admin', 'ENGINEERING')
ON CONFLICT (code) DO NOTHING;
