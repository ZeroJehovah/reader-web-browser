package com.icerovah.readerWebBrowser.config;

import com.icerovah.readerWebBrowser.consts.FilePath;
import com.icerovah.readerWebBrowser.util.FileUtil;

import java.io.IOException;

public class Style {

    public static String css() {
        try {
            return FileUtil.read(FilePath.CSS_STYLE);
        } catch (IOException ignore) {
            return "";
        }
    }

}
