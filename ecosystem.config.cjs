module.exports = {
    apps: [{
        name: 'checksheet-server',
        script: 'as_server.js',
        instances: 1,
        autorestart: true,
        watch: false, // We disable watch to prevent 502s during ZIP extraction
        max_memory_restart: '2G',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        ignore_watch: [
            "temp_uploads",
            "checksheet_form",
            "upload_images",
            "uploads",
            "node_modules"
        ]
    }]
};
