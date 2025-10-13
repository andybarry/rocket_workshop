module.exports = {
  apps: [{
    name: 'feedback-app',
    script: 'server.js',
    cwd: '/home/abarry/feedback',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/home/abarry/feedback/logs/err.log',
    out_file: '/home/abarry/feedback/logs/out.log',
    log_file: '/home/abarry/feedback/logs/combined.log',
    time: true
  }]
};
