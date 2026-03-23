import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { format } from 'date-fns'

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

// Environmental Separation: Use separate data folders for development
if (!app.isPackaged) {
  const devDataPath = path.join(app.getPath('appData'), 'TaskLyn-Dev');
  app.setPath('userData', devDataPath);
}

const DEFAULT_BASE_DIR = app.isPackaged 
  ? path.join(app.getPath('documents'), 'TaskLyn')
  : path.join(app.getPath('documents'), 'TaskLyn-Dev');

let win: BrowserWindow | null

interface ArchivedTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: number;
  completedAt: number | null;
}

function createWindow() {
  const isHidden = process.argv.includes('--hidden');

  win = new BrowserWindow({ 
    width: 550,
    height: 700,
    minWidth: 400,
    minHeight: 500,
    frame: false, // Frameless window
    titleBarStyle: 'hidden',
    show: !isHidden,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
  })

  if (!isHidden) {
    win.once('ready-to-show', () => {
      win?.show();
    });
  }

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

  // Open links in external OS browser unconditionally
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
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

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-for-updates', async () => {
  console.log('Manual update check requested...');
  if (!app.isPackaged) {
    console.log('Update check skipped: App is not packaged.');
    return { error: 'Update checks only work in the installed production app.' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (err) {
    console.error('AutoUpdater check failed:', err);
    return { error: (err as Error).message };
  }
});

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.on('restart-and-update', () => {
  autoUpdater.quitAndInstall();
});

// Phase 2: Folder Filesystem operations

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
  const baseDir = (store.get('base-dir') as string | undefined) || DEFAULT_BASE_DIR;
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  let folders = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(item => item.isDirectory())
    .map(item => item.name);

  // Ensure at least one folder exists for first run
  if (folders.length === 0) {
    const defaultFolderPath = path.join(baseDir, 'Default');
    if (!fs.existsSync(defaultFolderPath)) {
      fs.mkdirSync(defaultFolderPath);
      folders = ['Default'];
    }
  }
  
  return folders;
});

