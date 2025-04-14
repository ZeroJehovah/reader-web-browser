package com.icerovah.readerWebBrowser.util;

import java.io.*;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

public class FileUtil {

    private static final File PARENT_DIR;

    static {
        // 获取 JAR 包所在的目录
        URL jarLocation = FileUtil.class.getProtectionDomain().getCodeSource().getLocation();
        try {
            File jarFile = new File(jarLocation.toURI());
            PARENT_DIR = jarFile.getParentFile();
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
    }

    public static URL getResource(String path) throws IOException {
        System.out.printf("读取文件: %s, ", path);
        URL fileUrl;

        // 检查 JAR 包同目录下是否存在指定文件
        File externalFile = new File(PARENT_DIR, path);
        if (externalFile.exists() && externalFile.isFile()) {
            // 如果存在，则返回该文件的输入流
            fileUrl = externalFile.toURI().toURL();
            System.out.print("使用外部文件: ");
        } else {
            // 如果不存在，则使用jar包内部文件
            fileUrl = FileUtil.class.getClassLoader().getResource(path);
            assert fileUrl != null;
            System.out.print("使用内部文件: ");
        }

        System.out.println(URLDecoder.decode(fileUrl.toString(), "UTF-8"));
        return fileUrl;
    }

    public static InputStream getResourceAsStream(String path) throws IOException {
        return getResource(path).openStream();
    }

    public static String read(String filePath) throws IOException {
        StringBuilder result = new StringBuilder();
        try (InputStream inputStream = getResourceAsStream(filePath)) {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    System.out.println(line);
                    result.append(line).append("\n"); // 拼接每一行并用换行符分隔
                }
            }
        }

        return result.toString();
    }

}
