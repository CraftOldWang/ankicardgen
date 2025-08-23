import { contextBridge, ipcRenderer } from "electron";
import electron from "vite-plugin-electron";

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld("electronAPI", {
    // 文件操作
    openFile: () => ipcRenderer.invoke("dialog:openFile"),
    saveFile: (defaultPath: string) =>
        ipcRenderer.invoke("dialog:saveFile", defaultPath),
    readFile: (filePath: string) => ipcRenderer.invoke("file:read", filePath),
    writeFile: (filePath: string, content: string) =>
        ipcRenderer.invoke("file:write", filePath, content),
});

contextBridge.exposeInMainWorld("versions", {
    chrome: () => process.versions.chrome,
    node: () => process.versions.node,
    electron: () => process.versions.electron,
});

// 声明全局类型，使TypeScript能够识别window.electronAPI
declare global {
    interface Window {
        electronAPI: {
            openFile: () => Promise<{ canceled: boolean; filePath?: string }>;
            saveFile: (
                defaultPath: string
            ) => Promise<{ canceled: boolean; filePath?: string }>;
            readFile: (filePath: string) => Promise<{
                success: boolean;
                content?: string;
                error?: string;
            }>;
            writeFile: (
                filePath: string,
                content: string
            ) => Promise<{ success: boolean; error?: string }>;
        };
        versions: {
            chrome: () => string;
            node: () => string;
            electron: () => string;
        };
    }
}
