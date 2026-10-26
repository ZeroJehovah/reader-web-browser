'use strict';

const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
const { readConfig } = require('./lib/config');
const { injectCss } = require('./lib/inject');
const { resolveResource, readResourceBuffer } = require('./lib/resources');

const TRAY_TOOLTIP = 'ReaderWebBrowser';

let win = null;
let tray = null;
let config = null;
let injectScript = null;
let isWindowVisible = false;

function loadTrayIcon() {
  // 打包后 app-resources 在 asar 内，部分 nativeImage 场景需要显式读字节。
  try {
    return nativeImage.createFromBuffer(readResourceBuffer('icon/favicon.png'));
  } catch (err) {
    return nativeImage.createFromPath(resolveResource('icon/favicon.png'));
  }
}

function initConfig() {
  // 对齐 Java 版 Main.main()：Config.read() 失败即退出。
  config = readConfig();
}

function initWindow() {
  win = new BrowserWindow({
    width: config.width,
    height: config.height,
    x: config.offsetX,
    y: config.offsetY,
    // Java: frame.setType(Window.Type.UTILITY) + setUndecorated(true)
    frame: false,
    // Java: Window.Type.UTILITY 不占任务栏、不可最小化/最大化
    type: 'toolbar',
    skipTaskbar: true,
    minimizable: false,
    maximizable: false,
    fullScreenable: false,
    // Java: 未设置 resizable，Undecorated JFrame 无法拖边缩放
    resizable: false,
    hasShadow: false,
    thickFrame: false,
    backgroundColor: '#ffffff',
    title: TRAY_TOOLTIP,
    icon: loadTrayIcon(),
    show: false,
    webPreferences: {
      // Java 版没有 Node/本地能力暴露，保持隔离。
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: false
    }
  });

  suppressContextMenu(win.webContents);

  // Java: setUndecorated(true) 后窗口无标题栏、无最大化按钮
  win.setMenu(null);
  win.removeMenu();

  // 对齐 Java：退出即整个进程退出。
  win.on('closed', () => {
    app.quit();
  });

  // Java: windowLostFocus -> hideWindow()
  win.on('blur', () => {
    hideWindow();
  });

  // Java: FrameLoadFinished(main) -> executeJavaScript(injectCss)
  win.webContents.on('did-finish-load', () => {
    // Java 版每次 FrameLoadFinished 都会重新读取外部 css/js，保持一致。
    injectScript = injectCss();
    if (!injectScript) return;
    // executeJavaScript 会把脚本完成值传回主进程；injectCss.js 末尾是
    // window.onload = function ...，完成值是一个函数，无法结构化克隆。
    // Java 版 executeJavaScript 不回传结果，所以这里补一个 ;undefined; 拿到 undefined。
    win.webContents.executeJavaScript(injectScript + '\n;undefined;').catch((err) => {
      process.stderr.write('注入 CSS 失败: ' + (err && err.message) + '\n');
    });
  });

  // JXBrowser 的 Swing 默认 callback 会为弹窗创建独立窗口（DefaultOpenPopupCallback
  // 新建一个 JFrame），因此这里同样允许新窗口弹出；窗口特性沿用页面声明。
  win.webContents.setWindowOpenHandler(({ url: popupUrl, features }) => {
    const match = features.match(/(width|height)=(\d+)/g) || [];
    const size = {};
    for (const item of match) {
      const [key, value] = item.split('=');
      size[key] = Number.parseInt(value, 10);
    }
    const popup = new BrowserWindow({
      width: size.width || 800,
      height: size.height || 600,
      useContentSize: true,
      autoHideMenuBar: true,
      backgroundColor: '#ffffff',
      icon: loadTrayIcon(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        devTools: false
      }
    });
    popup.setMenu(null);
    popup.removeMenu();
    suppressContextMenu(popup.webContents);
    popup.loadURL(popupUrl);
    popup.on('closed', () => {});
    return { action: 'deny' }; // 已手动创建窗口，阻止 Electron 再建一个。
  });
}

function showWindow() {
  win.show();
  win.focus();
  isWindowVisible = true;
}

function hideWindow() {
  win.hide();
  isWindowVisible = false;
}

function loadWebPage() {
  showWindow();
  // Java: browser.navigation().loadUrl(url)
  win.loadURL(config.url).catch((err) => {
    process.stderr.write('loadURL 失败: ' + (err && err.message) + '\n');
  });
}

function toggleWindow() {
  if (isWindowVisible) hideWindow();
  else showWindow();
}

function initSystemTray() {
  tray = new Tray(loadTrayIcon());
  tray.setToolTip(TRAY_TOOLTIP);

  const menu = Menu.buildFromTemplate([
    {
      label: 'Reload',
      click: () => loadWebPage()
    },
    {
      label: 'Exit',
      click: () => app.quit()
    }
  ]);
  tray.setContextMenu(menu);

  // Java: TrayIcon mouseClicked BUTTON1 -> 切换窗口显示
  tray.on('click', () => toggleWindow());
}

// JXBrowser 默认不显示页面右键菜单（无自定义菜单时直接 close），
// Electron 默认菜单与原生不同，这里统一禁用以对齐原版行为。
function suppressContextMenu(webContents) {
  webContents.on('context-menu', (event) => {
    event.preventDefault();
  });
}

app.whenReady().then(() => {
  initConfig();
  initWindow();
  loadWebPage();
  initSystemTray();
}).catch((err) => {
  process.stderr.write('启动失败: ' + (err && err.stack || err) + '\n');
  app.exit(1);
});

app.on('window-all-closed', () => {
  // Java: EXIT_ON_CLOSE —— 窗口关闭即进程退出。
  app.quit();
});
