const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const platform = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const binaryPath = path.join(__dirname, platform);

function searchYouTube(keyword, limit = 5) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(binaryPath)) {
      return reject(new Error('yt-dlp binary not found.'));
    }

    const args = [
      `ytsearch${limit}:${keyword}`,
      '--dump-json',
      '--no-playlist',
      '--no-warnings'
    ];

    const child = spawn(binaryPath, args);
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      // Ignored warnings
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          // yt-dlp outputs one JSON object per line
          const results = output.trim().split('\n').filter(Boolean).map(line => {
             try { return JSON.parse(line); } catch (e) { return null; }
          }).filter(Boolean);
          resolve(results);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`yt-dlp search failed with code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(new Error(`Failed to start yt-dlp: ${err.message}`));
    });
  });
}

module.exports = { searchYouTube };
