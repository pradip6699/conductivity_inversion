// public/electron.js
const path = require('path');
const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev'); // Detects development mode

function createWindow() {
  // Create the main browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Allows renderer process to use Node.js APIs (use with caution)
      contextIsolation: false, // Consider security implications, preload scripts are safer
      // preload: path.join(__dirname, 'preload.js') // Recommended for security
    },
  });

  // Determine the URL to load
  const startUrl = isDev
    ? 'http://localhost:3000' // Your React dev server
    : `file://${path.join(__dirname, '../build/index.html')}`; // Your built React app

  win.loadURL(startUrl);

  // Open DevTools automatically if in development
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Re-create window on macOS dock click if no windows exist
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});