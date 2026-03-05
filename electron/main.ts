import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 550,
    height: 700,
    minWidth: 400,
    minHeight: 500,
    frame: false, // Frameless window
    titleBarStyle: 'hidden',
    transparent: true,
    backgroundMaterial: 'acrylic',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Window control IPC handlers
  ipcMain.on('window-minimize', () => win?.minimize())
  ipcMain.on('window-maximize', () => {
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })
  ipcMain.on('window-close', () => win?.close())
  ipcMain.on('window-pin', (event, alwaysOnTop) => win?.setAlwaysOnTop(alwaysOnTop))

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      win?.hide()
    }
    return false
  })
}

let isQuitting = false
let tray: Tray | null = null

import fs from 'node:fs';

// Initialize store and IPC
import Store from 'electron-store';
const store = new Store();

ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

ipcMain.on('store-set', (event, key, val) => {
  store.set(key, val);
});

// Phase 2: Folder Filesystem operations
const DEFAULT_BASE_DIR = path.join(app.getPath('documents'), 'TaskLyn');

ipcMain.handle('get-base-dir', () => {
  const customDir = store.get('base-dir') as string | undefined;
  const baseDir = customDir || DEFAULT_BASE_DIR;
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return baseDir;
});

ipcMain.handle('set-base-dir', (event, newDir: string) => {
  const currentDir = store.get('base-dir') as string | undefined || DEFAULT_BASE_DIR;
  if (currentDir === newDir) return true;
  
  try {
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }
    if (fs.existsSync(currentDir)) {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          const srcPath = path.join(currentDir, item.name);
          const destPath = path.join(newDir, item.name);
          if (!fs.existsSync(destPath)) {
            fs.cpSync(srcPath, destPath, { recursive: true });
          }
        }
      }
    }
    store.set('base-dir', newDir);
    return true;
  } catch (e) {
    console.error("Failed to migrate base dir", e);
    return false;
  }
});

ipcMain.handle('list-folders', () => {
  const baseDir = store.get('base-dir') as string | undefined || DEFAULT_BASE_DIR;
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    return [];
  }
  const items = fs.readdirSync(baseDir, { withFileTypes: true });
  return items.filter(item => item.isDirectory()).map(item => item.name);
});

ipcMain.handle('create-folder', (event, folderName: string) => {
  const baseDir = store.get('base-dir') as string | undefined || DEFAULT_BASE_DIR;
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  // Validate folder name against illegal Windows characters
  const illegalChars = /[<>:"/\\|?*\x00-\x1F]/;
  const cleanName = folderName.trim();
  if (!cleanName || illegalChars.test(cleanName)) {
    return { success: false, error: 'Invalid folder name' };
  }

  const targetPath = path.join(baseDir, cleanName);
  if (fs.existsSync(targetPath)) {
    return { success: false, error: 'Folder already exists' };
  }
  try {
    fs.mkdirSync(targetPath);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('show-open-dialog', async () => {
  if (!win) return null;
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: 'Select TaskLyn Base Directory'
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// Phase 3: Archival Engine
ipcMain.handle('archive-day', async (event, dateString: string) => {
  // dateString like "2026-03-04"
  const baseDir = store.get('base-dir') as string | undefined || DEFAULT_BASE_DIR;
  if (!fs.existsSync(baseDir)) return { success: false, error: 'Base directory missing' };
  
  let totalArchived = 0;
  let totalPending = 0;
  
  try {
    const folders = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(item => item.isDirectory())
      .map(item => item.name);
      
    for (const folder of folders) {
      const storageKey = `tasklyn_${folder}_tasks`;
      const tasks = store.get(storageKey) as Array<any>;
      if (!tasks || tasks.length === 0) continue;
      
      const pending = tasks.filter(t => !t.completed);
      const completed = tasks.filter(t => t.completed);
      
      totalArchived += completed.length;
      totalPending += pending.length;
      
      if (completed.length > 0) {
        // Format text file content
        let content = `TaskLyn Archive - ${dateString}\nFolder: ${folder}\n\n`;
        content += `=== COMPLETED TASKS (${completed.length}) ===\n`;
        completed.forEach(t => content += `[X] ${t.title}${t.description ? `\n    ${t.description}` : ''}\n`);
        content += `\n=== PENDING TASKS CARRIED OVER (${pending.length}) ===\n`;
        pending.forEach(t => content += `[ ] ${t.title}${t.description ? `\n    ${t.description}` : ''}\n`);
        
        // Write to fs
        const targetFile = path.join(baseDir, folder, `${dateString}.txt`);
        fs.writeFileSync(targetFile, content, 'utf8');
        
        // Remove completed from store
        store.set(storageKey, pending);
      }
    }
    return { success: true, stats: { archived: totalArchived, pending: totalPending } };
  } catch (e: any) {
    console.error("Archival failed", e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('read-archive', async (event, folder: string, dateString: string) => {
  const baseDir = store.get('base-dir') as string | undefined || DEFAULT_BASE_DIR;
  const targetFile = path.join(baseDir, folder, `${dateString}.txt`);
  if (!fs.existsSync(targetFile)) {
    return { success: false, content: null };
  }
  try {
    const content = fs.readFileSync(targetFile, 'utf8');
    return { success: true, content };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});

// Auto-Start integration
ipcMain.handle('get-auto-start', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.on('set-auto-start', (event, enable: boolean) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
    openAsHidden: enable
  });
});

// Appearance Integration
ipcMain.on('set-window-opacity', (event, opacity: number) => {
  if (win) {
    win.setOpacity(opacity);
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()

  // Setup System Tray
  const iconPath = path.join(process.env.VITE_PUBLIC || '', 'vite.svg');
  tray = new Tray(nativeImage.createFromPath(iconPath));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open TaskLyn', click: () => win?.show() },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('TaskLyn');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => win?.show());
})
