const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Create new checksheet record
router.post('/new', authenticateToken, requireAdmin, async (req, res) => {
    const { department, model, as_group, machine_no, checksheet_name } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO as_checksheet_db (department, model, as_group, machine_no, checksheet_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [department, model, as_group, machine_no, checksheet_name || null]
        );

        await logActivity({
            user_code: req.user.code,
            username: req.user.username,
            action_type: 'CREATE_CHECKSHEET',
            target_id: result.rows[0].id.toString(),
            details: { department, model, machine_no, checksheet_name },
            req
        });

        res.json({ success: true, message: 'Data created successfully', data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Error creating data' });
    }
});

// Get all data
router.get('/db', authenticateToken, requireAdmin, (req, res) => {
    pool.query('SELECT * FROM as_checksheet_db')
        .then((result) => {
            res.send(result.rows);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error connecting to database');
        });
});

// Get distinct values for dropdowns (with cascading filter)
router.get('/options', async (req, res) => {
    const { department, model } = req.query;
    try {
        const departments = await pool.query('SELECT DISTINCT department FROM as_checksheet_db ORDER BY department');

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
router.get('/search', async (req, res) => {
    const { department, model, machine_no, as_group, checksheet_name } = req.query;
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

// Update checksheet_name and checksheet_data by id
router.put('/update/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { checksheet_name, checksheet_data } = req.body;
    try {
        await pool.query(
            'UPDATE as_checksheet_db SET checksheet_name = $1, checksheet_data = $2 WHERE id = $3',
            [checksheet_name, JSON.stringify(checksheet_data), id]
        );
        res.json({ message: 'Data updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating data' });
    }
});

// Generate hash function (internal to this router)
function generateHash(data) {
    const crypto = require('crypto');
    const str = JSON.stringify(data);
    return crypto.createHash('md5').update(str).digest('hex');
}

// Save form data
router.post('/api/save-form', authenticateToken, async (req, res) => {
    const { id, department, model, machine_no, as_group, checksheet_name, checksheet_data } = req.body;
    try {
        const hash = generateHash(checksheet_data);
        if (id) {
            const result = await pool.query(
                `UPDATE as_checksheet_db SET department = $1, model = $2, machine_no = $3, as_group = $4, checksheet_name = $5, checksheet_data = $6, hash = $7 WHERE id = $8 RETURNING *`,
                [department, model, machine_no, as_group, checksheet_name, checksheet_data, hash, id]
            );

            await logActivity({
                user_code: req.user.code,
                username: req.user.username,
                action_type: 'UPDATE_CHECKSHEET',
                target_id: id.toString(),
                details: { department, model, machine_no, checksheet_name },
                req
            });

            res.json({ success: true, message: 'Form updated successfully', data: result.rows[0] });
        } else {
            const result = await pool.query(
                `INSERT INTO as_checksheet_db (department, model, machine_no, as_group, checksheet_name, checksheet_data, hash) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [department, model, machine_no, as_group, checksheet_name, checksheet_data, hash]
            );

            await logActivity({
                user_code: req.user.code,
                username: req.user.username,
                action_type: 'CREATE_CHECKSHEET_DATA',
                target_id: result.rows[0].id.toString(),
                details: { department, model, machine_no, checksheet_name },
                req
            });

            res.json({ success: true, message: 'Form saved successfully', data: result.rows[0] });
        }
    } catch (err) {
        console.error('Error saving form:', err);
        res.status(500).json({ success: false, error: 'Error saving form data' });
    }
});

// Load form data by ID
router.get('/api/load-form/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM as_checksheet_db WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Form not found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error loading form:', err);
        res.status(500).json({ success: false, error: 'Error loading form data' });
    }
});

// Load form data by machine info
router.get('/api/load-form-by-machine', authenticateToken, async (req, res) => {
    const { department, model, machine_no, as_group, checksheet_name } = req.query;
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
