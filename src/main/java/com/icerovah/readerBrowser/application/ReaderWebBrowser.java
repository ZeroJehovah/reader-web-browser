package com.icerovah.readerBrowser.application;

import com.icerovah.readerBrowser.config.Javascript;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import javafx.stage.StageStyle;

import javafx.scene.image.Image;

import java.util.Objects;

import static com.icerovah.readerBrowser.config.Config.*;

public class ReaderWebBrowser extends Application {

    @Override
    public void start(Stage primaryStage) {
        // 创建 WebView 并加载网页
        WebView webView = createWebView();

        // 创建场景
        createWindow(primaryStage, webView);

        primaryStage.show();
    }

    private static WebView createWebView() {
        WebView webView = new WebView();
        WebEngine webEngine = webView.getEngine();
        webEngine.load(url);

        webEngine.getLoadWorker().stateProperty().addListener((observable, oldValue, newValue) -> {
            if (newValue == javafx.concurrent.Worker.State.SUCCEEDED) {
                webEngine.executeScript(Javascript.changeStyle());
                webEngine.executeScript(Javascript.smoothScroll());
            }
        });

        return webView;
    }

    private static void createWindow(Stage primaryStage, WebView webView) {
        Scene scene = new Scene(webView, width, height);
        primaryStage.setScene(scene);
        // 设置窗口样式为 UNDECORATED，使窗口不显示标题栏和边框
        primaryStage.initStyle(StageStyle.UNDECORATED);

        // 设置窗口在屏幕上的位置
        primaryStage.setX(offsetX);
        primaryStage.setY(offsetY);

        // 设置窗口标题
        primaryStage.setTitle("此电脑");

        // 设置窗口图标
        // 这里假设你有一个名为 icon.png 的图标文件在项目根目录下
        String iconPath = "/favicon.png";
        Image icon = new Image(Objects.requireNonNull(ReaderWebBrowser.class.getResourceAsStream(iconPath)));
        primaryStage.getIcons().add(icon);

        // 监听窗口焦点事件
        primaryStage.focusedProperty().addListener((observable, oldValue, newValue) -> {
            if (!newValue) { // 如果窗口失去焦点
                primaryStage.setIconified(true); // 将窗口最小化
            }
        });
    }

}
