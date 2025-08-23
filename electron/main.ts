import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "url";

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 禁用硬件加速以减少某些系统上的问题
// app.disableHardwareAcceleration()

// 应用是否应该退出的标志
let isQuitting = false;

// 主窗口引用
let mainWindow: BrowserWindow | null = null;

// 创建主窗口的函数
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
        show: false, // 初始不显示窗口，等加载完成后显示
    });

    // 加载应用的 index.html
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        // 开发模式下打开开发者工具
        mainWindow.webContents.openDevTools();
    } else {
        // 生产环境下加载打包后的文件
        mainWindow.loadFile(path.join(process.env.DIST || "", "index.html"));
    }

    // 窗口准备好后显示
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });

    // 窗口关闭时清除引用
    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    // 处理窗口关闭事件
    mainWindow.on("close", (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
            return false;
        }
        return true;
    });
}

// 当Electron完成初始化时创建窗口
app.whenReady().then(() => {
    createWindow();

    // 设置应用菜单
    setupMenu();

    // 设置IPC通信
    setupIPC();
});

// 当所有窗口关闭时退出应用（Windows & Linux）
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

// 应用退出前
app.on("before-quit", () => {
    isQuitting = true;
});

// 设置应用菜单
function setupMenu() {
    // 可以在这里设置应用菜单
}

// 设置IPC通信
function setupIPC() {
    // 打开文件对话框
    ipcMain.handle("dialog:openFile", async () => {
        if (!mainWindow) return { canceled: true };

        const { canceled, filePaths } = await dialog.showOpenDialog(
            mainWindow,
            {
                properties: ["openFile"],
                filters: [
                    { name: "Markdown Files", extensions: ["md"] },
                    { name: "All Files", extensions: ["*"] },
                ],
            }
        );

        if (canceled || filePaths.length === 0) {
            return { canceled: true };
        }

        return { canceled: false, filePath: filePaths[0] };
    });

    // 保存文件对话框
    ipcMain.handle("dialog:saveFile", async (_, defaultPath) => {
        if (!mainWindow) return { canceled: true };

        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            defaultPath,
            filters: [
                { name: "Markdown Files", extensions: ["md"] },
                { name: "All Files", extensions: ["*"] },
            ],
        });

        if (canceled || !filePath) {
            return { canceled: true };
        }

        return { canceled: false, filePath };
    });

    // 读取文件内容
    ipcMain.handle("file:read", async (_, filePath) => {
        try {
            const content = await fs.readFile(filePath, "utf-8");
            return { success: true, content };
        } catch (error) {
            console.error("Error reading file:", error);
            return { success: false, error: (error as Error).message };
        }
    });

    // 写入文件内容
    ipcMain.handle("file:write", async (_, filePath, content) => {
        try {
            await fs.writeFile(filePath, content, "utf-8");
            return { success: true };
        } catch (error) {
            console.error("Error writing file:", error);
            return { success: false, error: (error as Error).message };
        }
    });
}
