const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const WATCH_DIR = path.resolve(__dirname, '../'); // Watch the project root
const DEBOUNCE_MS = 10000; // Wait 10 seconds after last change before syncing
const IGNORE_DIRS = ['.git', 'node_modules', '.next', 'out', 'build', 'coverage'];

console.log(`[Auto-Sync] Watching files in ${WATCH_DIR}...`);
console.log(`[Auto-Sync] Changes will be pushed every ${DEBOUNCE_MS / 1000} seconds of inactivity.`);

let timeout = null;
let isSyncing = false;

function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const process = spawn(command, args, { stdio: 'pipe', cwd: WATCH_DIR }); // pipe to suppress noisy output unless error

        // You can enable inherit if you want to see all git output
        // process.stdout.pipe(process.stdout);
        // process.stderr.pipe(process.stderr);

        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                // git commit returns 1 if nothing to changes, which is fine
                if (command === 'git' && args.includes('commit')) {
                    resolve();
                } else {
                    resolve(); // Resolve anyway to keep potential loop alive, but verify manually if needed
                }
            }
        });

        process.on('error', (err) => {
            console.error(`Failed to start ${command}:`, err);
            resolve(); // Don't crash the watcher
        });
    });
}

async function sync() {
    if (isSyncing) return;
    isSyncing = true;

    process.stdout.write('[Auto-Sync] Syncing... ');

    try {
        // 1. Add all changes
        await runCommand('git', ['add', '.']);

        // 2. Commit
        const date = new Date().toLocaleString();
        await runCommand('git', ['commit', '-m', `Auto-sync: ${date}`]);

        // 3. Push
        await runCommand('git', ['push']);

        console.log('Done.');
    } catch (error) {
        console.error('Error during sync:', error);
    } finally {
        isSyncing = false;
    }
}

// Watcher
try {
    fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        // Ignore specific directories/files
        const parts = filename.split(path.sep);
        if (parts.some(p => IGNORE_DIRS.includes(p))) return;

        // console.log(`Change detected: ${filename}`); // Optional: debug log

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(sync, DEBOUNCE_MS);
    });
} catch (e) {
    console.error("Failed to start watcher:", e);
}
