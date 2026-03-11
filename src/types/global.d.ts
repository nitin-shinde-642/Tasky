export interface IWindowControls {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  pin: (alwaysOnTop: boolean) => void;
}

export interface IStore {
  get: (key: string) => Promise<any>;
  set: (key: string, val: any) => void;
}

export interface IFsAPI {
  getBaseDir: () => Promise<string>;
  setBaseDir: (newDir: string) => Promise<boolean>;
  listFolders: () => Promise<string[]>;
  createFolder: (folderName: string) => Promise<{ success: boolean; error?: string }>;
  showOpenDialog: () => Promise<string | null>;
  archiveDay: (dateString: string) => Promise<{ success: boolean; stats?: { archived: number; pending: number }; error?: string }>;
  readArchive: (folder: string, dateString: string) => Promise<{ success: boolean; content?: string | null; error?: string }>;
  deleteFolder: (folderName: string, targetFolder?: string) => Promise<{ success: boolean; error?: string }>;
  exportData: () => Promise<{ success: boolean; canceled?: boolean; error?: string }>;
  importData: () => Promise<{ success: boolean; canceled?: boolean; error?: string }>;
}

export interface ISystemAPI {
  getAutoStart: () => Promise<boolean>;
  setAutoStart: (enable: boolean) => void;
  setWindowOpacity: (opacity: number) => void;
  openExternal: (url: string) => void;
}

declare global {
  interface Window {
    windowControls: IWindowControls;
    store: IStore;
    fsAPI: IFsAPI;
    systemAPI: ISystemAPI;
  }
}
