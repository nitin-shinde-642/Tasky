export interface IWindowControls {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  pin: (alwaysOnTop: boolean) => void;
}

export interface IStore {
  get: (key: string) => Promise<unknown>;
  set: (key: string, val: unknown) => void;
}

export interface IFsAPI {
  getBaseDir: () => Promise<string>;
  setBaseDir: (newDir: string) => Promise<boolean>;
  listFolders: () => Promise<string[]>;
  createFolder: (folderName: string) => Promise<{ success: boolean; error?: string }>;
  showOpenDialog: () => Promise<string | null>;
  readArchive: (folder: string, dateString: string) => Promise<{ success: boolean; content?: string | null; type?: 'json' | 'markdown' | 'text'; error?: string }>;
  listArchiveDates: (folder: string) => Promise<string[]>;
  deleteFolder: (folderName: string, targetFolder?: string) => Promise<{ success: boolean; error?: string }>;
  exportData: () => Promise<{ success: boolean; canceled?: boolean; error?: string }>;
  importData: () => Promise<{ success: boolean; canceled?: boolean; error?: string }>;
  archiveDay: (dateString: string) => Promise<{ success: boolean; stats?: { archived: number; pending: number }; error?: string }>;
}

export interface ISystemAPI {
  getAppVersion: () => Promise<string>;
  getAutoStart: () => Promise<boolean>;
  setAutoStart: (enable: boolean) => void;
  setWindowOpacity: (opacity: number) => void;
  openExternal: (url: string) => void;
  onUpdateAvailable: (callback: () => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  checkForUpdates: () => Promise<any>;
  restartAndInstall: () => void;
}

declare global {
  interface Window {
    windowControls: IWindowControls;
    store: IStore;
    fsAPI: IFsAPI;
    systemAPI: ISystemAPI;
  }
}
