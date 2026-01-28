const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, requireAdmin, ADMIN_ROLES } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// ... [Keep imports and existing code up to /options] ...

// Get distinct values for dropdowns (with cascading filter)
router.get('/options', authenticateToken, async (req, res) => {
    let { department, model } = req.query;

    // Security: Enforce department for non-admins
    const user = req.user;
    const isAdmin = ADMIN_ROLES.includes(user.role);
    if (!isAdmin) {
        department = user.department;
    }

    try {
        let departmentsQuery = 'SELECT DISTINCT department FROM as_checksheet_db';
        let departmentsParams = [];

        // If strict department, filter the department list too
        if (!isAdmin) {
            departmentsQuery += ' WHERE department = $1';
            departmentsParams = [user.department];
        }
        departmentsQuery += ' ORDER BY department';
        const departments = await pool.query(departmentsQuery, departmentsParams);

        let modelsQuery = 'SELECT DISTINCT model FROM as_checksheet_db';
        let modelsParams = [];
        if (department) {
            modelsQuery += ' WHERE department = $1';
            modelsParams = [department];
        }
        modelsQuery += ' ORDER BY model';
        const models = await pool.query(modelsQuery, modelsParams);

        let machinesQuery = 'SELECT DISTINCT machine_no FROM as_checksheet_db WHERE 1=1';
        let machinesParams = [];
        let paramIndex = 1;
        if (department) {
            machinesQuery += ` AND department = $${paramIndex}`;
            machinesParams.push(department);
            paramIndex++;
        }
        if (model) {
            machinesQuery += ` AND model = $${paramIndex}`;
            machinesParams.push(model);
            paramIndex++;
        }
        machinesQuery += ' ORDER BY machine_no';
        const machines = await pool.query(machinesQuery, machinesParams);

        let asGroupsQuery = 'SELECT DISTINCT as_group FROM as_checksheet_db WHERE 1=1';
        let asGroupsParams = [];
        paramIndex = 1;
        if (department) {
            asGroupsQuery += ` AND department = $${paramIndex}`;
            asGroupsParams.push(department);
            paramIndex++;
        }
        if (model) {
            asGroupsQuery += ` AND model = $${paramIndex}`;
            asGroupsParams.push(model);
            paramIndex++;
        }
        asGroupsQuery += ' ORDER BY as_group';
        const asGroups = await pool.query(asGroupsQuery, asGroupsParams);

        res.json({
            departments: departments.rows.map(r => r.department),
            models: models.rows.map(r => r.model),
            machines: machines.rows.map(r => r.machine_no),
            asGroups: asGroups.rows.map(r => r.as_group)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching options' });
    }
});

// Search with filters
router.get('/search', authenticateToken, async (req, res) => {
    let { department, model, machine_no, as_group, checksheet_name } = req.query;

    // Security: Enforce department for non-admins
    const user = req.user;
    const isAdmin = ADMIN_ROLES.includes(user.role);
    if (!isAdmin) {
        department = user.department;
    }

    let query = `
        SELECT 
            id, department, model, machine_no, as_group, checksheet_name, 
            CASE 
                WHEN checksheet_data IS NOT NULL AND checksheet_data::text != '{}' THEN true 
                ELSE false 
            END as has_data
        FROM as_checksheet_db 
        WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (department) {
        query += ` AND department = $${paramIndex}`;
        params.push(department);
        paramIndex++;
    }
    if (model) {
        query += ` AND model = $${paramIndex}`;
        params.push(model);
        paramIndex++;
    }
    if (machine_no) {
        query += ` AND machine_no = $${paramIndex}`;
        params.push(machine_no);
        paramIndex++;
    }
    if (as_group) {
        query += ` AND as_group = $${paramIndex}`;
        params.push(as_group);
        paramIndex++;
    }
    if (checksheet_name) {
        query += ` AND checksheet_name = $${paramIndex}`;
        params.push(checksheet_name);
        paramIndex++;
    }

    query += ' ORDER BY id DESC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error searching data' });
    }
});

// ... [Keep updates and logic] ...

// Load form data by machine info
router.get('/api/load-form-by-machine', authenticateToken, async (req, res) => {
    let { department, model, machine_no, as_group, checksheet_name } = req.query;

    // Security: Enforce department for non-admins
    const user = req.user;
    const isAdmin = ADMIN_ROLES.includes(user.role);
    if (!isAdmin) {
        department = user.department;
    }

    try {
        const result = await pool.query(
            `SELECT * FROM as_checksheet_db WHERE department = $1 AND model = $2 AND machine_no = $3 AND as_group = $4 AND checksheet_name = $5 ORDER BY id DESC LIMIT 1`,
            [department, model, machine_no, as_group, checksheet_name]
        );
        if (result.rows.length === 0) return res.json({ success: true, data: null, message: 'No existing form found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error loading form:', err);
        res.status(500).json({ success: false, error: 'Error loading form data' });
    }
});

// Delete form by ID
router.delete('/api/delete-form/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch info before delete to log details
        const itemResult = await pool.query('SELECT department, model, machine_no, checksheet_name FROM as_checksheet_db WHERE id = $1', [id]);
        const item = itemResult.rows[0];

        await pool.query('DELETE FROM as_checksheet_db WHERE id = $1', [id]);

        if (item) {
            await logActivity({
                user_code: req.user.code,
                username: req.user.username,
                action_type: 'DELETE_CHECKSHEET',
                target_id: id.toString(),
                details: {
                    info: `Deleted checksheet: ${item.checksheet_name}`,
                    metadata: item
                },
                req
            });
        }

        res.json({ success: true, message: 'Form deleted successfully' });
    } catch (err) {
        console.error('Error deleting form:', err);
        res.status(500).json({ success: false, error: 'Error deleting form' });
    }
});

module.exports = router;
