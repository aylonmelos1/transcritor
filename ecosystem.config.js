module.exports = {
    apps: [{
        name: 'transcritor',
        script: 'dist/app.js',
        exec_mode: 'cluster',
        instances: '1',
        watch: false,
        env_production: {
            NODE_ENV: 'production',
            DISABLE_AUTH: 'false'
        }
    }]
};
