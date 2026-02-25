const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');

// Dynamic import for 'open' since v9+ is ESM, but v8 is CJS. 
// We used ^8.4.2 in package.json so require is fine.
const open = require('open');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Data File Path
const DATA_FILE = path.join(__dirname, 'public', 'blog-data.json');

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Multer Setup for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public', 'assets', 'images');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Use timestamp to avoid name collisions
        const safeName = file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        cb(null, Date.now() + '-' + safeName);
    }
});
const upload = multer({ storage });

// API Routes

// Get all posts
app.get('/api/posts', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data:', err);
            return res.status(500).json({ error: 'Failed to read data' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.json([]);
        }
    });
});

// Save all posts
app.post('/api/posts', (req, res) => {
    const posts = req.body;
    fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), (err) => {
        if (err) {
            console.error('Error saving data:', err);
            return res.status(500).json({ error: 'Failed to save data' });
        }
        res.json({ success: true });
    });
});

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return relative path for the frontend to use
    res.json({ url: `/assets/images/${req.file.filename}` });
});

// Start Server
function startServer(port) {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`Opening Admin Editor...`);

        if (!process.env.ELECTRON) {
            // Try to open in Chrome on Windows specifically
            const url = `http://localhost:${port}/admin`;

            if (process.platform === 'win32') {
                const potentialPaths = [
                    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
                ];

                let chromePath = '';
                console.log('Searching for Chrome...');
                for (const p of potentialPaths) {
                    console.log(`Checking path: ${p}`);
                    if (fs.existsSync(p)) {
                        chromePath = p;
                        console.log(`Found Chrome at: ${chromePath}`);
                        break;
                    }
                }

                if (chromePath) {
                    console.log(`Attempting to launch Chrome via command line...`);
                    // Use 'start' with title "" to handle quotes correctly
                    exec(`start "" "${chromePath}" "${url}"`, (err) => {
                        if (err) {
                            console.error('Failed to launch Chrome executable:', err);
                            console.log('Falling back to default browser...');
                            open(url);
                        } else {
                            console.log('Chrome launch command executed.');
                        }
                    });
                } else {
                    console.log('Chrome not found in standard paths. Trying "start chrome"...');
                    exec(`start chrome "${url}"`, (err) => {
                        if (err) {
                            console.error('Could not command line start chrome:', err.message);
                            console.log('Opening default browser...');
                            open(url);
                        } else {
                            console.log('Start Chrome command executed.');
                        }
                    });
                }
            } else {
                // Non-Windows: Try generic chrome opening or default
                open(url, { app: { name: 'google chrome' } }).catch((err) => {
                    console.error('Non-windows launch failed:', err);
                    open(url);
                });
            }
        } else {
            console.log("Ready for Electron UI.");
        }
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use. Trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

startServer(PORT);
