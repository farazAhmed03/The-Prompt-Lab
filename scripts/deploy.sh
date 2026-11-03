#!/usr/bin/env bash
set -e

cd /home/ubuntu/The-Prompt-Lab

# Ensure environment file exists (preserves user secrets if present)
test -f .env || cp .env.example .env

DOMAIN="devops-project-demo.study"

# Provision SSL certificate if not already issued
if [ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
  echo "=== Provisioning SSL Certificate via Certbot ==="
  which certbot >/dev/null 2>&1 || (sudo apt-get update -y && sudo apt-get install -y certbot)
  docker compose stop frontend || true
  sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN
  sudo chmod -R 755 /etc/letsencrypt/live /etc/letsencrypt/archive
fi

# Build and start Docker containers
docker compose up -d --build --remove-orphans
docker image prune -f

# Health check verification
for i in $(seq 1 10); do
  if curl --fail --silent --output /dev/null http://localhost/api/status; then
    echo "============================================="
    echo " DEPLOYMENT & HEALTH CHECK SUCCESSFUL!       "
    echo "============================================="
    exit 0
  fi
  sleep 5
done

docker compose logs --tail=100
exit 1
