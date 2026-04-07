import { execSync } from 'child_process';
import fs from 'fs';

try {
  if (!fs.existsSync('dnstt')) {
    console.log('Cloning dnstt repository...');
    execSync('git clone https://www.bamsoftware.com/git/dnstt.git', { stdio: 'inherit' });
    console.log('Successfully cloned dnstt!');
  } else {
    console.log('dnstt directory already exists.');
  }
} catch (error) {
  console.error('Failed to clone repository:', error);
}
