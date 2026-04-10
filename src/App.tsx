import { CheckCircle, Download, Github } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-xl w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Workspace Ready!</h1>
        <p className="text-gray-500 mb-8">
          The high-speed modified <code className="bg-gray-100 px-1 rounded">dnstt</code> source code and GitHub Actions workflow have been successfully generated in this workspace.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-left space-y-4 mb-8">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <Github className="w-5 h-5" />
            Next Steps: Push to GitHub
          </h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-2 text-sm">
            <li>Click the <strong>Settings</strong> icon (gear) in the AI Studio sidebar.</li>
            <li>Select <strong>Export to GitHub</strong>.</li>
            <li>Follow the prompts to create a new repository and push these files.</li>
            <li>Once pushed, GitHub Actions will automatically start compiling your high-speed binaries!</li>
          </ol>
        </div>

        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-100 text-left">
          <h4 className="font-medium text-gray-700 mb-2">What was modified?</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Cloned official bamsoftware/dnstt source</li>
            <li>Increased KCP Window Sizes (128 → 1024)</li>
            <li>Disabled Nagle's Algorithm (NoDelay enabled)</li>
            <li>Expanded smux buffers for higher bandwidth</li>
            <li><strong>Added H-Workers (100x concurrent UDP read/write workers)</strong>: Use the <code className="bg-gray-200 px-1 rounded text-gray-800">-workers 100</code> flag on the server.</li>
            <li><strong>Slipstream Mode (-slipstream)</strong>: A new aggressive mode that doubles window sizes (2048), slashes retransmission intervals (5ms), and expands buffers (128MB) for extreme throughput.</li>
            <li><strong>Persistent Socket Pool (Client)</strong>: Replaced one-shot sockets with a pool of 100 persistent sockets to eliminate syscall overhead.</li>
            <li><strong>Deep Buffer Optimization</strong>: Increased internal queue sizes (4k → 64k) and smux buffers (16MB → 64MB) for extreme bandwidth.</li>
            <li><strong>Low Latency Tuning</strong>: Reduced server response delay (1s → 200ms) for snappier browsing.</li>
            <li><strong>UDP Port Randomization:</strong> Client rotates through the socket pool for every query to bypass UDP association blocking.</li>
            <li><strong>Optional Bind (-bt):</strong> Added <code className="bg-gray-200 px-1 rounded text-gray-800">-bt</code> flag to optionally bind to a specific local port.</li>
            <li>Added automated build workflow (.github/workflows/build.yml)</li>
          </ul>
        </div>

        <div className="text-sm text-gray-500 bg-blue-50 p-4 rounded-lg border border-blue-100 text-left mt-6">
          <h4 className="font-medium text-blue-900 mb-2">🚀 Pro Speed Tips (VPS Kernel Tuning)</h4>
          <p className="text-xs mb-2">Run these on your VPS to handle high-speed UDP:</p>
          <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-[10px] font-mono">
            echo "net.core.default_qdisc=fq" &gt;&gt; /etc/sysctl.conf{"\n"}
            echo "net.ipv4.tcp_congestion_control=bbr" &gt;&gt; /etc/sysctl.conf{"\n"}
            echo "net.core.rmem_max=16777216" &gt;&gt; /etc/sysctl.conf{"\n"}
            echo "net.core.wmem_max=16777216" &gt;&gt; /etc/sysctl.conf{"\n"}
            sysctl -p
          </pre>
        </div>

        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-100 text-left mt-6">
          <h4 className="font-medium text-gray-700 mb-4">How to Run dnstt</h4>
          
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900 mb-1">1. Server Setup</h5>
              <p className="mb-2 text-xs">Generate keys and start the server with Slipstream mode:</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-xs font-mono">
                ./dnstt-server -gen-key -privkey-file server.key -pubkey-file server.pub{"\n"}
                ./dnstt-server -udp :5300 -slipstream -workers 256 -privkey-file server.key t.yourdomain.com 127.0.0.1:8000
              </pre>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-1">2. Client Setup (Slipstream Mode)</h5>
              <p className="mb-2 text-xs">Run the client with Slipstream mode for maximum speed:</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-xs font-mono">
                ./dnstt-client -udp 1.1.1.1:53 -slipstream -pubkey-file server.pub t.yourdomain.com 127.0.0.1:7000
              </pre>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 mb-1">3. Client Setup (Bind to Specific Port)</h5>
              <p className="mb-2 text-xs">If you need to bind to a specific local port, use the optional <code className="bg-gray-200 px-1 rounded text-gray-800">-bt</code> flag:</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-xs font-mono">
                ./dnstt-client -udp 1.1.1.1:53 -bt 0.0.0.0:53000 -pubkey-file server.pub t.yourdomain.com 127.0.0.1:7000
              </pre>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-1">4. SSH Optimization</h5>
              <p className="mb-2 text-xs">Use these flags for faster SSH over the tunnel:</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-xs font-mono">
                ssh -o Ciphers=chacha20-poly1305@openssh.com -o Compression=yes -p 7000 root@127.0.0.1
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
