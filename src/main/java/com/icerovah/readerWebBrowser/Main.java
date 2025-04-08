package com.icerovah.readerWebBrowser;

import com.icerovah.readerWebBrowser.application.ReaderWebBrowser;
import com.icerovah.readerWebBrowser.config.Config;

import java.io.IOException;

public class Main {

    public static void main(String[] args) throws IOException {
        Config.read();
        ReaderWebBrowser.launch();
    }

}