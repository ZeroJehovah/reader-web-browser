'use strict';

const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen } = require('electron');
const path = require('path');
const { readConfig, saveWindowBounds } = require('./lib/config');
const { injectCss } = require('./lib/inject');
const { resolveResource, readResourceBuffer } = require('./lib/resources');
const { normalizeWindowBounds } = require('./lib/windowBounds');

const TRAY_TOOLTIP = 'ReaderWebBrowser';
const WINDOW_BOUNDS_SAVE_DELAY = 200;

let win = null;
let tray = null;
let configDialog = null;
let config = null;
let injectScript = null;
let isWindowVisible = false;
let windowBoundsSaveTimer = null;
let lastSavedWindowBounds = null;
let windowAlwaysOnTopBeforeConfig = null;

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
    // 保持无边框、无原生缩放框，避免 Windows 阴影、边框和圆角。
    resizable: false,
    hasShadow: false,
    thickFrame: false,
    roundedCorners: false,
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

  lastSavedWindowBounds = win.getBounds();

  // 移动过程和托盘调整尺寸后都可靠落盘。
  win.on('move', scheduleWindowBoundsSave);
  win.on('resize', scheduleWindowBoundsSave);
  win.on('moved', scheduleWindowBoundsSave);
  win.on('resized', scheduleWindowBoundsSave);
  win.on('close', flushWindowBounds);

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

function assertConfigDialogSender(event) {
  if (!configDialog || configDialog.isDestroyed() || event.sender !== configDialog.webContents) {
    throw new Error('invalid config dialog sender');
  }
}

function closeConfigDialog() {
  const dialog = configDialog;
  configDialog = null;
  if (dialog && !dialog.isDestroyed()) dialog.close();
  restoreWindowTopState();
}

function keepBrowserVisibleForConfig() {
  if (windowAlwaysOnTopBeforeConfig === null && win && !win.isDestroyed()) {
    windowAlwaysOnTopBeforeConfig = win.isAlwaysOnTop();
    win.setAlwaysOnTop(true);
  }
  showWindow();
  win.moveTop();
}

function restoreWindowTopState() {
  if (windowAlwaysOnTopBeforeConfig === null) return;
  if (win && !win.isDestroyed()) {
    win.setAlwaysOnTop(windowAlwaysOnTopBeforeConfig);
  }
  windowAlwaysOnTopBeforeConfig = null;
}

function getWindowConfig() {
  const bounds = win.getBounds();
  return {
    offsetX: bounds.x,
    offsetY: bounds.y,
    width: bounds.width,
    height: bounds.height
  };
}

function updateWindowConfig(values) {
  if (!win || win.isDestroyed()) throw new Error('main window is unavailable');
  const bounds = normalizeWindowBounds(values);
  win.setBounds({
    x: bounds.offsetX,
    y: bounds.offsetY,
    width: bounds.width,
    height: bounds.height
  }, false);
  scheduleWindowBoundsSave();
  return bounds;
}

function getConfigDialogPosition(width, height) {
  const windowBounds = win.getBounds();
  const workArea = screen.getDisplayMatching(windowBounds).workArea;
  let x = windowBounds.x + windowBounds.width + 12;
  if (x + width > workArea.x + workArea.width) {
    x = windowBounds.x - width - 12;
  }
  x = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - width));
  const y = Math.max(workArea.y, Math.min(windowBounds.y, workArea.y + workArea.height - height));
  return { x, y };
}

function openConfigDialog() {
  keepBrowserVisibleForConfig();
  if (configDialog && !configDialog.isDestroyed()) {
    configDialog.show();
    configDialog.focus();
    return;
  }

  const width = 400;
  const height = 340;
  const position = getConfigDialogPosition(width, height);
  const dialog = new BrowserWindow({
    width,
    height,
    useContentSize: true,
    x: position.x,
    y: position.y,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    thickFrame: false,
    roundedCorners: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    autoHideMenuBar: true,
    backgroundColor: '#f7f7f8',
    title: 'Config',
    icon: loadTrayIcon(),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'lib', 'config-dialog-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: false
    }
  });
  configDialog = dialog;

  dialog.setMenu(null);
  dialog.removeMenu();
  dialog.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  dialog.once('ready-to-show', () => {
    if (configDialog !== dialog || dialog.isDestroyed()) return;
    dialog.show();
    dialog.focus();
  });
  dialog.on('closed', () => {
    if (configDialog === dialog) configDialog = null;
    restoreWindowTopState();
  });
  dialog.loadFile(resolveResource('config-dialog.html')).catch((err) => {
    process.stderr.write('加载窗口配置对话框失败: ' + (err && err.message) + '\n');
    if (configDialog === dialog) closeConfigDialog();
  });
}

ipcMain.handle('window-config:get', (event) => {
  assertConfigDialogSender(event);
  return getWindowConfig();
});

ipcMain.handle('window-config:update', (event, values) => {
  assertConfigDialogSender(event);
  return updateWindowConfig(values);
});

ipcMain.on('window-config:close', (event) => {
  assertConfigDialogSender(event);
  closeConfigDialog();
  flushWindowBounds();
});

function sameBounds(left, right) {
  return left && right && left.x === right.x && left.y === right.y &&
    left.width === right.width && left.height === right.height;
}

function flushWindowBounds() {
  if (windowBoundsSaveTimer) {
    clearTimeout(windowBoundsSaveTimer);
    windowBoundsSaveTimer = null;
  }
  if (!win || win.isDestroyed()) return;

  const bounds = win.getBounds();
  if (sameBounds(bounds, lastSavedWindowBounds)) return;

  try {
    saveWindowBounds(bounds);
    lastSavedWindowBounds = bounds;
    config.width = bounds.width;
    config.height = bounds.height;
    config.offsetX = bounds.x;
    config.offsetY = bounds.y;
  } catch (err) {
    process.stderr.write('保存窗口配置失败: ' + (err && err.message) + '\n');
  }
}

function scheduleWindowBoundsSave() {
  if (configDialog && !configDialog.isDestroyed()) {
    configDialog.webContents.send('window-config:changed', getWindowConfig());
  }
  if (windowBoundsSaveTimer) clearTimeout(windowBoundsSaveTimer);
  windowBoundsSaveTimer = setTimeout(() => {
    windowBoundsSaveTimer = null;
    flushWindowBounds();
  }, WINDOW_BOUNDS_SAVE_DELAY);
}

function showWindow() {
  win.show();
  win.focus();
  isWindowVisible = true;
}

function hideWindow() {
  // 配置窗口打开时始终保留浏览器窗口，方便实时查看调整效果。
  if (configDialog && !configDialog.isDestroyed()) return;
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
      label: 'Config',
      click: () => openConfigDialog()
    },
    { type: 'separator' },
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

app.on('before-quit', () => {
  flushWindowBounds();
});

app.on('window-all-closed', () => {
  // Java: EXIT_ON_CLOSE —— 窗口关闭即进程退出。
  app.quit();
});
