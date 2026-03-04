import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        show: false, // Don't show until ready to prevent flickering
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Determine if we are running in Dev mode or Production
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        // We are running the Vite Dev Server
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load the built static HTML file
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // When clicking the close (X) button, only hide the window
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

function createTray() {
    // Use a generic built-in icon or a native one if an icon file exists.
    // In a real app, you would require path.join(__dirname, 'icon.png')
    tray = new Tray(nativeImage.createEmpty()); // Using empty image placeholder

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Checkify',
            click: () => {
                mainWindow.show();
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Checkify - Task Manager');
    tray.setContextMenu(contextMenu);

    // Double click tray icon to open the app
    tray.on('double-click', () => {
        mainWindow.show();
    });
}

// Ensure single instance lock so running the app again focuses the existing one
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, focus our window
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            if (!mainWindow.isVisible()) mainWindow.show();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        createWindow();
        createTray();

        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });
}

app.on('window-all-closed', () => {
    // Do nothing. Keep app running in background.
});