ipcMain.handle('create-folder', (event, folderName: string) => {
  const baseDir = store.get('base-dir') as string | undefined || DEFAULT_BASE_DIR;
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  // Validate folder name
  const cleanName = folderName.trim();
  if (!cleanName) {
    return { success: false, error: 'Folder name cannot be empty' };
  }
  
  // Illegal Windows characters: < > : " / \ | ? * and control chars (0-31)
  // eslint-disable-next-line no-control-regex
  const illegalChars = /[<>:"/\\|?*\u0000-\u001F]/;
  if (illegalChars.test(cleanName)) {
    return { success: false, error: 'Folder name contains invalid characters' };
  }

  const targetPath = path.join(baseDir, cleanName);
  if (fs.existsSync(targetPath)) {
    return { success: false, error: 'Folder already exists' };
  }
  try {
    fs.mkdirSync(targetPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
});

ipcMain.handle('delete-folder', (event, folderName: string, targetFolder?: string) => {
  const baseDir = store.get('base-dir') as string | undefined || DEFAULT_BASE_DIR;
  const sourcePath = path.join(baseDir, folderName);
  
  if (!fs.existsSync(sourcePath)) {
    return { success: false, error: 'Folder not found' };
  }

  try {
    const sourceStorageKey = `tasklyn_${folderName}_tasks`;
    const sourceTasks = (store.get(sourceStorageKey) as ArchivedTask[]) || [];

    if (targetFolder) {
      // User opted to move tasks to another folder
      const targetStorageKey = `tasklyn_${targetFolder}_tasks`;
      const targetTasks = (store.get(targetStorageKey) as ArchivedTask[]) || [];
      store.set(targetStorageKey, [...targetTasks, ...sourceTasks]);
    }
    
    // Clear the source tasks from the store
    store.delete(sourceStorageKey);
    
    // Attempt physical deletion
    fs.rmSync(sourcePath, { recursive: true, force: true });
    
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
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

ipcMain.handle('export-data', async () => {
  if (!win) return { success: false, error: 'Window not initialized' };
  try {
    const result = await dialog.showSaveDialog(win, {
      title: 'Export TaskLyn Data',
      defaultPath: 'tasklyn-backup.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    
    if (result.canceled || !result.filePath) return { success: false, canceled: true };
    
    // Get all data from store
    const allData = store.store;
    fs.writeFileSync(result.filePath, JSON.stringify(allData, null, 2), 'utf-8');
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
});

ipcMain.handle('import-data', async () => {
  if (!win) return { success: false, error: 'Window not initialized' };
  try {
    const result = await dialog.showOpenDialog(win, {
      title: 'Import TaskLyn Data',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    });
    
    if (result.canceled || result.filePaths.length === 0) return { success: false, canceled: true };
    
    const fileContent = fs.readFileSync(result.filePaths[0], 'utf-8');
    const parsedData = JSON.parse(fileContent);
    
    if (typeof parsedData !== 'object' || parsedData === null) {
      throw new Error('Invalid backup format');
    }
    
    // Overwrite the store
    Object.keys(parsedData).forEach(key => {
      store.set(key, parsedData[key]);
    });
    
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
});

// Phase 3: Archival Engine
ipcMain.handle('archive-day', async (event, dateString: string) => {
  // dateString like "2026-03-04"
  const baseDir = store.get('base-dir') as string | undefined || DEFAULT_BASE_DIR;
  if (!fs.existsSync(baseDir)) return { success: false, error: 'Base directory missing' };
  
  // Robust date parsing (Timezone-agnostic)
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const year = y.toString();
  const month = format(date, 'MMMM');
  const day = d < 10 ? `0${d}` : d.toString();
  
  let totalArchived = 0;
  let totalPending = 0;
  
  try {
    const folders = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(item => item.isDirectory())
      .map(item => item.name);
      
    for (const folder of folders) {
      const storageKey = `tasklyn_${folder}_tasks`;
      const tasks = store.get(storageKey) as ArchivedTask[];
      if (!tasks || tasks.length === 0) continue;
      
      const pending = tasks.filter(t => !t.completed);
      const completed = tasks.filter(t => t.completed);
      
      totalArchived += completed.length;
      totalPending += pending.length;
      
      // Ensure target directory exists: Folder/YYYY/Month/
      const archiveDir = path.join(baseDir, folder, year, month);
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      // 1. Save Markdown Log
      let mdContent = `# TaskLyn Archive - ${format(date, 'EEEE, MMMM do, yyyy')}\n`;
      mdContent += `**Folder:** ${folder}\n\n`;
      
      mdContent += `## Completed Tasks (${completed.length})\n`;
      if (completed.length > 0) {
        completed.forEach(t => {
          mdContent += `- [x] **${t.title}**\n`;
          if (t.description) {
            // Indent description properly
            const indented = t.description.split('\n').map((line: string) => `  ${line}`).join('\n');
            mdContent += `${indented}\n`;
          }
        });
      } else {
        mdContent += `*No tasks completed today.*\n`;
      }
      
      mdContent += `\n## Carried Forward (${pending.length})\n`;
      if (pending.length > 0) {
        pending.forEach(t => {
          mdContent += `- [ ] **${t.title}**\n`;
          if (t.description) {
            const indented = t.description.split('\n').map((line: string) => `  ${line}`).join('\n');
            mdContent += `${indented}\n`;
          }
        });
      } else {
        mdContent += `*No pending tasks.*\n`;
      }
      
      const mdPath = path.join(archiveDir, `${day}.md`);
      fs.writeFileSync(mdPath, mdContent, 'utf8');

      // 2. Save JSON Companion (for rich UI)
      const jsonPath = path.join(archiveDir, `${day}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify({
        date: dateString,
        folder,
        stats: { completed: completed.length, pending: pending.length },
        tasks: tasks // full list for history view
      }, null, 2), 'utf8');
      
      // 3. Update Store: Remove completed from store, KEEP pending
      store.set(storageKey, pending);
    }
    return { success: true, stats: { archived: totalArchived, pending: totalPending } };
  } catch (e) {
    console.error("Archival failed", e);
    return { success: false, error: (e as Error).message };
  }
});

ipcMain.handle('read-archive', async (event, folder: string, dateString: string) => {
  const baseDir = store.get('base-dir') as string | undefined || DEFAULT_BASE_DIR;
  
  // Robust date parsing (Timezone-agnostic)
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const year = y.toString();
  const month = format(date, 'MMMM');
  const day = d < 10 ? `0${d}` : d.toString();
  
  const archiveDir = path.join(baseDir, folder, year, month);
  const jsonPath = path.join(archiveDir, `${day}.json`);
  const mdPath = path.join(archiveDir, `${day}.md`);
 
  try {
    // Try JSON first for rich UI
    if (fs.existsSync(jsonPath)) {
      const content = fs.readFileSync(jsonPath, 'utf8');
      return { success: true, type: 'json', content };
    }
    
    // Fallback to Markdown
    if (fs.existsSync(mdPath)) {
      const content = fs.readFileSync(mdPath, 'utf8');
      return { success: true, type: 'markdown', content };
    }

    // Legacy fallback (DD.txt in root folder)
    const legacyPath = path.join(baseDir, folder, `${dateString}.txt`);
    if (fs.existsSync(legacyPath)) {
      const content = fs.readFileSync(legacyPath, 'utf8');
      return { success: true, type: 'text', content };
    }

    return { success: false, content: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
});

ipcMain.handle('list-archive-dates', async (event, folder: string) => {
  const baseDir = store.get('base-dir') as string | undefined || DEFAULT_BASE_DIR;
  const folderPath = path.join(baseDir, folder);
  if (!fs.existsSync(folderPath)) return [];

  const dates: string[] = [];
  
  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanDir(fullPath);
      } else if (item.name.endsWith('.json')) {
        try {
          // Attempt to extract date from JSON if filename is just DD.json
          // But actually, we need the full YYYY-MM-DD.
          // Let's try to parse the JSON for the date field we saved
          const content = fs.readFileSync(fullPath, 'utf8');
          const data = JSON.parse(content);
          if (data.date) {
            dates.push(data.date);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  };

  scanDir(folderPath);
  return dates;
});

// Auto-Start integration
ipcMain.handle('get-auto-start', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.on('set-auto-start', (event, enable: boolean) => {
  // Only modify registry/auto-start settings in a packaged (production) build
  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: app.getPath('exe'),
      args: ['--hidden']
    });
  }
});

// Appearance Integration
// Window opacity and acrylic settings were removed by request.

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
  // First launch auto-start setup (Production only)
  const autoStartSetup = store.get('auto-start-initialized') as boolean | undefined;
  if (autoStartSetup === undefined && app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe'),
      args: ['--hidden']
    });
    store.set('auto-start-initialized', true);
  }

  createWindow()

  // Setup System Tray
  const iconPath = path.join(process.env.VITE_PUBLIC || '', 'icon.png');
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
  tray.on('click', () => {
    if (!win) return;
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });

  // OTA Updates Check (Production only)
  if (app.isPackaged) {
    // Check for updates silently in the background
    autoUpdater.checkForUpdatesAndNotify();
  }
})

// autoUpdater Listeners
autoUpdater.on('update-available', () => {
  console.log('Update available. Downloading...');
  win?.webContents.send('update-available');
});

autoUpdater.on('download-progress', (progressObj) => {
  win?.webContents.send('update-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded; forcing install and restarting...');
  win?.webContents.send('update-downloaded');
  
  // Force the application to restart and install instantly
  setTimeout(() => {
    autoUpdater.quitAndInstall(true, true);
  }, 2000); // 2 second delay to show the "Success" toast on frontend
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater: ', err);
});
