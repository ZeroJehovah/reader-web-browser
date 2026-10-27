# ReaderWebBrowser（Electron 版）

这是原 Java + JXBrowser + Swing 实现的 1:1 功能复刻版，改为 Electron + Chromium。原 Java 实现保留在 `main` 分支；本分支（`feat/electron`）在 `src/`、`pom.xml`、`lib/*.jar` 中保留原 Java 实现作为对照，Electron 实现位于 `main.js`、`lib/*.js` 与 `app-resources/`。

## 功能对照

| 功能 | Java 版 | Electron 版 |
|---|---|---|
| 无边框窗口 | `Window.Type.UTILITY` + `setUndecorated(true)` | `frame:false` + `type:'toolbar'` + `skipTaskbar` |
| 窗口位置/尺寸 | `config.properties` 的 width/height/offsetX/offsetY | 同一配置键名；通过托盘 `Resize Window...` 自定义宽高，并自动写回配置 |
| 失焦隐藏 | `windowLostFocus` -> `hideWindow()` | `blur` -> `win.hide()` |
| 托盘图标 | AWT `SystemTray` + 16x16 PNG | Electron `Tray` + 同一 16x16 PNG |
| 托盘左键点击 | 切换窗口显示/隐藏 | `tray.on('click')` 切换 |
| 托盘右键菜单 | Reload / Exit | Reload / Exit（标签一致） |
| 页面加载完成注入 CSS | `FrameLoadFinished(main)` -> `executeJavaScript` | `did-finish-load` -> `executeJavaScript` |
| CSS 注入方式 | 读 `js/injectCss.js` + `css/style.css`，Java `String.format` 填入 `%s` | 相同模板与转义规则 |
| 外部文件覆盖 | jar 同目录优先于 jar 内 | 可执行文件同目录优先于打包内资源 |
| 新窗口/弹窗 | JXBrowser Swing 默认为弹窗新建 JFrame | `setWindowOpenHandler` 手动创建 BrowserWindow，跟随页面声明的尺寸 |
| 页面右键菜单 | 无（JXBrowser 默认不显示） | `context-menu` 事件 preventDefault |
| 退出 | `System.exit(0)` / `EXIT_ON_CLOSE` | `app.quit()` |

窗口完成移动或通过托盘调整尺寸后，Electron 版会把最新的 `offsetX`、`offsetY`、`width`、`height` 写回**外部** `config.properties`。窗口保持无边框、无系统阴影和无圆角；托盘右键菜单中的 `Resize Window...` 可输入新的宽度和高度。写入保留原有注释、其他配置项和换行格式；如果外部文件尚不存在，会以打包内的默认配置为模板，在 exe 同目录生成该文件。开发态对应仓库根目录的 `config.properties`。

## 目录结构

```text
main.js                      主进程：窗口、托盘、加载、注入
lib/resources.js             外部文件覆盖 + 打包内默认资源解析
lib/config.js                config.properties 解析（Java Properties 格式）
lib/inject.js                injectCss 模板渲染（对齐 Java String.format 语义）
app-resources/               打包内默认资源（config/css/js/icon）
```

## 开发运行

```bash
npm install
npm start
npm test
```

开发态外部覆盖目录为仓库根目录（即 `package.json` 所在目录），等价于 Java 版“jar 同目录”。

## 打包

```bash
npm run dist            # 生成 release/reader-web-browser-3.0.0-portable.exe
npm run dist:dir        # 只生成目录，便于快速验证
```

打包后把 `config.properties`、`css/style.css`、`js/injectCss.js` 放到 exe 同目录即可覆盖默认值，语义与 Java 版完全一致。

## 日志

与 Java 版保持相同的输出格式，便于对照：

```text
读取文件: config.properties, 使用内部文件: D:\...\app-resources\config.properties
url: http://...
width: 400
```

Java 版会把 `read()` 读到的每一行也打印出来，这里没有复刻这个行为（它只是调试输出，不参与功能）。如需查看注入脚本内容，把 `lib/inject.js` 的日志打开即可。
