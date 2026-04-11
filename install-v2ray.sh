#!/bin/bash

# High-Speed V2Ray Installer for SlowDNS (dnstt)
# Optimized for high-restriction networks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting High-Speed V2Ray Installation...${NC}"

# 1. Install V2Ray using the official script
echo -e "${GREEN}Downloading and installing V2Ray...${NC}"
INSTALL_SCRIPT_URL="https://raw.githubusercontent.com/v2fly/v2ray-core/master/release/install-release.sh"

# Check if the URL is valid before running
if ! curl -sfL "$INSTALL_SCRIPT_URL" > /tmp/v2ray_install.sh; then
    echo -e "${RED}Error: Could not download V2Ray installation script. Please check your internet connection.${NC}"
    exit 1
fi

bash /tmp/v2ray_install.sh

# 2. Generate a UUID if one doesn't exist
UUID=$(cat /proc/sys/kernel/random/uuid)
echo -e "${GREEN}Generated UUID: ${BLUE}$UUID${NC}"

# 3. Create the optimized VLESS configuration (No Encryption for dnstt)
echo -e "${GREEN}Configuring V2Ray for SlowDNS (Port 10086)...${NC}"
cat <<EOF > /usr/local/etc/v2ray/config.json
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "port": 10086,
      "listen": "127.0.0.1",
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "$UUID"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp"
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "tag": "direct"
    },
    {
      "protocol": "blackhole",
      "tag": "blocked"
    }
  ],
  "routing": {
    "rules": [
      {
        "type": "field",
        "ip": ["geoip:private"],
        "outboundTag": "blocked"
      }
    ]
  }
}
EOF

# 4. Restart V2Ray
echo -e "${GREEN}Restarting V2Ray service...${NC}"
systemctl restart v2ray
systemctl enable v2ray

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}V2Ray Installation Complete!${NC}"
echo -e "${BLUE}Protocol:${NC} VLESS"
echo -e "${BLUE}Port:${NC} 10086 (Listening on 127.0.0.1)"
echo -e "${BLUE}UUID:${NC} $UUID"
echo -e "${BLUE}Encryption:${NC} none"
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Now start your dnstt-server pointing to 127.0.0.1:10086${NC}"
echo -e "${BLUE}Example:${NC} ./dnstt-server -udp :53 -slipstream -workers 256 ... 127.0.0.1:10086"
echo -e "${BLUE}==================================================${NC}"
