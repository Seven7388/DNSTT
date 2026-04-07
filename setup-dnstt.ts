import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log("Cloning dnstt from bamsoftware...");
try {
  execSync('git clone https://www.bamsoftware.com/git/dnstt.git', { stdio: 'inherit' });
} catch (e) {
  console.error("Failed to clone, it might already exist.");
}

console.log("Removing .git folder to allow committing to your own repo...");
fs.rmSync('dnstt/.git', { recursive: true, force: true });

console.log("Applying high-speed patches...");

function patchFile(filePath: string, patches: {search: string|RegExp, replace: string}[]) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    for (const p of patches) {
        const newContent = content.replace(p.search, p.replace);
        if (newContent !== content) {
            content = newContent;
            modified = true;
        }
    }
    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`Patched ${filePath}`);
    }
}

function walk(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.go')) {
            patchFile(fullPath, [
                { search: /SetWindowSize\(128, 128\)/g, replace: 'SetWindowSize(1024, 1024)' },
                { search: /SetWindowSize\(128, 256\)/g, replace: 'SetWindowSize(1024, 1024)' },
                { search: /NoDelay\(0, 0, 0, 0\)/g, replace: 'NoDelay(1, 10, 2, 1)' },
                { search: /MaxReceiveBuffer\s*=\s*4194304/g, replace: 'MaxReceiveBuffer = 16777216' },
                { search: /MaxStreamBuffer\s*=\s*65536/g, replace: 'MaxStreamBuffer = 1048576' }
            ]);
        }
    }
}

walk('dnstt');
console.log("High-speed modifications applied successfully!");
