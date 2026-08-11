"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
// @ts-ignore
const electron_1 = require("electron");
const package_json_1 = __importDefault(require("../package.json"));
const path_1 = require("path");
let mainWindow = null;
let mainWindowId = 0;
const createWindow = (url, options) => {
    options = options || {};
    let wndOptions = {
        //窗口宽度
        width: 500,
        //窗口高度
        height: 500,
        minWidth: 500,
        minHeight: 200,
        //窗口是否有边框
        frame: true,
        //窗口是否透明
        transparent: false,
        // //窗口是否最大化
        // maximizable: false,
        //窗口是否全屏
        fullscreenable: false,
        //
        skipTaskbar: false,
        //窗口是否有阴影
        hasShadow: true,
        //窗口是否置顶
        alwaysOnTop: false,
        //窗口大小是否可以调整
        // resizable: false,
        //窗口图标
        icon: 'assets/logo.ico',
        // 隐藏菜单栏
        autoHideMenuBar: true,
        title: `Window`,
        // 
        show: false,
        //网页功能
        webPreferences: {
            //是否启动node
            nodeIntegration: true,
            //是否在独立 JavaScript 环境中运行 Electron API和指定的preload 脚本
            contextIsolation: false,
            // 
            enableRemoteModule: true,
        }
    };
    Object.getOwnPropertyNames(options).forEach(key => {
        wndOptions[key] = options[key];
    });
    let win = new electron_1.BrowserWindow(wndOptions);
    win.on('ready-to-show', () => {
        // console.log('ready to show');
        win.show();
    });
    win.loadURL(url);
    // 监听按键
    win.webContents.on('before-input-event', (event, input) => {
        if (input.type != 'keyUp') {
            return;
        }
        if (input.key == 'F5') {
            win.reload();
        }
        if (input.key == 'F12') {
            if (!win.webContents.isDevToolsOpened()) {
                win.webContents.openDevTools({ mode: 'detach' });
            }
        }
        if (input.key == 'Escape') {
            win.close();
        }
    });
    return win;
};
/**
 * @en
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    openPanel() {
        let tmpWin = electron_1.BrowserWindow.fromId(mainWindowId);
        if (tmpWin != null) {
            mainWindow = tmpWin;
            mainWindow.show();
            return;
        }
        const path = `file://${__dirname}/../static/index.html?projectPath=${Editor.Project.path}`;
        mainWindow = createWindow(path, {
            title: 'BMFont生成工具',
            resizable: false,
            //窗口宽度
            width: 500,
            //窗口高度
            height: 590,
        });
        mainWindowId = mainWindow.id;
    },
};
/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
function load() {
    console.log('load');
    registerEvents();
}
exports.load = load;
/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
function unload() {
    console.log('unload');
    if (mainWindow != null) {
        mainWindow.close();
        mainWindow = null;
    }
    unregisterEvents();
}
exports.unload = unload;
const registerEvents = () => {
    unregisterEvents();
    electron_1.ipcMain.handle(`${package_json_1.default.name}:open-dialog`, (evt, options) => {
        options = options || {};
        const path = electron_1.dialog.showSaveDialogSync({
            title: options.title || '保存BMFont',
            defaultPath: options.defaultPath || (0, path_1.join)(Editor.Project.path, "assets"),
            filters: options.filters || [
                { name: 'BMFont', extensions: ['fnt'] },
            ],
        });
        return path;
    });
};
const unregisterEvents = () => {
    electron_1.ipcMain.removeHandler(`${package_json_1.default.name}:open-dialog`);
};
