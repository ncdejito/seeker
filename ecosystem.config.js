module.exports = {
  apps: [
    {
      name: 'seeker-api',
      script: 'dist/api/server.js',
      env_file: '.env',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
    },
  ],
}
