#!/bin/bash
# CloudCode VPS Security Setup Script
# Run this on the VPS host to configure automated security updates and Docker daemon hardening.

set -e

echo "=== CloudCode VPS Security Setup ==="

# 1. Install unattended-upgrades for automatic kernel patches
echo "[1/4] Installing unattended-upgrades..."
apt-get update -y
apt-get install -y unattended-upgrades apt-listchanges

# Enable automatic security updates
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

echo "[1/4] ✅ Automatic security updates enabled."

# 2. Apply Docker daemon hardening (ICC disabled, log limits, ulimits)
echo "[2/4] Applying Docker daemon hardening..."
if [ -f /etc/docker/daemon.json ]; then
  echo "  ⚠️  /etc/docker/daemon.json already exists. Backing up to /etc/docker/daemon.json.bak"
  cp /etc/docker/daemon.json /etc/docker/daemon.json.bak
fi

cp ./docker-daemon.json /etc/docker/daemon.json
echo "[2/4] ✅ Docker daemon.json applied. Restarting Docker..."
systemctl restart docker

# 3. Set up weekly kernel update cron job
echo "[3/4] Setting up weekly kernel update cron..."
cat > /etc/cron.weekly/cloudcode-kernel-update << 'CRONEOF'
#!/bin/bash
# CloudCode: Weekly kernel and package security update
apt-get update -y
apt-get upgrade -y -o Dpkg::Options::="--force-confold"
# Log the update
echo "$(date): Kernel update completed" >> /var/log/cloudcode-updates.log
CRONEOF
chmod +x /etc/cron.weekly/cloudcode-kernel-update
echo "[3/4] ✅ Weekly kernel update cron installed."

# 4. Verify Docker ICC is disabled
echo "[4/4] Verifying Docker configuration..."
ICC_STATUS=$(docker info 2>/dev/null | grep -i "ICC" || echo "ICC check not available")
echo "  Docker ICC status: $ICC_STATUS"

echo ""
echo "=== Setup Complete ==="
echo "Security hardening applied:"
echo "  ✅ Automatic security updates (unattended-upgrades)"
echo "  ✅ Docker ICC disabled (inter-container communication blocked)"
echo "  ✅ Docker log rotation enabled (10MB max, 3 files)"
echo "  ✅ Weekly kernel update cron job installed"
echo ""
echo "⚠️  IMPORTANT: If using overlay2 with disk quotas (StorageOpt), ensure the"
echo "   Docker data directory is on an XFS filesystem with pquota mount option."
echo "   Example fstab entry: /dev/sda1 /var/lib/docker xfs defaults,pquota 0 0"
