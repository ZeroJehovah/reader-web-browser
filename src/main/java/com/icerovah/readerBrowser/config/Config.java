package com.icerovah.readerBrowser.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class Config {

    public static String url;
    public static int width;
    public static int height;
    public static int offsetX;
    public static int offsetY;

    public static void read() throws IOException {
        Properties properties = new Properties();
        try (InputStream inputStream = Config.class.getClassLoader().getResourceAsStream("config.properties")) {
            // 加载配置文件
            properties.load(inputStream);
            // 获取配置项
            url = properties.getProperty("url");
            width = Integer.parseInt(properties.getProperty("width"));
            height = Integer.parseInt(properties.getProperty("height"));
            offsetX = Integer.parseInt(properties.getProperty("offsetX"));
            offsetY = Integer.parseInt(properties.getProperty("offsetY"));

            System.out.println("url: " + url);
            System.out.println("width: " + width);
            System.out.println("height: " + height);
            System.out.println("offsetX: " + offsetX);
            System.out.println("offsetY: " + offsetY);
        }
    }

}
