module.exports = {
  apps: [
    {
      name: 'growventory-api',
      script: './dist/server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '../deploy/logs/api-err.log',
      out_file: '../deploy/logs/api-out.log',
      time: true
    }
  ]
};
