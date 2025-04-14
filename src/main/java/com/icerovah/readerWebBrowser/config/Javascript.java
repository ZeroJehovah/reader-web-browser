package com.icerovah.readerWebBrowser.config;

import com.icerovah.readerWebBrowser.consts.FilePath;
import com.icerovah.readerWebBrowser.util.FileUtil;

import java.io.IOException;

public class Javascript {

    public static String injectCss() {
        try {
            String injectCss = FileUtil.read(FilePath.JS_INJECT_CSS);
            String css = Style.css();
            css = css.replaceAll("'", "\\\\'").replaceAll("\\s+", " ");
            return String.format(injectCss, css);
        } catch (IOException ignore) {
            return "";
        }
    }

}
