# High-Speed dnstt (UDP Ready)

This is a highly optimized, high-speed fork of [bamsoftware's dnstt](https://www.bamsoftware.com/software/dnstt/) (DNS Tunnel). It has been specifically modified to provide maximum throughput and bypass advanced UDP blocking mechanisms.

## 🚀 Key Modifications & Features

1. **H-Workers (100x Concurrency):** Replaced single read/write loops with 100 concurrent goroutine workers for both sending and receiving packets. Channel buffers increased to 1024 to prevent bottlenecking.
2. **UDP Source Port Randomization:** By default, the client now creates a new UDP socket with a random ephemeral port for *every single query*. This effectively bypasses UDP association blocking and stateful UDP firewalls.
3. **Optional Local Bind (`-bt`):** Added a new `-bt` flag to the client to optionally bind to a specific local port if randomization is not desired.
4. **Increased KCP Window Sizes:** Scaled up from `128` to `1024` for significantly better throughput over UDP.
5. **Aggressive NoDelay:** Disabled Nagle's Algorithm (`NoDelay(1, 10, 2, 1)`) for the fastest possible packet delivery and lowest latency.
6. **Expanded smux Buffers:** Increased `MaxReceiveBuffer` to 16MB and `MaxStreamBuffer` to 1MB for higher bandwidth capacity.

---

## 🛠️ How to Build

This repository includes a GitHub Actions workflow (`.github/workflows/build.yml`). 
Whenever you push to the `main` branch, GitHub Actions will automatically compile the client and server binaries for Linux, Windows, and macOS (amd64 & arm64) and attach them as artifacts to the workflow run.

---

## 📖 Usage Instructions

### 1. Generate Keys
dnstt uses end-to-end encryption. You must generate a public/private key pair first.
\`\`\`bash
./dnstt-server -gen-key -privkey-file server.key -pubkey-file server.pub
\`\`\`
*Keep `server.key` secret on your server. Distribute `server.pub` to your clients.*

### 2. Start the Server
Run the server, pointing it to your local proxy/payload service (e.g., `127.0.0.1:8000`).
\`\`\`bash
./dnstt-server -udp :5300 -privkey-file server.key t.yourdomain.com 127.0.0.1:8000
\`\`\`
*Note: You will typically use `iptables` or `socat` to forward port 53 to 5300 so dnstt doesn't need to run as root.*

### 3. Start the Client

**Option A: Randomized Ports (Default & Recommended)**
This will automatically use a new random UDP source port for every query to bypass UDP association blocking.
\`\`\`bash
./dnstt-client -udp 1.1.1.1:53 -pubkey-file server.pub t.yourdomain.com 127.0.0.1:7000
\`\`\`

**Option B: Bind to a Specific Port (Using `-bt`)**
If you need to bind to a specific local port instead of randomizing, use the `-bt` flag.
\`\`\`bash
./dnstt-client -udp 1.1.1.1:53 -bt 0.0.0.0:53000 -pubkey-file server.pub t.yourdomain.com 127.0.0.1:7000
\`\`\`

---

## 🚩 Important Flags Reference

### Server Flags (`dnstt-server`)
*   `-gen-key`: Generate a public/private key pair.
*   `-privkey-file <file>`: Path to the private key file (Required for running the server).
*   `-pubkey-file <file>`: Path to the public key file (Used with `-gen-key`).
*   `-udp <addr>`: Listen for UDP DNS queries on this address (e.g., `:5300`).
*   `-tcp <addr>`: Listen for TCP DNS queries on this address.
*   `-doh <addr>`: Listen for DNS-over-HTTPS queries.
*   `-dot <addr>`: Listen for DNS-over-TLS queries.

### Client Flags (`dnstt-client`)
*   `-pubkey <hex>`: The server's public key as a hex string.
*   `-pubkey-file <file>`: Path to the server's public key file.
*   `-udp <addr>`: Address of the UDP DNS resolver to use (e.g., `1.1.1.1:53` or `8.8.8.8:53`).
*   `-bt <addr>`: **[NEW]** Bind to a specific local address/port (e.g., `0.0.0.0:53000`). If omitted, the client randomizes the source port per query.
*   `-tcp <addr>`: Address of the TCP DNS resolver.
*   `-doh <url>`: URL of the DNS-over-HTTPS resolver.
*   `-dot <addr>`: Address of the DNS-over-TLS resolver.

---

## 💡 Architecture Notes
*   **t.yourdomain.com**: This is your DNS zone. You must configure an NS record for `t.yourdomain.com` pointing to the IP address of the server running `dnstt-server`.
*   **127.0.0.1:8000**: This is the destination your server forwards traffic to (e.g., an SSH daemon, OpenVPN, or a proxy server).
*   **127.0.0.1:7000**: This is the local port the client opens. You connect your local applications (like an SSH client or proxy client) to this port.
