package com.icerovah.readerWebBrowser.application;

import com.icerovah.readerWebBrowser.config.Javascript;
import com.icerovah.readerWebBrowser.consts.FilePath;
import com.icerovah.readerWebBrowser.util.FileUtil;
import com.teamdev.jxbrowser.browser.Browser;
import com.teamdev.jxbrowser.engine.Engine;
import com.teamdev.jxbrowser.engine.EngineOptions;
import com.teamdev.jxbrowser.navigation.event.FrameLoadFinished;
import com.teamdev.jxbrowser.view.swing.BrowserView;

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.io.IOException;
import java.net.URL;

import static com.icerovah.readerWebBrowser.config.Config.*;
import static com.teamdev.jxbrowser.engine.RenderingMode.HARDWARE_ACCELERATED;

public class ReaderWebBrowser {

    private static JFrame frame;
    private static boolean isWindowVisible;
    private static Engine engine;
    private static Browser browser;

    public static void launch() throws IOException {
        // 初始化窗口
        initFrame();

        // 初始化浏览器引擎
        initEngine();

        // 初始化浏览器
        initBrowser();

        // 打开网页
        loadWebPage();

        // 初始化托盘图标
        initSystemTray();
    }

    private static void initFrame() {
        frame = new JFrame();
        frame.setType(Window.Type.UTILITY);
        frame.setUndecorated(true);
        frame.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        frame.setLocationRelativeTo(null);
        frame.setLocation(offsetX, offsetY);
        frame.setSize(width, height);

        // 为窗口添加焦点监听器
        frame.addWindowFocusListener(new WindowAdapter() {
            @Override
            public void windowLostFocus(WindowEvent e) {
                hideWindow();
            }
        });
    }

    private static void initEngine() {
        EngineOptions options = EngineOptions.newBuilder(HARDWARE_ACCELERATED).build();
        engine = Engine.newInstance(options);
    }

    private static void initBrowser() {
        // 创建浏览器实例
        browser = engine.newBrowser();
        BrowserView browserView = BrowserView.newInstance(browser);
        frame.add(browserView, BorderLayout.CENTER);

        browser.navigation().on(FrameLoadFinished.class, event -> {
            if (event.frame().isMain()) {
                // 页面加载完成后，通过js注入css
                browser.mainFrame().ifPresent(frame -> frame.executeJavaScript(Javascript.injectCss()));
            }
        });
    }

    private static void loadWebPage() {
        showWindow();
        // 加载网页
        browser.navigation().loadUrl(url);
    }

    private static void initSystemTray() throws IOException {
        SystemTray tray = SystemTray.getSystemTray();

        // 创建一个弹出菜单，添加退出按钮
        PopupMenu popup = new PopupMenu();
        MenuItem reloadMenu = new MenuItem("Reload");
        reloadMenu.addActionListener(event -> loadWebPage());
        popup.add(reloadMenu);
        MenuItem exitMenu = new MenuItem("Exit");
        exitMenu.addActionListener(event -> System.exit(0));
        popup.add(exitMenu);

        // 创建托盘图标
        TrayIcon trayIcon = createTrayIcon(popup);

        try {
            // 将托盘图标添加到系统托盘
            tray.add(trayIcon);
        } catch (AWTException ex) {
            System.err.println("无法添加托盘图标: " + ex);
        }
    }

    private static TrayIcon createTrayIcon(PopupMenu popup) throws IOException {
        TrayIcon trayIcon = new TrayIcon(getIconFromResources(), "ReaderWebBrowser", popup);

        // 为托盘图标添加鼠标点击事件监听器
        trayIcon.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                if (e.getButton() == MouseEvent.BUTTON1) {
                    if (isWindowVisible) {
                        hideWindow();
                    } else {
                        showWindow();
                    }
                }
            }
        });
        return trayIcon;
    }

    private static java.awt.Image getIconFromResources() throws IOException {
        // 获取图片资源的 URL
        URL iconUrl = FileUtil.getResource(FilePath.TRAY_ICON);
        // 使用 Toolkit 加载图片
        return Toolkit.getDefaultToolkit().getImage(iconUrl);
    }

    private static void showWindow() {
        frame.setVisible(true);
        isWindowVisible = true;
    }

    private static void hideWindow() {
        frame.setVisible(false);
        isWindowVisible = false;
    }

}
