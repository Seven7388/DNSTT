import { useEffect, useState } from 'react';
import { Github, Play, CheckCircle, Loader2, AlertCircle, Zap } from 'lucide-react';

const getWorkflowYaml = (highSpeed: boolean) => `name: Build dnstt (UDP Ready)

on:
  workflow_dispatch:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        os: [linux, windows, darwin]
        arch: [amd64, arm64]
    steps:
    - name: Set up Go
      uses: actions/setup-go@v5
      with:
        go-version: '1.21'
        
    - name: Clone dnstt (bamsoftware)
      run: git clone https://www.bamsoftware.com/git/dnstt.git .
      
${highSpeed ? `    - name: Apply High-Speed Modifications
      run: |
        echo "Applying high-speed patches to source code..."
        # 1. Increase KCP window sizes for better throughput over UDP
        find . -name "*.go" -type f -exec sed -i 's/SetWindowSize(128, 128)/SetWindowSize(1024, 1024)/g' {} +
        find . -name "*.go" -type f -exec sed -i 's/SetWindowSize(128, 256)/SetWindowSize(1024, 1024)/g' {} +
        
        # 2. Aggressive NoDelay settings (fastest, least latency)
        find . -name "*.go" -type f -exec sed -i 's/NoDelay(0, 0, 0, 0)/NoDelay(1, 10, 2, 1)/g' {} +
        
        # 3. Increase smux buffer sizes for higher bandwidth
        find . -name "*.go" -type f -exec sed -i 's/MaxReceiveBuffer = 4194304/MaxReceiveBuffer = 16777216/g' {} +
        find . -name "*.go" -type f -exec sed -i 's/MaxStreamBuffer = 65536/MaxStreamBuffer = 1048576/g' {} +
` : ''}
    - name: Build dnstt-client
      env:
        GOOS: \${{ matrix.os }}
        GOARCH: \${{ matrix.arch }}
      run: |
        cd dnstt-client
        go build -trimpath -ldflags="-s -w" -o ../dnstt-client-\${{ matrix.os }}-\${{ matrix.arch }}\${{ matrix.os == 'windows' && '.exe' || '' }}
        
    - name: Build dnstt-server
      env:
        GOOS: \${{ matrix.os }}
        GOARCH: \${{ matrix.arch }}
      run: |
        cd dnstt-server
        go build -trimpath -ldflags="-s -w" -o ../dnstt-server-\${{ matrix.os }}-\${{ matrix.arch }}\${{ matrix.os == 'windows' && '.exe' || '' }}
        
    - name: Upload Artifacts
      uses: actions/upload-artifact@v4
      with:
        name: dnstt-binaries-\${{ matrix.os }}-\${{ matrix.arch }}
        path: |
          dnstt-client-*
          dnstt-server-*
`;

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [repoName, setRepoName] = useState('dnstt-builder');
  const [highSpeed, setHighSpeed] = useState(true);
  const [status, setStatus] = useState<'idle' | 'creating_repo' | 'pushing_workflow' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const accessToken = event.data.token;
        setToken(accessToken);
        
        try {
          const res = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const data = await res.json();
          setUserData(data);
        } catch (err) {
          console.error("Failed to fetch user data", err);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const response = await fetch(`/api/auth/url?redirectUri=${encodeURIComponent(redirectUri)}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  const setupGithubActions = async () => {
    if (!token || !userData) return;
    setStatus('creating_repo');
    setErrorMessage('');
    
    try {
      // 1. Create Repository
      let repoFullName = `${userData.login}/${repoName}`;
      const createRepoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          name: repoName,
          description: 'Automated builder for dnstt (UDP over DNS tunnel) with high-speed modifications',
          private: false,
          auto_init: true
        })
      });

      if (!createRepoRes.ok) {
        const errData = await createRepoRes.json();
        if (errData.errors?.[0]?.message === 'name already exists on this account') {
          console.log("Repo already exists, proceeding to push workflow...");
        } else {
          throw new Error(errData.message || 'Failed to create repository');
        }
      } else {
        const repoData = await createRepoRes.json();
        repoFullName = repoData.full_name;
      }

      setRepoUrl(`https://github.com/${repoFullName}`);
      setStatus('pushing_workflow');

      // 2. Push Workflow File
      const contentEncoded = btoa(getWorkflowYaml(highSpeed));
      const filePath = '.github/workflows/build-dnstt.yml';
      
      let sha = undefined;
      const checkFileRes = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${filePath}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
      });
      if (checkFileRes.ok) {
        const fileData = await checkFileRes.json();
        sha = fileData.sha;
      }

      const pushRes = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Add dnstt build workflow (High Speed: ${highSpeed})`,
          content: contentEncoded,
          sha: sha
        })
      });

      if (!pushRes.ok) {
        const errData = await pushRes.json();
        throw new Error(errData.message || 'Failed to push workflow file');
      }

      setStatus('success');
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'An unexpected error occurred');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-xl w-full">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Github className="w-8 h-8 text-gray-900" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">dnstt Builder</h1>
        <p className="text-gray-500 mb-8 text-center">
          Connect GitHub to automatically create a repository that compiles ready-to-run <code className="bg-gray-100 px-1 rounded">dnstt</code> binaries for UDP.
        </p>
        
        {!token ? (
          <button
            onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            <Github className="w-5 h-5" />
            Connect GitHub
          </button>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 bg-green-50 text-green-800 p-4 rounded-xl border border-green-100">
              <img src={userData?.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
              <div>
                <div className="font-medium">Connected as {userData?.login}</div>
                <div className="text-sm opacity-80">Ready to setup builder</div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repository Name</label>
                <input 
                  type="text" 
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>

              <div 
                className={`border rounded-xl p-4 cursor-pointer transition-colors ${highSpeed ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                onClick={() => setHighSpeed(!highSpeed)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex shrink-0 items-center justify-center w-5 h-5 rounded border ${highSpeed ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                    {highSpeed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <Zap className={`w-4 h-4 ${highSpeed ? 'text-blue-600' : 'text-gray-400'}`} />
                      Apply High-Speed Modifications
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Automatically patches the dnstt source code before building to increase KCP window sizes, disable Nagle's algorithm (NoDelay), and expand smux buffers for maximum UDP throughput.
                    </p>
                  </div>
                </div>
              </div>

              {status === 'idle' || status === 'error' ? (
                <button
                  onClick={setupGithubActions}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Create Repo & Setup Builder
                </button>
              ) : status === 'success' ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Successfully Setup!</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      GitHub Actions is now compiling your customized dnstt binaries.
                    </p>
                  </div>
                  <a 
                    href={`${repoUrl}/actions`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors w-full"
                  >
                    View Build Progress on GitHub
                  </a>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 px-6 py-3 rounded-lg font-medium"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {status === 'creating_repo' ? 'Creating Repository...' : 'Pushing Workflow...'}
                </button>
              )}

              {status === 'error' && (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
