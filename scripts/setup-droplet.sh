#!/bin/bash
# One-time setup script for a fresh Digital Ocean Ubuntu 24.04 LTS droplet.
# Run as root: bash setup-droplet.sh
#
# After running this script:
#   1. Create /opt/golfcomp/.env with your Supabase credentials (see below)
#   2. Add your deploy SSH public key to /home/<deploy-user>/.ssh/authorized_keys
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
chown -R golfcomp:golfcomp /opt/golfcomp

# ── Create .env placeholder ───────────────────────────────────────────────────
if [ ! -f /opt/golfcomp/.env ]; then
    cat > /opt/golfcomp/.env << 'ENVEOF'
# Supabase PostgreSQL connection (replace placeholders before first deploy)
# Find these in Supabase: Settings → Database → Connection string → JDBC URI
GOLFCOMP_DB_URL=jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require
GOLFCOMP_DB_USERNAME=postgres.<project-ref>
GOLFCOMP_DB_PASSWORD=<your-supabase-database-password>
ENVEOF
    chown golfcomp:golfcomp /opt/golfcomp/.env
    chmod 600 /opt/golfcomp/.env
    echo "Created /opt/golfcomp/.env — EDIT THIS FILE with your Supabase credentials before deploying!"
fi

# ── Allow golfcomp service restart without password ───────────────────────────
# The deploy script runs 'sudo systemctl restart golfcomp' as the SSH user.
# Add a sudoers rule so this specific command doesn't need a password.
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
echo "  1. Edit /opt/golfcomp/.env with your Supabase credentials"
echo "  2. Ensure your deploy SSH public key is in ~/.ssh/authorized_keys"
echo "  3. Add GitHub Secrets: DO_HOST, DO_USER, DO_SSH_KEY"
echo "  4. Trigger the 'Deploy to Digital Ocean' workflow in GitHub Actions"
echo ""
echo "After first deploy, verify with:"
echo "  sudo systemctl status golfcomp"
echo "  journalctl -u golfcomp -f"
