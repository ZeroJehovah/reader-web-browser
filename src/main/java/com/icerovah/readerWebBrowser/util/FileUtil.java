package com.icerovah.readerWebBrowser.util;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class FileUtil {

    public static String read(String filePath) throws IOException {
        StringBuilder result = new StringBuilder();
        InputStream inputStream = FileUtil.class.getClassLoader().getResourceAsStream(filePath);

        if (inputStream == null) {
            System.out.println("read " + filePath + " is null");
            return "";
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            System.out.println("================");
            System.out.println("load " + filePath + ":");
            System.out.println("================");
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
                result.append(line).append("\n"); // 拼接每一行并用换行符分隔
            }
        }

        return result.toString();
    }

}
