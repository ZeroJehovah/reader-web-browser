package com.icerovah.readerBrowser.config;

import com.icerovah.readerBrowser.util.FileUtil;

import java.io.IOException;

public class Javascript {

    public static String changeStyle() {
        try {
            String changeStyle = FileUtil.read("js/changeStyle.js");
            return String.format(changeStyle, Style.css());
        } catch (IOException ignore) {
            return "";
        }
    }

    public static String smoothScroll() {
        try {
            return FileUtil.read("js/smoothScroll.js");
        } catch (IOException ignore) {
            return "";
        }
    }

}
