#!/usr/bin/env bash
# ==============================================================================
# FLUX — AWS EC2 Automated Deployment Script (Ubuntu 22.04 / 24.04 LTS)
# ==============================================================================
set -e

echo "=== [1/5] Updating system packages & installing Nginx ==="
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw nginx fontconfig ca-certificates

echo "=== [2/5] Installing Node.js 20 LTS & PM2 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

echo "=== [3/5] Setting up project directory ==="
sudo mkdir -p /var/www/flux
sudo chown -R $USER:$USER /var/www/flux

if [ ! -d "/var/www/flux/.git" ]; then
    echo "Cloning repository..."
    git clone https://github.com/Himeshdhanke/flux-secure-transfer.git /var/www/flux
else
    echo "Updating existing repository..."
    cd /var/www/flux && git pull origin main
fi

cd /var/www/flux

echo "=== [4/5] Installing dependencies & building frontend ==="
cd /var/www/flux/server && npm ci --only=production
cd /var/www/flux/client && npm ci && npm run build

echo "=== [5/5] Configuring Nginx reverse proxy ==="
sudo cp /var/www/flux/deploy/nginx.conf /etc/nginx/sites-available/flux
sudo ln -sf /etc/nginx/sites-available/flux /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "======================================================================"
echo "✓ BUILD & NGINX SETUP COMPLETED!"
echo "Next: Create /var/www/flux/server/.env with your AWS credentials."
echo "Then start the backend with:"
echo "  cd /var/www/flux/server && pm2 start src/server.js --name flux-api"
echo "  pm2 save && pm2 startup"
echo "======================================================================"
