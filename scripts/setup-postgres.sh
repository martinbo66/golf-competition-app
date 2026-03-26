#!/bin/bash
# Sets up a local PostgreSQL instance for the Golf Competition App.
# Run as root on the droplet AFTER setup-droplet.sh: bash setup-postgres.sh
#
# What this script does:
#   - Installs PostgreSQL
#   - Creates the 'golfcomp' role and database
#   - Generates a random password and writes it to /opt/golfcomp/.env
#   - Updates the systemd service to depend on postgresql.service

set -e

echo "=== Golf Competition App - PostgreSQL Setup ==="

# ── Install PostgreSQL ────────────────────────────────────────────────────────
echo "Installing PostgreSQL..."
apt-get update -q
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# ── Create DB role and database ───────────────────────────────────────────────
echo "Creating golfcomp role and database..."
DB_PASSWORD=$(openssl rand -base64 24)

sudo -u postgres psql << SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'golfcomp') THEN
    CREATE ROLE golfcomp LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE golfcomp PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE golfcomp OWNER golfcomp'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'golfcomp')\gexec
SQL

echo "Database ready."

# ── Write credentials to .env ─────────────────────────────────────────────────
ENV_FILE=/opt/golfcomp/.env
cat > "$ENV_FILE" << ENVEOF
GOLFCOMP_DB_URL=jdbc:postgresql://localhost:5432/golfcomp
GOLFCOMP_DB_USERNAME=golfcomp
GOLFCOMP_DB_PASSWORD=${DB_PASSWORD}
ENVEOF
chown golfcomp:golfcomp "$ENV_FILE"
chmod 600 "$ENV_FILE"
echo "Credentials written to $ENV_FILE"

# ── Update systemd service to require PostgreSQL ──────────────────────────────
# Patches the [Unit] section so the app waits for Postgres on every boot.
SERVICE=/etc/systemd/system/golfcomp.service
if grep -q "After=network.target$" "$SERVICE"; then
    sed -i 's/After=network.target$/After=network.target postgresql.service\nRequires=postgresql.service/' "$SERVICE"
    systemctl daemon-reload
    echo "systemd service updated to depend on postgresql.service"
fi

echo ""
echo "=== PostgreSQL setup complete ==="
echo ""
echo "Generated DB password (already saved to $ENV_FILE):"
echo "  ${DB_PASSWORD}"
echo ""
echo "Connect from your Mac via SSH tunnel:"
echo "  ssh -L 5432:localhost:5432 root@<droplet-ip>"
echo "  Then point your DB client at: localhost:5432 / golfcomp / <password above>"
echo ""
echo "Restart the app to pick up the new credentials:"
echo "  systemctl restart golfcomp"
echo "  tail -f /opt/golfcomp/logs/app.log"
