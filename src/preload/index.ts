import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type { User, SolaLinkData } from "../types/setup";

export interface IpcApi {
  // --- Credentials ---
  saveCredentials: (user: User) => Promise<void>;
  loadCredentials: () => Promise<User | null>;
  // --- Browser Operations ---
  sclassOpen: () => Promise<void>;
  solaOpen: () => Promise<void>;
  persistentClose: () => Promise<void>;
  eucRegister: (eucCode: string) => Promise<string>;
  createSolaLinkData: () => Promise<SolaLinkData>;
  onBrowserStatusChange: (callback: (status: { isOpen: boolean }) => void) => () => void;
  // --- Network Monitoring ---
  startNetworkMonitoring: () => void;
  stopNetworkMonitoring: () => void;
  onNetworkStatusChange: (callback: (status: boolean) => void) => () => void;
  // --- Logging ---
  onLogAdd: (callback: (log: string) => void) => () => void;
}

const api: IpcApi = {
  // Credentials
  saveCredentials: (user: User) => ipcRenderer.invoke("credentials:save", user),
  loadCredentials: () => ipcRenderer.invoke("credentials:load"),

  // Browser Operations
  sclassOpen: () => ipcRenderer.invoke("browser:sclass-open"),
  solaOpen: () => ipcRenderer.invoke("browser:sola-open"),
  persistentClose: () => ipcRenderer.invoke("browser:persistent-close"),
  eucRegister: (eucCode: string) => ipcRenderer.invoke("browser:euc-register", eucCode),
  createSolaLinkData: () => ipcRenderer.invoke("browser:create-sola-link-data"),
  onBrowserStatusChange: (callback) => {
    const listener = (_: IpcRendererEvent, status: { isOpen: boolean }) => callback(status);
    ipcRenderer.on("browser:status-change", listener);
    return () => ipcRenderer.removeListener("browser:status-change", listener);
  },

  // Network Monitoring
  startNetworkMonitoring: () => ipcRenderer.send("network:start-monitoring"),
  stopNetworkMonitoring: () => ipcRenderer.send("network:stop-monitoring"),
  onNetworkStatusChange: (callback) => {
    const listener = (_: IpcRendererEvent, status: boolean) => callback(status);
    ipcRenderer.on("network:status-change", listener);
    return () => {
      ipcRenderer.removeListener("network:status-change", listener);
    };
  },

  // Logging
  onLogAdd: (callback) => {
    const listener = (_: IpcRendererEvent, log: string) => callback(log);
    ipcRenderer.on("log:add", listener);
    return () => {
      ipcRenderer.removeListener("log:add", listener);
    };
  },
};

try {
  contextBridge.exposeInMainWorld("ipc", api);
} catch (error) {
  console.error("Failed to expose API to renderer:", error);
}
