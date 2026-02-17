const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../settings.json');

const DEFAULT_SETTINGS = {
    token_expiry_hours: 3  // Default: 3 hours
};

/**
 * Read settings from settings.json (or return defaults)
 */
function getSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
        }
    } catch (err) {
        console.error('Error reading settings:', err.message);
    }
    return { ...DEFAULT_SETTINGS };
}

/**
 * Write settings to settings.json
 */
function saveSettings(settings) {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 4), 'utf-8');
    return merged;
}

/**
 * Get token expiry as string for jwt.sign (e.g. '3h')
 */
function getTokenExpiry() {
    const settings = getSettings();
    const hours = Math.max(1, Math.min(720, Number(settings.token_expiry_hours) || 3));
    return `${hours}h`;
}

/**
 * Get token expiry as milliseconds for cookie maxAge
 */
function getTokenExpiryMs() {
    const settings = getSettings();
    const hours = Math.max(1, Math.min(720, Number(settings.token_expiry_hours) || 3));
    return hours * 60 * 60 * 1000;
}

module.exports = { getSettings, saveSettings, getTokenExpiry, getTokenExpiryMs };
