#!/bin/bash
# Sets up automated daily PostgreSQL backups for the golfcomp database.
# Run as root on the droplet: bash setup-backups.sh
#
# Backups are written to /opt/golfcomp/backups/ and retained for 7 days.
# To restore: gunzip -c <file>.sql.gz | psql -U golfcomp golfcomp

set -e

BACKUP_DIR=/opt/golfcomp/backups
CRON_FILE=/etc/cron.d/golfcomp-backup

echo "=== Golf Competition App - Backup Setup ==="

# ── Create backup directory ───────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
chown golfcomp:golfcomp "$BACKUP_DIR"
chmod 750 "$BACKUP_DIR"

# ── Install cron job ──────────────────────────────────────────────────────────
cat > "$CRON_FILE" << 'EOF'
# Daily PostgreSQL backup at 02:00, retained for 7 days
0 2 * * * golfcomp pg_dump -U golfcomp golfcomp | gzip > /opt/golfcomp/backups/golfcomp-$(date +\%Y\%m\%d).sql.gz && find /opt/golfcomp/backups -name "*.sql.gz" -mtime +7 -delete
EOF
chmod 644 "$CRON_FILE"

# ── Run an immediate backup to verify it works ────────────────────────────────
echo "Running initial backup to verify..."
sudo -u golfcomp bash -c \
    'pg_dump -U golfcomp golfcomp | gzip > /opt/golfcomp/backups/golfcomp-$(date +%Y%m%d)-initial.sql.gz'

echo ""
echo "=== Backup setup complete ==="
echo ""
echo "Backup location: $BACKUP_DIR"
echo "Schedule:        daily at 02:00, 7-day retention"
echo ""
echo "Files:"
ls -lh "$BACKUP_DIR"
echo ""
echo "To restore a backup:"
echo "  gunzip -c $BACKUP_DIR/<file>.sql.gz | psql -U golfcomp golfcomp"
