const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        resizable: true,
        title: "Volume Blog Studio",
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('desktop.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Start Server
ipcMain.on('start-server', (event) => {
    if (serverProcess) {
        event.reply('log', 'Server is already running!');
        return;
    }

    event.reply('log', 'Starting Local Editor Server...');
    serverProcess = spawn('node', ['server.js'], {
        cwd: __dirname,
        env: { ...process.env, ELECTRON: '1' }
    });

    serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        event.reply('log', output);

        if (output.includes('Server running at http://localhost:')) {
            const match = output.match(/http:\/\/localhost:\d+/);
            if (match && mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('server-ready', match[0] + '/admin');
            }
        }
    });

    serverProcess.stderr.on('data', (data) => {
        event.reply('log', '[Error] ' + data.toString());
    });

    serverProcess.on('close', (code) => {
        event.reply('log', `Server shut down with code ${code}`);
        serverProcess = null;
    });
});

// Upload to GitHub / Vercel
ipcMain.on('publish', (event) => {
    event.reply('log', 'Starting GitHub synchronization...');

    // Try to find Git executable gracefully
    let gitCmd = 'git';
    const mingitPath = path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'scratch', 'mingit', 'cmd', 'git.exe');

    if (fs.existsSync(mingitPath)) {
        gitCmd = `"${mingitPath}"`;
    }

    const commands = [
        `${gitCmd} fetch origin main`,
        `${gitCmd} reset --mixed FETCH_HEAD`,
        `${gitCmd} add .`,
        `${gitCmd} commit -m "Blog update: ${new Date().toLocaleString()}"`,
        `${gitCmd} push origin main`
    ];

    let currentStep = 0;

    function runNext() {
        if (currentStep >= commands.length) {
            event.reply('log', '✅ Successfully published to Vercel!');
            return;
        }

        const cmd = commands[currentStep];
        event.reply('log', `> ${cmd}`);

        const child = spawn(cmd, { cwd: __dirname, shell: true });
        let stdoutData = '';

        child.stdout.on('data', (data) => {
            const text = data.toString();
            stdoutData += text;
            event.reply('log', text);
        });

        child.stderr.on('data', (data) => {
            // Git progress goes to stderr
            event.reply('log', data.toString());
        });

        child.on('close', (code) => {
            if (code !== 0 && currentStep === 3 && stdoutData.includes('nothing to commit')) {
                // It's fine if there are no new changes
                event.reply('log', 'No new changes to commit.');
                currentStep++; // Skip push as well
                runNext();
                return;
            }

            if (code !== 0 && currentStep !== 1) { // reset throws error if diverging but still resets
                event.reply('log', `❌ Error on step: ${cmd}\nExit code: ${code}`);
                return;
            }

            currentStep++;
            runNext();
        });
    }

    runNext();
});
