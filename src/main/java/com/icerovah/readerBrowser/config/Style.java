package com.icerovah.readerBrowser.config;

import com.icerovah.readerBrowser.util.FileUtil;

import java.io.IOException;

public class Style {

    public static String css() {
        try {
            String css = FileUtil.read("css/style.css");
            return css.replaceAll("'", "\\\\'").replaceAll("\\s+", " ");
        } catch (IOException ignore) {
            return "";
        }
    }

}
