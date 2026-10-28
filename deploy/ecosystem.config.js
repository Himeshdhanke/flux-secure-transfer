module.exports = {
  apps: [
    {
      name: 'secureshare-api',
      script: './src/server.js',
      cwd: '/var/www/secureshare/server',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/secureshare/err.log',
      out_file: '/var/log/secureshare/out.log',
      max_memory_restart: '1G',
    },
  ],
};
