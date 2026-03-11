import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  pin: (alwaysOnTop: boolean) => ipcRenderer.send('window-pin', alwaysOnTop),
})

contextBridge.exposeInMainWorld('store', {
  get: (key: string) => ipcRenderer.invoke('store-get', key),
  set: (key: string, val: any) => ipcRenderer.send('store-set', key, val),
})

contextBridge.exposeInMainWorld('fsAPI', {
  getBaseDir: () => ipcRenderer.invoke('get-base-dir'),
  setBaseDir: (newDir: string) => ipcRenderer.invoke('set-base-dir', newDir),
  listFolders: () => ipcRenderer.invoke('list-folders'),
  createFolder: (folderName: string) => ipcRenderer.invoke('create-folder', folderName),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  archiveDay: (dateString: string) => ipcRenderer.invoke('archive-day', dateString),
  readArchive: (folder: string, dateString: string) => ipcRenderer.invoke('read-archive', folder, dateString),
  deleteFolder: (folderName: string, targetFolder?: string) => ipcRenderer.invoke('delete-folder', folderName, targetFolder),
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data')
})

contextBridge.exposeInMainWorld('systemAPI', {
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  setAutoStart: (enable: boolean) => ipcRenderer.send('set-auto-start', enable),
  setWindowOpacity: (opacity: number) => ipcRenderer.send('set-window-opacity', opacity)
})
