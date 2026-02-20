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
        // 1. Get List of Templates (Folders & JSON Files)
        const files = await fs.promises.readdir(formsDir, { withFileTypes: true });

        // 1.1 Process Directories (Legacy & Assets)
        const dirTemplates = files
            .filter(dirent => dirent.isDirectory() && dirent.name.trim() === dirent.name)
            .filter(dirent => !['FORMBUILDER', 'FORMVIEWER', 'dist', 'node_modules'].includes(dirent.name)) // Exclude system folders
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
                    source: 'folder',
                    ...meta
                };
            });

        // 1.2 Process JSON Files (New Builder Forms)
        const jsonTemplates = [];
        files.forEach(dirent => {
            if (dirent.isFile() && dirent.name.endsWith('.json') && dirent.name !== 'meta.json' && dirent.name !== 'package.json') {
                const formId = path.basename(dirent.name, '.json');

                // Avoid duplicates if folder already exists (Folder takes precedence for assets, but JSON is the source)
                if (dirTemplates.some(t => t.id === formId)) return;

                const filePath = path.join(formsDir, dirent.name);
                let meta = {};
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const formData = JSON.parse(content);
                    // Extract meta from formSettings if available, or use defaults
                    meta = formData.formSettings?.meta || {
                        checksheet_name: formId,
                        model: 'Universal',
                        category: 'General'
                    };
                } catch (e) {
                    console.error(`Error reading JSON form ${dirent.name}:`, e);
                }

                jsonTemplates.push({
                    id: formId,
                    source: 'json',
                    ...meta
                });
            }
        });

        const templates = [...dirTemplates, ...jsonTemplates];

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
                    const baseUrl = template.source === 'json' ? `/form/${template.id}` : `/${template.id}`;
                    finalForms.push({
                        name: template.checksheet_name || template.id,
                        label: `${template.checksheet_name || template.id} (${machine.machine_no})`,
                        path: `${baseUrl}?machine_no=${machine.machine_no}&model=${machine.model}`,
                        department: machine.department || template.department,
                        model: machine.model || template.model,
                        available_models: template.available_models,
                        as_group: template.as_group,
                        machine_no: machine.machine_no,
                        source: template.source
                    });
                });
            } else {
                // If no specific assignment, show generic card
                const baseUrl = template.source === 'json' ? `/${template.id}` : `/${template.id}`;
                finalForms.push({
                    name: template.checksheet_name || template.id,
                    label: template.checksheet_name ? `${template.checksheet_name} - ${template.model || ''}` : template.id,
                    path: baseUrl,
                    department: template.department,
                    model: template.model,
                    available_models: template.available_models,
                    as_group: template.as_group,
                    machine_no: 'UNKNOWN',
                    source: template.source
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
