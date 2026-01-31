const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const { authenticateToken, ADMIN_ROLES } = require('../middleware/auth');

const formsDir = path.join(__dirname, '../checksheet_form');

const pool = require('../config/db');

// Endpoint to list available forms
router.get('/available-forms', authenticateToken, async (req, res) => {
    try {
        // 1. Get List of Templates (Folders)
        const files = await fs.promises.readdir(formsDir, { withFileTypes: true });
        const templates = files
            .filter(dirent => dirent.isDirectory() && dirent.name.trim() === dirent.name) // Ignore "ghost" folders with spaces
            .map(dirent => {
                const metaPath = path.join(formsDir, dirent.name, 'meta.json');
                let meta = {};
                if (fs.existsSync(metaPath)) {
                    try {
                        const metaContent = fs.readFileSync(metaPath, 'utf8');
                        meta = JSON.parse(metaContent);
                    } catch (e) {
                        console.error(`Error reading meta.json for ${dirent.name}:`, e);
                    }
                }
                return {
                    id: dirent.name, // Template ID (Folder Name)
                    ...meta
                };
            });

        // 2. Get Machine Assignments from DB
        const result = await pool.query('SELECT * FROM as_machine_master');
        const machineAssignments = result.rows;

        // 3. Generate Final Cards
        const finalForms = [];

        templates.forEach(template => {
            // Find assignments for this template
            const assignments = machineAssignments.filter(m => m.assigned_form === template.id);

            if (assignments.length > 0) {
                // If assigned to machines, create a card for each machine
                assignments.forEach(machine => {
                    finalForms.push({
                        name: template.checksheet_name || template.id,
                        label: `${template.checksheet_name || template.id} (${machine.machine_no})`, // Dynamic Label
                        path: `/${template.id}?machine_no=${machine.machine_no}&model=${machine.model}`, // Pass params in URL
                        department: machine.department || template.department,
                        model: machine.model || template.model,
                        as_group: template.as_group,
                        machine_no: machine.machine_no // Explicit machine no
                    });
                });
            } else {
                // If no specific assignment, show generic card (Legacy behavior)
                // Only if it's not strictly a machine-specific form (optional logic)
                finalForms.push({
                    name: template.checksheet_name || template.id,
                    label: template.checksheet_name ? `${template.checksheet_name} - ${template.model || ''}` : template.id,
                    path: `/${template.id}`,
                    department: template.department,
                    model: template.model,
                    as_group: template.as_group,
                    machine_no: 'UNKNOWN'
                });
            }
        });

        // Filter based on department for non-admins
        const user = req.user;
        const isAdmin = ADMIN_ROLES.includes(user.role);

        const filteredForms = isAdmin
            ? finalForms
            : finalForms.filter(form => form.department === user.department);

        res.json(filteredForms);

    } catch (err) {
        console.error('Error listing forms:', err);
        res.status(500).json({ error: 'Failed to retrieve forms' });
    }
});

module.exports = router;
