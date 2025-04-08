package com.icerovah.readerWebBrowser.config;

import com.icerovah.readerWebBrowser.util.FileUtil;

import java.io.IOException;

public class Javascript {

    public static String injectCss() {
        try {
            String changeStyle = FileUtil.read("js/injectCss.js");
            String css = Style.css();
            css = css.replaceAll("'", "\\\\'").replaceAll("\\s+", " ");
            return String.format(changeStyle, css);
        } catch (IOException ignore) {
            return "";
        }
    }

}
