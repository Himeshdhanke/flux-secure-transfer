#!/usr/bin/env bash
# ==============================================================================
# SecureShare — Amazon EC2 Deployment Script (Ubuntu 22.04 / 24.04 LTS)
# ==============================================================================
set -e

echo "=== [1/6] Updating system packages ==="
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw nginx

echo "=== [2/6] Installing Node.js 22 LTS ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

echo "=== [3/6] Installing MongoDB Community Server ==="
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod

echo "=== [4/6] Installing application dependencies and building client ==="
# Assuming repository is at /var/www/secureshare
cd /var/www/secureshare
cd server && npm install --production
cd ../client && npm install && npm run build
cd ..

echo "=== [5/6] Configuring Nginx Reverse Proxy ==="
sudo cp deploy/nginx.conf /etc/nginx/sites-available/secureshare
sudo ln -sf /etc/nginx/sites-available/secureshare /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "=== [6/6] Starting SecureShare with PM2 ==="
cd /var/www/secureshare/server
pm2 start src/server.js --name "secureshare-api" -i max
pm2 save
pm2 startup

echo "=== DEPLOYMENT COMPLETED SUCCESSFULLY ==="
echo "SecureShare is now running on port 5000 behind Nginx on port 80/443."
