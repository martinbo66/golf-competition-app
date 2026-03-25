#!/bin/bash
# One-time setup script for a fresh Digital Ocean Ubuntu 24.04 LTS droplet.
# Run as root: bash setup-droplet.sh
#
# After running this script:
#   1. Configure the database — either:
#        a) Run setup-postgres.sh for a local Postgres instance, OR
#        b) Edit /opt/golfcomp/.env with external DB credentials
#   2. Ensure your deploy SSH public key is in ~/.ssh/authorized_keys
#   3. Trigger the "Deploy to Digital Ocean" workflow in GitHub Actions

set -e

echo "=== Golf Competition App - Droplet Setup ==="

# ── Install Java 21 ──────────────────────────────────────────────────────────
echo "Installing Java 21..."
apt-get update -q
apt-get install -y openjdk-21-jre-headless
java -version

# ── Create dedicated app user and directories ─────────────────────────────────
echo "Creating golfcomp user and directories..."
if ! id -u golfcomp &>/dev/null; then
    useradd -r -s /bin/false golfcomp
fi
mkdir -p /opt/golfcomp/deploy
mkdir -p /opt/golfcomp/logs
chown -R golfcomp:golfcomp /opt/golfcomp

# ── Create .env placeholder ───────────────────────────────────────────────────
if [ ! -f /opt/golfcomp/.env ]; then
    cat > /opt/golfcomp/.env << 'ENVEOF'
# Database connection — fill in before first deploy.
# For local Postgres: run scripts/setup-postgres.sh, which writes these values.
# For external DB: set to your provider's JDBC URL and credentials.
GOLFCOMP_DB_URL=jdbc:postgresql://localhost:5432/golfcomp
GOLFCOMP_DB_USERNAME=golfcomp
GOLFCOMP_DB_PASSWORD=
ENVEOF
    chown golfcomp:golfcomp /opt/golfcomp/.env
    chmod 600 /opt/golfcomp/.env
    echo "Created /opt/golfcomp/.env — edit or run setup-postgres.sh to populate it."
fi

# ── Allow golfcomp service restart without password ───────────────────────────
SUDOERS_FILE="/etc/sudoers.d/golfcomp-restart"
if [ ! -f "$SUDOERS_FILE" ]; then
    echo "%sudo ALL=(ALL) NOPASSWD: /bin/systemctl restart golfcomp, /bin/systemctl is-active golfcomp" > "$SUDOERS_FILE"
    chmod 440 "$SUDOERS_FILE"
fi

# ── Create systemd service ───────────────────────────────────────────────────
cat > /etc/systemd/system/golfcomp.service << 'EOF'
[Unit]
Description=Golf Competition App
After=network.target

[Service]
Type=simple
User=golfcomp
WorkingDirectory=/opt/golfcomp
EnvironmentFile=/opt/golfcomp/.env
ExecStart=/usr/bin/java \
    -Xmx256m \
    -jar /opt/golfcomp/golf-competition-app.jar \
    --spring.profiles.active=prod \
    --spring.output.ansi.enabled=NEVER
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=golfcomp

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable golfcomp

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Set up the database:"
echo "       Local Postgres:  bash scripts/setup-postgres.sh"
echo "       External DB:     edit /opt/golfcomp/.env"
echo "  2. Ensure your deploy SSH public key is in ~/.ssh/authorized_keys"
echo "  3. Add GitHub Secrets: DO_HOST, DO_USER, DO_SSH_KEY"
echo "  4. Trigger the 'Deploy to Digital Ocean' workflow in GitHub Actions"
echo ""
echo "After first deploy, verify with:"
echo "  sudo systemctl status golfcomp"
echo "  tail -f /opt/golfcomp/logs/app.log"
